import React from 'react';
import { Activity, Clock, Zap } from 'lucide-react';
import { ActivityItem } from '../types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 10) return 'just now';
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    } catch (e) {
      return 'recently';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Recent Activity
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Live Action Feed</p>
          </div>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 font-medium">
          No recent grid captures. Real-time updates will stream here live.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-md shrink-0 border border-white/20 shadow-sm"
                  style={{ backgroundColor: act.userColor }}
                />
                <div className="truncate font-medium">
                  <span className="font-bold text-slate-200">
                    {act.username}
                  </span>{' '}
                  <span className="text-slate-400 font-normal">
                    {act.action === 'stolen' ? 'captured' : 'claimed'}
                  </span>{' '}
                  <span className="font-mono font-extrabold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    #{act.blockId}
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 shrink-0 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {formatTimeAgo(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
