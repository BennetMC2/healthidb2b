import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-12 h-12 rounded-lg bg-elevated border border-border flex items-center justify-center">
        {icon || <SearchX size={20} className="text-tertiary" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-secondary">{title}</p>
        {description && (
          <p className="text-xs text-tertiary mt-1">{description}</p>
        )}
      </div>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-xs mt-1">
          {action.label}
        </button>
      )}
    </div>
  );
}
