import React from 'react';
import { Trophy, Crown } from 'lucide-react';
import { LeaderboardEntry, UserProfile } from '../types';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUser: UserProfile | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboard,
  currentUser,
}) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-lg drop-shadow-md">🥇</span>;
    if (rank === 2) return <span className="text-lg drop-shadow-md">🥈</span>;
    if (rank === 3) return <span className="text-lg drop-shadow-md">🥉</span>;
    return <span className="text-xs font-mono font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Leaderboard
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Top Territory Owners</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Ranked
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 font-medium">
          No blocks claimed yet. Be the first player to capture land!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {leaderboard.map((entry) => {
            const isMe = currentUser && entry.id === currentUser.id;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                  isMe
                    ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 flex items-center justify-center shrink-0">
                    {getRankBadge(entry.rank)}
                  </div>
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30 shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="min-w-0">
                    <span className={`text-xs font-bold truncate block ${isMe ? 'text-indigo-200' : 'text-slate-200'}`}>
                      {entry.username} {isMe && '(You)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-white">
                      {entry.blockCount}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono block">
                      {entry.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
