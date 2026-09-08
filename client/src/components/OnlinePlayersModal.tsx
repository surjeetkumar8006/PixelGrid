import React from 'react';
import { Users, X } from 'lucide-react';
import { UserProfile } from '../types';

interface OnlinePlayersModalProps {
  isOpen: boolean;
  onlinePlayers: UserProfile[];
  currentUser: UserProfile | null;
  onClose: () => void;
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({
  isOpen,
  onlinePlayers,
  currentUser,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Online Players</h3>
            <p className="text-xs text-slate-400">
              🟢 {onlinePlayers.length} active players on the grid
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {onlinePlayers.map((player) => {
            const isMe = currentUser && player.id === currentUser.id;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className={`font-semibold ${isMe ? 'text-indigo-300 font-bold' : 'text-slate-200'}`}>
                    {player.username} {isMe && '(You)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
