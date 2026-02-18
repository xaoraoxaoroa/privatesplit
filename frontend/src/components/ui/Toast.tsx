import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  exiting?: boolean;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  markExiting: (id: string) => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, message, type }] }));
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markExiting: (id) =>
    set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)) })),
}));

function ToastItem({ toast }: { toast: ToastItem }) {
  const { removeToast, markExiting } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      markExiting(toast.id);
      setTimeout(() => removeToast(toast.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast, markExiting]);

  const borderColor = {
    success: 'border-terminal-green',
    error: 'border-terminal-red',
    info: 'border-terminal-cyan',
  }[toast.type];

  const symbol = { success: '\u2713', error: '\u2717', info: '\u25CB' }[toast.type];
  const textColor = {
    success: 'text-terminal-green',
    error: 'text-terminal-red',
    info: 'text-terminal-cyan',
  }[toast.type];

  return (
    <div
      className={`${toast.exiting ? 'toast-exit' : 'toast-enter'} bg-terminal-surface border ${borderColor} p-3 flex items-start gap-2 min-w-[280px] max-w-[380px]`}
    >
      <span className={`${textColor} text-xs shrink-0`}>{symbol}</span>
      <p className="text-xs text-terminal-text flex-1 break-words">{toast.message}</p>
      <button
        onClick={() => {
          markExiting(toast.id);
          setTimeout(() => removeToast(toast.id), 300);
        }}
        className="text-terminal-dim hover:text-terminal-text text-xs shrink-0"
      >
        x
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
