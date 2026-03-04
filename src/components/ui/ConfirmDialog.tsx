import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-base/70 backdrop-blur-sm" />
      <div
        className="relative card w-[400px] bg-surface animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
            variant === 'destructive' ? 'bg-error/10' : 'bg-accent/10'
          }`}>
            <AlertTriangle size={16} className={variant === 'destructive' ? 'text-error' : 'text-accent'} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            <p className="text-xs text-tertiary mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-xs ${variant === 'destructive' ? 'btn-destructive' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
