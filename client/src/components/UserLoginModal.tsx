import React, { useState } from 'react';
import { User, Sparkles, Paintbrush } from 'lucide-react';

interface UserLoginModalProps {
  isOpen: boolean;
  onJoin: (username: string, color: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ isOpen, onJoin }) => {
  const [username, setUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim(), selectedColor);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div
          className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: selectedColor }}
        />

        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Join PixelGrid</h2>
          <p className="text-slate-400 text-sm mt-1">
            Claim blocks on a 900-cell shared map in real time!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Enter your username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                maxLength={20}
                placeholder="e.g. Surjeet"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5 text-indigo-400" />
              Choose Your Color
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`h-10 rounded-xl transition-all flex items-center justify-center ${
                    selectedColor === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-base mt-2"
          >
            <span>Join Grid</span>
            <span className="text-lg">→</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          No sign up required. Just pick a name and play!
        </p>
      </div>
    </div>
  );
};
