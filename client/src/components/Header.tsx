import React from 'react';
import { Grid, Users, RefreshCw, WifiOff, User, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  connectionState: 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';
  onlineCount: number;
  currentUser: UserProfile | null;
  onOpenOnlinePlayers: () => void;
  onOpenUserModal: () => void;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  onlineCount,
  currentUser,
  onOpenOnlinePlayers,
  onOpenUserModal,
  onReconnect,
}) => {
  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        {/* Left: App Brand & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Grid className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white font-sans flex items-center gap-1.5">
                PIXEL GRID
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block font-medium">
              30 × 30 Real-Time Shared Canvas • 900 Interactive Blocks
            </p>
          </div>
        </div>

        {/* Right Controls & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Badge */}
          {connectionState === 'connected' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Connected</span>
            </div>
          )}

          {(connectionState === 'connecting' || connectionState === 'reconnecting') && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}</span>
            </div>
          )}

          {(connectionState === 'disconnected' || connectionState === 'error') && (
            <button
              onClick={onReconnect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold transition-all shadow-sm"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
              <span className="underline ml-1 font-bold">Retry</span>
            </button>
          )}

          {/* Online Players Button */}
          <button
            onClick={onOpenOnlinePlayers}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-slate-200 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{onlineCount} Online</span>
          </button>

          {/* User Profile Badge */}
          {currentUser ? (
            <button
              onClick={onOpenUserModal}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 group"
            >
              <span
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shadow-sm shrink-0 group-hover:scale-110 transition-all"
                style={{ backgroundColor: currentUser.color }}
              />
              <span className="max-w-[120px] truncate font-semibold text-slate-200">
                {currentUser.username}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenUserModal}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Join Grid</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
