import React from 'react';
import { Grid, ShieldCheck, Square, Users, Crown } from 'lucide-react';
import { GlobalStats, UserProfile } from '../types';

interface StatsBarProps {
  stats: GlobalStats;
  userBlocksCount: number;
  currentUser: UserProfile | null;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  userBlocksCount,
  currentUser,
}) => {
  const percentageOwned = ((userBlocksCount / (stats.totalBlocks || 900)) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* 1. Total Blocks */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-600/80 transition-all duration-300 shadow-lg group">
        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all">
          <Grid className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-white leading-tight font-mono tracking-tight">
            {stats.totalBlocks}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            Total Blocks
          </p>
        </div>
      </div>

      {/* 2. Claimed Blocks */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-600/80 transition-all duration-300 shadow-lg group">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all">
          <ShieldCheck className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-white leading-tight font-mono tracking-tight">
            {stats.claimedBlocks}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            Claimed
          </p>
        </div>
      </div>

      {/* 3. Available Blocks */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-600/80 transition-all duration-300 shadow-lg group">
        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all">
          <Square className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-white leading-tight font-mono tracking-tight">
            {stats.availableBlocks}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            Available
          </p>
        </div>
      </div>

      {/* 4. Online Users */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-600/80 transition-all duration-300 shadow-lg group">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
          <Users className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-white leading-tight font-mono tracking-tight">
            {stats.onlineUsersCount}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            Players Online
          </p>
        </div>
      </div>

      {/* 5. Your Blocks */}
      <div className="col-span-2 sm:col-span-1 glass-panel-glow rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 shadow-xl group relative overflow-hidden">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white/20 group-hover:scale-105 transition-all"
          style={{ backgroundColor: currentUser?.color || '#6366F1' }}
        >
          <Crown className="w-5.5 h-5.5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-white leading-tight font-mono tracking-tight">
              {userBlocksCount}
            </p>
            <span className="text-xs font-mono font-bold text-indigo-300">
              ({percentageOwned}%)
            </span>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 mt-0.5">
            Your Blocks
          </p>
        </div>
      </div>
    </div>
  );
};
