import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToastStore } from '@/stores/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[360px]">
      {toasts.map((toast) => {
        const variant = toast.variant ?? 'default';
        const icon = variant === 'success'
          ? <CheckCircle size={14} className="text-success flex-shrink-0" />
          : variant === 'error'
          ? <AlertCircle size={14} className="text-error flex-shrink-0" />
          : null;

        return (
          <div
            key={toast.id}
            className="flex items-center gap-2 bg-elevated border border-border rounded px-3 py-2.5 shadow-lg animate-slide-in"
          >
            {icon}
            <span className="text-xs text-primary flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-tertiary hover:text-secondary transition-colors flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
