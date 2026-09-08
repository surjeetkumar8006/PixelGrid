import React from 'react';
import { ShieldCheck, X, Clock, MapPin, User } from 'lucide-react';
import { BlockData, UserProfile } from '../types';

interface ClaimModalProps {
  block: BlockData | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onConfirmClaim: (blockId: number, previousOwnerId: string | null) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  block,
  currentUser,
  onClose,
  onConfirmClaim,
}) => {
  if (!block) return null;

  const isOwner = currentUser && block.ownerId === currentUser.id;

  const handleCapture = () => {
    onConfirmClaim(block.id, block.ownerId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold font-mono text-lg shadow-md"
            style={{ backgroundColor: block.ownerColor || currentUser?.color || '#3B82F6' }}
          >
            #{block.id}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Claim this block?
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-indigo-400" />
              Coordinates: X: {block.x}, Y: {block.y}
            </p>
          </div>
        </div>

        {/* Block Status Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Status:</span>
            {block.ownerName ? (
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: block.ownerColor || '#fff' }}
                />
                Owned by {block.ownerName}
              </span>
            ) : (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Unclaimed Block
              </span>
            )}
          </div>

          {block.claimedAt && (
            <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2 text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Captured:
              </span>
              <span className="font-mono text-slate-400">
                {new Date(block.claimedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isOwner ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center text-xs text-indigo-300 font-semibold mb-2">
            ✓ You already own this block!
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Capture</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
