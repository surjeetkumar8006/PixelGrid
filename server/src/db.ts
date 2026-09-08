import mongoose, { Schema, Document } from 'mongoose';
import { BlockData, GlobalStats, LeaderboardEntry } from './types';

export const GRID_ROWS = 30;
export const GRID_COLS = 30;
export const TOTAL_BLOCKS = GRID_ROWS * GRID_COLS; // 900

// In-Memory Fallback Store (Guarantees zero-lag performance if DB connection is offline)
const inMemoryBlocks = new Map<number, BlockData>();
const inMemoryUsers = new Map<string, { id: string; username: string; color: string; lastSeen: Date }>();

for (let y = 0; y < GRID_ROWS; y++) {
  for (let x = 0; x < GRID_COLS; x++) {
    const id = y * GRID_COLS + x;
    inMemoryBlocks.set(id, {
      id,
      x,
      y,
      ownerId: null,
      ownerName: null,
      ownerColor: null,
      claimedAt: null,
    });
  }
}

// --- Mongoose User Schema ---
export interface IUser extends Document {
  username: string;
  color: string;
  createdAt: Date;
  lastSeen: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    color: { type: String, required: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// --- Mongoose Block Schema ---
export interface IBlock extends Document {
  id: number;
  x: number;
  y: number;
  ownerId: string | null;
  ownerName: string | null;
  ownerColor: string | null;
  claimedAt: Date | null;
}

const BlockSchema = new Schema<IBlock>({
  id: { type: Number, required: true, unique: true, index: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  ownerId: { type: String, default: null, index: true },
  ownerName: { type: String, default: null },
  ownerColor: { type: String, default: null },
  claimedAt: { type: Date, default: null },
});

export const BlockModel = mongoose.model<IBlock>('Block', BlockSchema);

let isDbConnected = false;

/**
 * Connect to MongoDB Atlas with fast 3s timeout
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI || '';
  if (!uri) {
    console.log('ℹ️ Running in fast in-memory mode.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Fail fast if IP whitelist/DNS is blocking
    });
    isDbConnected = true;
    console.log('⚡ Connected to MongoDB Atlas successfully.');
    await seedGridIfNeeded();
  } catch (error) {
    isDbConnected = false;
    console.warn('⚠️ MongoDB Atlas connection timed out. Falling back to high-speed in-memory store.');
  }
}

/**
 * Ensures 900 blocks exist in MongoDB (0 to 899)
 */
export async function seedGridIfNeeded() {
  if (!isDbConnected) return;

  try {
    const count = await BlockModel.countDocuments();
    if (count < TOTAL_BLOCKS) {
      console.log(`Seeding ${TOTAL_BLOCKS} grid blocks into MongoDB...`);
      const blocksData = [];
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const id = y * GRID_COLS + x;
          blocksData.push({
            id,
            x,
            y,
            ownerId: null,
            ownerName: null,
            ownerColor: null,
            claimedAt: null,
          });
        }
      }

      for (const b of blocksData) {
        await BlockModel.updateOne({ id: b.id }, { $setOnInsert: b }, { upsert: true });
      }
      console.log('Grid seeding complete: 900 blocks in MongoDB.');
    }
  } catch (e) {
    isDbConnected = false;
  }
}

/**
 * Get or Create User
 */
export async function getOrCreateUser(username: string, color?: string) {
  const randomColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  const userColor = color || randomColors[Math.floor(Math.random() * randomColors.length)];

  if (isDbConnected) {
    try {
      let user = await UserModel.findOne({ username });
      if (user) {
        user.lastSeen = new Date();
        if (color) user.color = color;
        await user.save();
        return {
          id: user._id.toString(),
          username: user.username,
          color: user.color,
          lastSeen: user.lastSeen.toISOString(),
        };
      }

      user = await UserModel.create({
        username,
        color: userColor,
        lastSeen: new Date(),
      });

      return {
        id: user._id.toString(),
        username: user.username,
        color: user.color,
        lastSeen: user.lastSeen.toISOString(),
      };
    } catch (err) {
      console.warn('User DB query failed, falling back to memory store.');
    }
  }

  // Fast In-Memory Fallback
  let memUser = inMemoryUsers.get(username);
  if (!memUser) {
    memUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      username,
      color: userColor,
      lastSeen: new Date(),
    };
    inMemoryUsers.set(username, memUser);
  } else if (color) {
    memUser.color = color;
  }

  return {
    id: memUser.id,
    username: memUser.username,
    color: memUser.color,
    lastSeen: memUser.lastSeen.toISOString(),
  };
}

/**
 * Get Full Grid Snapshot
 */
export async function getGridSnapshot(): Promise<BlockData[]> {
  if (isDbConnected) {
    try {
      const blocks = await BlockModel.find().sort({ id: 1 }).lean();
      if (blocks && blocks.length >= TOTAL_BLOCKS) {
        return blocks.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
          ownerId: b.ownerId || null,
          ownerName: b.ownerName || null,
          ownerColor: b.ownerColor || null,
          claimedAt: b.claimedAt ? b.claimedAt.toISOString() : null,
        }));
      }
    } catch (err) {
      isDbConnected = false;
    }
  }

  return Array.from(inMemoryBlocks.values()).sort((a, b) => a.id - b.id);
}

/**
 * Atomic Claim Block
 */
