"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration === 0) return;
    const timer = setTimeout(() => onClose(toast.id), toast.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]",
    error: "bg-[var(--error)]/10 border-[var(--error)]/30 text-[var(--error)]",
    info: "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]",
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[toast.type]} animate-in fade-in slide-in-from-bottom-2`}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-auto p-1 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 pointer-events-none">
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

  const add = (message: string, type: ToastType = "info", duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, add, remove };
}
