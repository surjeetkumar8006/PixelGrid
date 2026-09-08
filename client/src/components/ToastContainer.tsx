import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/90 text-amber-100';
      case 'error':
        return 'border-rose-500/40 bg-rose-950/90 text-rose-100';
      default:
        return 'border-sky-500/40 bg-slate-900/95 text-slate-100';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm animate-bounce-short pointer-events-auto">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${getBorderColor()}`}
      >
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">
            {toast.title}
          </h4>
          <p className="text-xs font-medium leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
