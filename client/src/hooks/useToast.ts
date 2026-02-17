import { useState, useCallback, useRef } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  platform?: string;
  duration: number;
  createdAt: number;
}

interface ShowToastOptions {
  type: ToastType;
  title: string;
  message: string;
  platform?: string;
  duration?: number;
}

const MAX_TOASTS = 4;
let idCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((options: ShowToastOptions) => {
    const id = `toast_${++idCounter}`;
    const duration = options.duration || 4000;
    const toast: Toast = {
      id,
      type: options.type,
      title: options.title,
      message: options.message,
      platform: options.platform,
      duration,
      createdAt: Date.now(),
    };

    setToasts(prev => {
      const next = [...prev, toast];
      if (next.length > MAX_TOASTS) {
        const removed = next.shift();
        if (removed) {
          const timer = timersRef.current.get(removed.id);
          if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(removed.id);
          }
        }
      }
      return next;
    });

    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);

    return id;
  }, [removeToast]);

  return { toasts, showToast, removeToast };
}
