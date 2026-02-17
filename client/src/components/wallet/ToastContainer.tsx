import { memo } from 'react';
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Toast, ToastType } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const TOAST_COLORS: Record<ToastType, string> = {
  info: 'var(--accent-primary)',
  success: 'var(--green)',
  warning: 'var(--amber)',
  error: 'var(--red)',
};

const TOAST_ICONS: Record<ToastType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

export const ToastContainer = memo(function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2"
      style={{ width: 360 }}
    >
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = TOAST_ICONS[toast.type];
          const color = TOAST_COLORS[toast.type];

          return (
            <motion.div
              key={toast.id}
              data-testid={`toast-${toast.id}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="flex items-start gap-3 p-3">
                <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {toast.title}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {toast.message}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(toast.id)}
                  className="flex-shrink-0 p-0.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={12} />
                </button>
              </div>
              <motion.div
                className="h-[2px]"
                style={{ backgroundColor: color }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: toast.duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
