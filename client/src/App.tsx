import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from './hooks/useSocket';
import { useAudio } from './hooks/useAudio';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { CooldownBar } from './components/CooldownBar';
import { GridCanvas } from './components/GridCanvas';
import { ClaimModal } from './components/ClaimModal';
import { Leaderboard } from './components/Leaderboard';
import { ActivityFeed } from './components/ActivityFeed';
import { UserLoginModal } from './components/UserLoginModal';
import { OnlinePlayersModal } from './components/OnlinePlayersModal';
import { ToastContainer } from './components/ToastContainer';
import { BlockData, UserProfile } from './types';
import { Info, ShieldAlert, Sparkles } from 'lucide-react';

export function App() {
  // Load saved user from localStorage
  const savedUser = useMemo<UserProfile | null>(() => {
    try {
      const data = localStorage.getItem('pixelgrid_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const {
    connectionState,
    currentUser,
    grid,
    leaderboard,
    stats,
    activities,
    onlinePlayers,
    userCursors,
    cooldownEnd,
    toastNotification,
    setToastNotification,
    joinGrid,
    claimBlock,
    sendCursorMove,
    resetGrid,
    reconnect,
  } = useSocket(savedUser);

  const { playCaptureSound, playConflictSound, playJoinSound } = useAudio();

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!savedUser);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);

  // Play audio on toast notification updates
  useEffect(() => {
    if (toastNotification) {
      if (toastNotification.type === 'success') {
        playCaptureSound();
      } else if (toastNotification.type === 'warning' || toastNotification.type === 'error') {
        playConflictSound();
      } else if (toastNotification.type === 'info') {
        playJoinSound();
      }
    }
  }, [toastNotification, playCaptureSound, playConflictSound, playJoinSound]);

  // Count blocks owned by current user
  const userBlocksCount = useMemo(() => {
    if (!currentUser) return 0;
    return grid.filter((b) => b.ownerId === currentUser.id).length;
  }, [grid, currentUser]);

  // Handle User Join from Login Modal
  const handleUserJoin = (username: string, color: string) => {
    joinGrid(username, color);
    setIsLoginModalOpen(false);
  };

  // Handle Block Click on Grid Canvas
  const handleSelectBlock = (block: BlockData) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedBlock(block);
  };

  // Confirm Block Capture
  const handleConfirmClaim = (blockId: number, previousOwnerId: string | null) => {
    claimBlock(blockId, previousOwnerId);
    setSelectedBlock(null);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sleek Glassmorphism Header */}
      <Header
        connectionState={connectionState}
        onlineCount={stats.onlineUsersCount}
        currentUser={currentUser}
        onOpenOnlinePlayers={() => setIsOnlineModalOpen(true)}
        onOpenUserModal={() => setIsLoginModalOpen(true)}
        onReconnect={reconnect}
      />

      {/* Main Fluid Responsive Layout Container */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 lg:px-8 py-5 flex flex-col gap-5">
        {/* Top Global Statistics Metric Cards */}
        <StatsBar
          stats={stats}
          userBlocksCount={userBlocksCount}
          currentUser={currentUser}
        />

        {/* 3-Second Action Cooldown Visual Indicator */}
        <CooldownBar cooldownEnd={cooldownEnd} />

        {/* Fluid Responsive Grid & Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Grid Interactive Canvas Section (Lg: 8 cols, Xl: 9 cols) */}
          <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-2.5 sm:p-4 shadow-2xl">
              <GridCanvas
                grid={grid}
                currentUser={currentUser}
                userCursors={userCursors}
                onSelectBlock={handleSelectBlock}
                onCursorMove={sendCursorMove}
                onResetGrid={resetGrid}
              />
            </div>

            {/* Gameplay Rules & Protection Footer Badge */}
            <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong className="text-slate-200">Gameplay Rule:</strong> 3-second action cooldown prevents spamming.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-medium">Atomic Backend Concurrency Active</span>
              </div>
            </div>
          </section>

          {/* Right Sidebar: Leaderboard & Activity Stream (Lg: 4 cols, Xl: 3 cols) */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
            {/* Live Leaderboard */}
            <Leaderboard
              leaderboard={leaderboard}
              currentUser={currentUser}
            />

            {/* Real-time Activity Stream */}
            <ActivityFeed activities={activities} />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950/90 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-medium">
        <p>
          PixelGrid Live • Built with React 18, Socket.IO, Express, Prisma ORM & Tailwind CSS
        </p>
      </footer>

      {/* Popups & Modals */}
      <UserLoginModal
        isOpen={isLoginModalOpen}
        onJoin={handleUserJoin}
      />

      <ClaimModal
        block={selectedBlock}
        currentUser={currentUser}
        onClose={() => setSelectedBlock(null)}
        onConfirmClaim={handleConfirmClaim}
      />

      <OnlinePlayersModal
        isOpen={isOnlineModalOpen}
        onlinePlayers={onlinePlayers}
        currentUser={currentUser}
        onClose={() => setIsOnlineModalOpen(false)}
      />

      <ToastContainer
        toast={toastNotification}
        onClose={() => setToastNotification(null)}
      />
    </div>
  );
}

export default App;