export async function claimBlockAtomic(
  blockId: number,
  userId: string,
  expectedPreviousOwnerId?: string | null
): Promise<{
  success: boolean;
  block?: BlockData;
  reason?: string;
  previousOwnerName?: string | null;
}> {
  if (blockId < 0 || blockId >= TOTAL_BLOCKS) {
    return { success: false, reason: 'Invalid block ID' };
  }

  if (isDbConnected) {
    try {
      const currentBlock = await BlockModel.findOne({ id: blockId });
      if (!currentBlock) {
        return { success: false, reason: 'Block does not exist' };
      }

      if (currentBlock.ownerId === userId) {
        return { success: false, reason: 'You already own this block' };
      }

      if (
        expectedPreviousOwnerId !== undefined &&
        expectedPreviousOwnerId !== currentBlock.ownerId
      ) {
        const ownerName = currentBlock.ownerName || 'another player';
        return {
          success: false,
          reason: `This block was already claimed by ${ownerName}!`,
          previousOwnerName: currentBlock.ownerName,
        };
      }

      const user = await UserModel.findById(userId);
      const username = user?.username || 'Player';
      const userColor = user?.color || '#3B82F6';

      const previousOwnerName = currentBlock.ownerName;

      const updated = await BlockModel.findOneAndUpdate(
        { id: blockId },
        {
          ownerId: userId,
          ownerName: username,
          ownerColor: userColor,
          claimedAt: new Date(),
        },
        { new: true }
      );

      if (updated) {
        const formattedBlock: BlockData = {
          id: updated.id,
          x: updated.x,
          y: updated.y,
          ownerId: updated.ownerId,
          ownerName: updated.ownerName,
          ownerColor: updated.ownerColor,
          claimedAt: updated.claimedAt ? updated.claimedAt.toISOString() : null,
        };

        // Also update in-memory cache
        inMemoryBlocks.set(blockId, formattedBlock);

        return {
          success: true,
          block: formattedBlock,
          previousOwnerName,
        };
      }
    } catch (error) {
      console.warn('MongoDB atomic claim failed, falling back to memory store.');
      isDbConnected = false;
    }
  }

  // Fast In-Memory Atomic Claim
  const block = inMemoryBlocks.get(blockId);
  if (!block) return { success: false, reason: 'Block not found' };

  if (block.ownerId === userId) {
    return { success: false, reason: 'You already own this block' };
  }

  if (expectedPreviousOwnerId !== undefined && expectedPreviousOwnerId !== block.ownerId) {
    return {
      success: false,
      reason: `This block was already claimed by ${block.ownerName || 'another player'}!`,
      previousOwnerName: block.ownerName,
    };
  }

  // Find user details from memory
  let userDetails = { username: 'Player', color: '#3B82F6' };
  inMemoryUsers.forEach((u) => {
    if (u.id === userId) userDetails = { username: u.username, color: u.color };
  });

  const previousOwnerName = block.ownerName;

  const updatedBlock: BlockData = {
    ...block,
    ownerId: userId,
    ownerName: userDetails.username,
    ownerColor: userDetails.color,
    claimedAt: new Date().toISOString(),
  };

  inMemoryBlocks.set(blockId, updatedBlock);

  return {
    success: true,
    block: updatedBlock,
    previousOwnerName,
  };
}

/**
 * Get Leaderboard (Top owners)
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (isDbConnected) {
    try {
      const pipeline: any[] = [
        { $match: { ownerId: { $ne: null } } },
        {
          $group: {
            _id: '$ownerId',
            blockCount: { $sum: 1 },
            ownerName: { $first: '$ownerName' },
            ownerColor: { $first: '$ownerColor' },
          },
        },
        { $sort: { blockCount: -1 } },
        { $limit: limit },
      ];

      const results = await BlockModel.aggregate(pipeline);
      if (results && results.length > 0) {
        return results.map((entry, index) => ({
          rank: index + 1,
          id: entry._id,
          username: entry.ownerName || 'Player',
          color: entry.ownerColor || '#3B82F6',
          blockCount: entry.blockCount,
          percentage: Number(((entry.blockCount / TOTAL_BLOCKS) * 100).toFixed(1)),
        }));
      }
    } catch (e) {}
  }

  // In-Memory Leaderboard calculation
  const countsMap = new Map<string, { username: string; color: string; count: number }>();
  inMemoryBlocks.forEach((b) => {
    if (b.ownerId && b.ownerName) {
      const existing = countsMap.get(b.ownerId) || {
        username: b.ownerName,
        color: b.ownerColor || '#3B82F6',
        count: 0,
      };
      existing.count += 1;
      countsMap.set(b.ownerId, existing);
    }
  });

  const sorted = Array.from(countsMap.entries())
    .map(([id, data]) => ({
      id,
      username: data.username,
      color: data.color,
      blockCount: data.count,
      percentage: Number(((data.count / TOTAL_BLOCKS) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.blockCount - a.blockCount)
    .slice(0, limit);

  return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

/**
 * Get Global Statistics
 */
export async function getGlobalStats(onlineUsersCount: number): Promise<GlobalStats> {
  let claimedCount = 0;
  if (isDbConnected) {
    try {
      claimedCount = await BlockModel.countDocuments({ ownerId: { $ne: null } });
    } catch (e) {
      claimedCount = Array.from(inMemoryBlocks.values()).filter((b) => b.ownerId !== null).length;
    }
  } else {
    claimedCount = Array.from(inMemoryBlocks.values()).filter((b) => b.ownerId !== null).length;
  }

  return {
    totalBlocks: TOTAL_BLOCKS,
    claimedBlocks: claimedCount,
    availableBlocks: TOTAL_BLOCKS - claimedCount,
    onlineUsersCount,
  };
}

/**
 * Reset Grid Utility
 */
export async function resetGridData() {
  if (isDbConnected) {
    try {
      await BlockModel.updateMany(
        {},
        { ownerId: null, ownerName: null, ownerColor: null, claimedAt: null }
      );
    } catch (e) {}
  }

  inMemoryBlocks.forEach((b) => {
    b.ownerId = null;
    b.ownerName = null;
    b.ownerColor = null;
    b.claimedAt = null;
  });
}
