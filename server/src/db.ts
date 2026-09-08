import mongoose, { Schema, Document } from 'mongoose';
import { BlockData, GlobalStats, LeaderboardEntry } from './types';

export const GRID_ROWS = 30;
export const GRID_COLS = 30;
export const TOTAL_BLOCKS = GRID_ROWS * GRID_COLS; // 900

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

/**
 * Connect to MongoDB Atlas
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pixelgrid';
  try {
    await mongoose.connect(uri);
    console.log('⚡ Connected to MongoDB Atlas successfully.');
    await seedGridIfNeeded();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}

/**
 * Ensures 900 blocks exist in MongoDB (0 to 899)
 */
export async function seedGridIfNeeded() {
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

    // Insert all 900 blocks in bulk
    for (const b of blocksData) {
      await BlockModel.updateOne(
        { id: b.id },
        { $setOnInsert: b },
        { upsert: true }
      );
    }
    console.log('Grid seeding complete: 900 blocks in MongoDB.');
  }
}

/**
 * Get or Create User
 */
export async function getOrCreateUser(username: string, color?: string) {
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

  const randomColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  const userColor = color || randomColors[Math.floor(Math.random() * randomColors.length)];

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
}

/**
 * Get Full Grid Snapshot
 */
export async function getGridSnapshot(): Promise<BlockData[]> {
  const blocks = await BlockModel.find().sort({ id: 1 }).lean();

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

/**
 * Atomic Claim Block in MongoDB
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

  try {
    const currentBlock = await BlockModel.findOne({ id: blockId });
    if (!currentBlock) {
      return { success: false, reason: 'Block does not exist' };
    }

    if (currentBlock.ownerId === userId) {
      return { success: false, reason: 'You already own this block' };
    }

    // Conflict detection: Check if previous owner matches expectation
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

    // Fetch user details
    const user = await UserModel.findById(userId);
    if (!user) {
      return { success: false, reason: 'User profile not found' };
    }

    const previousOwnerName = currentBlock.ownerName;

    // Atomic update in MongoDB
    const updated = await BlockModel.findOneAndUpdate(
      { id: blockId },
      {
        ownerId: user._id.toString(),
        ownerName: user.username,
        ownerColor: user.color,
        claimedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return { success: false, reason: 'Failed to update block in MongoDB' };
    }

    const formattedBlock: BlockData = {
      id: updated.id,
      x: updated.x,
      y: updated.y,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName,
      ownerColor: updated.ownerColor,
      claimedAt: updated.claimedAt ? updated.claimedAt.toISOString() : null,
    };

    return {
      success: true,
      block: formattedBlock,
      previousOwnerName,
    };
  } catch (error) {
    console.error('MongoDB claim block error:', error);
    return { success: false, reason: 'Database error' };
  }
}

/**
 * Get Leaderboard (Top owners)
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
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

  return results.map((entry, index) => ({
    rank: index + 1,
    id: entry._id,
    username: entry.ownerName || 'Player',
    color: entry.ownerColor || '#3B82F6',
    blockCount: entry.blockCount,
    percentage: Number(((entry.blockCount / TOTAL_BLOCKS) * 100).toFixed(1)),
  }));
}

/**
 * Get Global Statistics
 */
export async function getGlobalStats(onlineUsersCount: number): Promise<GlobalStats> {
  const claimedCount = await BlockModel.countDocuments({ ownerId: { $ne: null } });

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
  await BlockModel.updateMany(
    {},
    { ownerId: null, ownerName: null, ownerColor: null, claimedAt: null }
  );
}
