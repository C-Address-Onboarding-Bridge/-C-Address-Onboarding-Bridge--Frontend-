'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'pending';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  txHash?: string;
  explorerUrl?: string;
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    if (toast.duration === 0) return;
    const timer = setTimeout(() => onClose(toast.id), toast.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <Info className="h-5 w-5 flex-shrink-0" />,
    pending: <Clock className="h-5 w-5 flex-shrink-0 animate-pulse" />,
  };

  const colors = {
    success:
      'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]',
    error: 'bg-[var(--error)]/10 border-[var(--error)]/30 text-[var(--error)]',
    info: 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary-light)]',
    pending:
      'bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]',
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${colors[toast.type]} animate-in fade-in slide-in-from-bottom-2 w-full max-w-sm`}
    >
      {icons[toast.type]}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.explorerUrl && toast.txHash && (
          <a
            href={toast.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            <ExternalLink className="h-3 w-3" />
            {toast.txHash.slice(0, 8)}…{toast.txHash.slice(-6)}
          </a>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 transition-opacity hover:opacity-70"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = (
    message: string,
    type: ToastType = 'info',
    duration = 3000,
    extra?: Pick<Toast, 'txHash' | 'explorerUrl'>
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration, ...extra }]);
    return id;
  };

  const update = (id: string, patch: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, add, update, remove };
}
