import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, Database } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  collection?: string;
  docId?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${
            t.type === 'success'
              ? 'bg-emerald-900/95 text-white border-emerald-700 shadow-emerald-950/40 backdrop-blur-md'
              : t.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/40 backdrop-blur-md'
              : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/40 backdrop-blur-md'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {t.type === 'info' && <Database className="w-5 h-5 text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{t.title}</span>
              {t.collection && (
                <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-emerald-200">
                  {t.collection}
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{t.message}</p>
            {t.docId && (
              <div className="mt-1 text-[10px] font-mono text-emerald-300">
                Document ID: {t.docId}
              </div>
            )}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
