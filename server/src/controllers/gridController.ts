import { Request, Response } from 'express';
import {
  getOrCreateUser,
  getGridSnapshot,
  getLeaderboard,
  getGlobalStats,
  claimBlockAtomic,
} from '../db';

export const handleUserJoin = async (req: Request, res: Response) => {
  try {
    const { username, color } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await getOrCreateUser(username.trim(), color);
    return res.json({ user });
  } catch (error) {
    console.error('Error joining user:', error);
    return res.status(500).json({ error: 'Failed to process user' });
  }
};

export const handleGetGrid = async (req: Request, res: Response) => {
  try {
    const grid = await getGridSnapshot();
    return res.json({ grid });
  } catch (error) {
    console.error('Error fetching grid:', error);
    return res.status(500).json({ error: 'Failed to fetch grid' });
  }
};

export const handleGetLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await getLeaderboard();
    return res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const handleGetStats = async (req: Request, res: Response) => {
  try {
    const stats = await getGlobalStats(0);
    return res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const handleClaimBlock = async (req: Request, res: Response) => {
  try {
    const blockId = parseInt(req.params.id, 10);
    const { userId, expectedPreviousOwnerId } = req.body;

    if (isNaN(blockId)) {
      return res.status(400).json({ error: 'Invalid block ID' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await claimBlockAtomic(blockId, userId, expectedPreviousOwnerId);
    if (!result.success) {
      return res.status(409).json({ error: result.reason, result });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error claiming block:', error);
    return res.status(500).json({ error: 'Failed to claim block' });
  }
};
