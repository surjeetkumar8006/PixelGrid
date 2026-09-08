import { PrismaClient } from '@prisma/client';
import { BlockData, GlobalStats, LeaderboardEntry } from './types';

export const prisma = new PrismaClient();

export const GRID_ROWS = 30;
export const GRID_COLS = 30;
export const TOTAL_BLOCKS = GRID_ROWS * GRID_COLS; // 900

/**
 * Ensures 900 blocks exist in the database (0 to 899)
 */
export async function seedGridIfNeeded() {
  const count = await prisma.block.count();
  if (count < TOTAL_BLOCKS) {
    console.log(`Seeding ${TOTAL_BLOCKS} grid blocks...`);
    const blocksData = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const id = y * GRID_COLS + x;
        blocksData.push({
          id,
          x,
          y,
          ownerId: null,
          claimedAt: null,
        });
      }
    }

    // Insert missing blocks
    for (const b of blocksData) {
      await prisma.block.upsert({
        where: { id: b.id },
        update: {},
        create: b,
      });
    }
    console.log('Grid seeding complete: 900 blocks initialized.');
  }
}

/**
 * Get or Create User
 */
export async function getOrCreateUser(username: string, color?: string) {
  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        lastSeen: new Date(),
        ...(color ? { color } : {}),
      },
    });
    return updated;
  }

  // Generate random color if not provided
  const randomColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  const userColor = color || randomColors[Math.floor(Math.random() * randomColors.length)];

  return await prisma.user.create({
    data: {
      username,
      color: userColor,
      lastSeen: new Date(),
    },
  });
}

/**
 * Get Full Grid Snapshot
 */
export async function getGridSnapshot(): Promise<BlockData[]> {
  const blocks = await prisma.block.findMany({
    include: {
      owner: {
        select: {
          username: true,
          color: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  return blocks.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    ownerId: b.ownerId,
    ownerName: b.owner?.username || null,
    ownerColor: b.owner?.color || null,
    claimedAt: b.claimedAt ? b.claimedAt.toISOString() : null,
  }));
}

/**
 * Atomic Claim Block Transaction
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
    return await prisma.$transaction(async (tx) => {
      const currentBlock = await tx.block.findUnique({
        where: { id: blockId },
        include: { owner: true },
      });

      if (!currentBlock) {
        return { success: false, reason: 'Block does not exist' };
      }

      // Check if user already owns this block
      if (currentBlock.ownerId === userId) {
        return { success: false, reason: 'You already own this block' };
      }

      // Conflict detection: if client expected block to be unclaimed but someone else claimed it first
      if (
        expectedPreviousOwnerId !== undefined &&
        expectedPreviousOwnerId !== currentBlock.ownerId
      ) {
        const currentOwner = currentBlock.owner?.username || 'another player';
        return {
          success: false,
          reason: `This block was already claimed by ${currentOwner}!`,
          previousOwnerName: currentBlock.owner?.username || null,
        };
      }

      const previousOwnerName = currentBlock.owner?.username || null;

      // Update block owner atomically
      const updated = await tx.block.update({
        where: { id: blockId },
        data: {
          ownerId: userId,
          claimedAt: new Date(),
        },
        include: {
          owner: {
            select: { username: true, color: true },
          },
        },
      });

      const formattedBlock: BlockData = {
        id: updated.id,
        x: updated.x,
        y: updated.y,
        ownerId: updated.ownerId,
        ownerName: updated.owner?.username || null,
        ownerColor: updated.owner?.color || null,
        claimedAt: updated.claimedAt ? updated.claimedAt.toISOString() : null,
      };

      return {
        success: true,
        block: formattedBlock,
        previousOwnerName,
      };
    });
  } catch (error: any) {
    console.error('Error claiming block atomically:', error);
    return { success: false, reason: 'Database conflict or server error' };
  }
}

/**
 * Get Leaderboard (Top owners)
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const usersWithCounts = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      color: true,
      _count: {
        select: { blocks: true },
      },
    },
    orderBy: {
      blocks: {
        _count: 'desc',
      },
    },
    take: limit,
  });

  return usersWithCounts
    .filter((u) => u._count.blocks > 0)
    .map((u, index) => ({
      rank: index + 1,
      id: u.id,
      username: u.username,
      color: u.color,
      blockCount: u._count.blocks,
      percentage: Number(((u._count.blocks / TOTAL_BLOCKS) * 100).toFixed(1)),
    }));
}

/**
 * Get Global Statistics
 */
export async function getGlobalStats(onlineUsersCount: number): Promise<GlobalStats> {
  const claimedCount = await prisma.block.count({
    where: {
      ownerId: { not: null },
    },
  });

  return {
    totalBlocks: TOTAL_BLOCKS,
    claimedBlocks: claimedCount,
    availableBlocks: TOTAL_BLOCKS - claimedCount,
    onlineUsersCount,
  };
}
