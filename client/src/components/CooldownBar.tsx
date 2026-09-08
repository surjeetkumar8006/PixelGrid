import React, { useEffect, useState } from 'react';
import { Timer, Zap } from 'lucide-react';

interface CooldownBarProps {
  cooldownEnd: number;
}

export const CooldownBar: React.FC<CooldownBarProps> = ({ cooldownEnd }) => {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!cooldownEnd) {
      setRemainingMs(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, cooldownEnd - now);
      setRemainingMs(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  if (remainingMs <= 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-400 mb-4 animate-fadeIn">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span>Ready to capture block! Click any block on the grid.</span>
        </div>
        <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
          Ready
        </span>
      </div>
    );
  }

  const secondsStr = (remainingMs / 1000).toFixed(1);
  const progressPercent = Math.min(100, Math.max(0, (remainingMs / 3000) * 100));

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-4 animate-fadeIn">
      <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-1.5">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 animate-spin text-amber-400" />
          <span>Block captured! Next capture available in</span>
          <span className="font-mono text-sm font-bold text-amber-300">
            {secondsStr}s
          </span>
        </div>
        <span className="bg-amber-500/20 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono">
          Cooldown
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-75 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
