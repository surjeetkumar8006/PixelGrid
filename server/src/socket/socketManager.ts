import { Server, Socket } from 'socket.io';
import {
  getGridSnapshot,
  getLeaderboard,
  getGlobalStats,
  claimBlockAtomic,
  getOrCreateUser,
  prisma,
  TOTAL_BLOCKS,
} from '../db';
import { ActivityItem, UserProfile } from '../types';

interface ConnectedUser extends UserProfile {
  socketId: string;
  joinedAt: Date;
  lastClaimTimestamp?: number;
}

const onlineUsersMap = new Map<string, ConnectedUser>(); // key: socket.id
const recentActivities: ActivityItem[] = [];
const COOLDOWN_MS = 3000; // 3 seconds gameplay cooldown rule

export function setupSocketIO(io: Server) {
  io.on('connection', async (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Track initial connection state
    socket.on('user:join', async (userData: { username: string; color?: string }) => {
      try {
        if (!userData.username || !userData.username.trim()) return;

        const dbUser = await getOrCreateUser(userData.username.trim(), userData.color);

        const connectedUser: ConnectedUser = {
          id: dbUser.id,
          username: dbUser.username,
          color: dbUser.color,
          socketId: socket.id,
          joinedAt: new Date(),
        };

        onlineUsersMap.set(socket.id, connectedUser);

        // Notify client with their confirmed user profile
        socket.emit('user:profile', dbUser);

        // Broadcast user joined to everyone
        io.emit('user:joined', {
          id: dbUser.id,
          username: dbUser.username,
          color: dbUser.color,
        });

        // Broadcast updated online players list and stats
        broadcastOnlineState(io);

        // Send full grid snapshot and recent activity to newly connected socket
        const grid = await getGridSnapshot();
        const leaderboard = await getLeaderboard();
        const stats = await getGlobalStats(getUniqueOnlineCount());

        socket.emit('init:data', {
          grid,
          leaderboard,
          stats,
          activities: recentActivities.slice(0, 30),
          onlinePlayers: getUniqueOnlinePlayers(),
        });
      } catch (error) {
        console.error('Error handling user:join socket:', error);
      }
    });

    // Real-time Block Claim Request
    socket.on(
      'block:claim',
      async (data: { blockId: number; expectedPreviousOwnerId?: string | null }) => {
        const user = onlineUsersMap.get(socket.id);
        if (!user) {
          socket.emit('claim:rejected', {
            blockId: data.blockId,
            reason: 'You must set a username first!',
          });
          return;
        }

        // Cooldown check (3-second rule)
        const now = Date.now();
        if (user.lastClaimTimestamp && now - user.lastClaimTimestamp < COOLDOWN_MS) {
          const remainingSeconds = (
            (COOLDOWN_MS - (now - user.lastClaimTimestamp)) /
            1000
          ).toFixed(1);
          socket.emit('claim:rejected', {
            blockId: data.blockId,
            reason: `Cooldown active! Next capture in ${remainingSeconds}s.`,
          });
          return;
        }

        // Execute atomic database claim transaction
        const result = await claimBlockAtomic(
          data.blockId,
          user.id,
          data.expectedPreviousOwnerId
        );

        if (!result.success || !result.block) {
          socket.emit('claim:rejected', {
            blockId: data.blockId,
            reason: result.reason || 'This block was already claimed!',
          });
          return;
        }

        // Update user cooldown timestamp
        user.lastClaimTimestamp = now;
        onlineUsersMap.set(socket.id, user);

        // Create activity item
        const activityItem: ActivityItem = {
          id: `${Date.now()}-${data.blockId}`,
          blockId: data.blockId,
          x: result.block.x,
          y: result.block.y,
          userId: user.id,
          username: user.username,
          userColor: user.color,
          timestamp: new Date().toISOString(),
          action: result.previousOwnerName ? 'stolen' : 'claimed',
        };

        recentActivities.unshift(activityItem);
        if (recentActivities.length > 50) recentActivities.pop();

        // 1. Broadcast updated block to all connected clients
        io.emit('block:claimed', {
          block: result.block,
          activity: activityItem,
          previousOwnerName: result.previousOwnerName,
        });

        // 2. Broadcast updated leaderboard and global stats
        const updatedLeaderboard = await getLeaderboard();
        const updatedStats = await getGlobalStats(getUniqueOnlineCount());

        io.emit('leaderboard:updated', updatedLeaderboard);
        io.emit('stats:updated', updatedStats);
      }
    );

    // Live Multiplayer Cursor Move
    socket.on('cursor:move', (coords: { x: number; y: number }) => {
      const user = onlineUsersMap.get(socket.id);
      if (!user) return;

      socket.broadcast.emit('cursor:updated', {
        userId: user.id,
        username: user.username,
        color: user.color,
        x: coords.x,
        y: coords.y,
      });
    });

    // Reset Grid (Demo/Admin Utility)
    socket.on('grid:reset', async () => {
      try {
        await prisma.block.updateMany({
          data: { ownerId: null, claimedAt: null },
        });

        const resetGrid = await getGridSnapshot();
        const leaderboard = await getLeaderboard();
        const stats = await getGlobalStats(getUniqueOnlineCount());

        recentActivities.length = 0; // Clear activity feed

        io.emit('grid:reset:complete', {
          grid: resetGrid,
          leaderboard,
          stats,
        });
      } catch (err) {
        console.error('Error resetting grid:', err);
      }
    });

    // Handle Disconnection
    socket.on('disconnect', () => {
      const user = onlineUsersMap.get(socket.id);
      if (user) {
        onlineUsersMap.delete(socket.id);
        io.emit('user:left', { id: user.id, username: user.username });
        broadcastOnlineState(io);
        socket.broadcast.emit('cursor:removed', { userId: user.id });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

function getUniqueOnlinePlayers(): UserProfile[] {
  const map = new Map<string, UserProfile>();
  onlineUsersMap.forEach((u) => {
    map.set(u.id, {
      id: u.id,
      username: u.username,
      color: u.color,
    });
  });
  return Array.from(map.values());
}

function getUniqueOnlineCount(): number {
  return getUniqueOnlinePlayers().length;
}

async function broadcastOnlineState(io: Server) {
  const onlineCount = getUniqueOnlineCount();
  const onlinePlayers = getUniqueOnlinePlayers();
  const stats = await getGlobalStats(onlineCount);

  io.emit('players:updated', {
    onlineCount,
    onlinePlayers,
  });
  io.emit('stats:updated', stats);
}
