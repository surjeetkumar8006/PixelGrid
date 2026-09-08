export interface UserProfile {
  id: string;
  username: string;
  color: string;
  createdAt?: string;
  lastSeen?: string;
  blockCount?: number;
}

export interface BlockData {
  id: number;
  x: number;
  y: number;
  ownerId: string | null;
  ownerName: string | null;
  ownerColor: string | null;
  claimedAt: string | null;
}

export interface GlobalStats {
  totalBlocks: number;
  claimedBlocks: number;
  availableBlocks: number;
  onlineUsersCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  color: string;
  blockCount: number;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  blockId: number;
  x: number;
  y: number;
  userId: string;
  username: string;
  userColor: string;
  timestamp: string;
  action: 'claimed' | 'stolen';
}

export interface UserCursor {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
}
