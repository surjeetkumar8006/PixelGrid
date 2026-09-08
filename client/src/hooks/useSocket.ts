import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  UserProfile,
  BlockData,
  GlobalStats,
  LeaderboardEntry,
  ActivityItem,
  UserCursor,
} from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket(initialUser: UserProfile | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'
  >('connecting');

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser);
  const [grid, setGrid] = useState<BlockData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalBlocks: 900,
    claimedBlocks: 0,
    availableBlocks: 900,
    onlineUsersCount: 1,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<UserProfile[]>([]);
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [cooldownEnd, setCooldownEnd] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('connected');
      if (initialUser?.username) {
        socket.emit('user:join', {
          username: initialUser.username,
          color: initialUser.color,
        });
      }
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionState('error');
    });

    socket.io.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
    });

    // Initial Data Payload
    socket.on('init:data', (data) => {
      if (data.grid) setGrid(data.grid);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.stats) setStats(data.stats);
      if (data.activities) setActivities(data.activities);
      if (data.onlinePlayers) setOnlinePlayers(data.onlinePlayers);
    });

    // Confirmed User Profile
    socket.on('user:profile', (user: UserProfile) => {
      setCurrentUser(user);
      localStorage.setItem('pixelgrid_user', JSON.stringify(user));
    });

    // Block Claimed Event (Broadcasted to all users)
    socket.on(
      'block:claimed',
      (payload: {
        block: BlockData;
        activity: ActivityItem;
        previousOwnerName: string | null;
      }) => {
        const { block, activity, previousOwnerName } = payload;

        // Update grid state instantly
        setGrid((prevGrid) =>
          prevGrid.map((b) => (b.id === block.id ? block : b))
        );

        // Append to activity feed
        setActivities((prev) => [activity, ...prev.slice(0, 49)]);

        // Toast notification
        const isCurrentPlayer = currentUser?.id === block.ownerId;
        if (isCurrentPlayer) {
          setToastNotification({
            id: String(Date.now()),
            type: 'success',
            title: 'Block Captured!',
            message: `✓ Block #${block.id} is now yours!`,
          });
        } else {
          setToastNotification({
            id: String(Date.now()),
            type: 'info',
            title: 'Grid Capture',
            message: `⚡ ${block.ownerName || 'Someone'} captured Block #${block.id}`,
          });
        }
      }
    );

    // Claim Rejected (Conflict or Cooldown)
    socket.on('claim:rejected', (data: { blockId: number; reason: string }) => {
      setToastNotification({
        id: String(Date.now()),
        type: 'warning',
        title: 'Capture Failed',
        message: data.reason,
      });
    });

    // Live Updates
    socket.on('leaderboard:updated', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    socket.on('stats:updated', (data: GlobalStats) => {
      setStats(data);
    });

    socket.on('players:updated', (data: { onlineCount: number; onlinePlayers: UserProfile[] }) => {
      setOnlinePlayers(data.onlinePlayers);
      setStats((prev) => ({ ...prev, onlineUsersCount: data.onlineCount }));
    });

    socket.on('user:joined', (user: { id: string; username: string; color: string }) => {
      if (user.id !== currentUser?.id) {
        setToastNotification({
          id: String(Date.now()),
          type: 'info',
          title: 'Player Joined',
          message: `🟢 ${user.username} joined the grid`,
        });
      }
    });

    socket.on('user:left', (user: { id: string; username: string }) => {
      setToastNotification({
        id: String(Date.now()),
        type: 'info',
        title: 'Player Left',
        message: `🔴 ${user.username} disconnected`,
      });
    });

    // Cursor position broadcast
    socket.on('cursor:updated', (data: UserCursor) => {
      setUserCursors((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    });

    socket.on('cursor:removed', (data: { userId: string }) => {
      setUserCursors((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    socket.on('grid:reset:complete', (data) => {
      setGrid(data.grid);
      setLeaderboard(data.leaderboard);
      setStats(data.stats);
      setActivities([]);
      setToastNotification({
        id: String(Date.now()),
        type: 'info',
        title: 'Grid Reset',
        message: 'The shared grid has been reset!',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [initialUser?.username]);

  // Join Grid Function
  const joinGrid = useCallback((username: string, color?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('user:join', { username, color });
    }
  }, []);

  // Request Block Claim
  const claimBlock = useCallback(
    (blockId: number, expectedPreviousOwnerId?: string | null) => {
      if (!currentUser) {
        setToastNotification({
          id: String(Date.now()),
          type: 'warning',
          title: 'Login Required',
          message: 'Please enter your username to claim blocks!',
        });
        return false;
      }

      const now = Date.now();
      if (now < cooldownEnd) {
        const remaining = ((cooldownEnd - now) / 1000).toFixed(1);
        setToastNotification({
          id: String(Date.now()),
          type: 'warning',
          title: 'Cooldown Active',
          message: `Next capture available in ${remaining}s`,
        });
        return false;
      }

      if (socketRef.current) {
        socketRef.current.emit('block:claim', {
          blockId,
          expectedPreviousOwnerId,
        });

        // Set local 3s cooldown visual timer
        setCooldownEnd(now + 3000);
        return true;
      }
      return false;
    },
    [currentUser, cooldownEnd]
  );

  // Send Cursor Movement
  const sendCursorMove = useCallback((x: number, y: number) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('cursor:move', { x, y });
    }
  }, [currentUser]);

  // Reset Grid (Demo Utility)
  const resetGrid = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('grid:reset');
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      setConnectionState('reconnecting');
      socketRef.current.connect();
    }
  }, []);

  return {
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
  };
}
