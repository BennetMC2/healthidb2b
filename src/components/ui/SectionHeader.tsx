import { type ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function SectionHeader({
  title,
  description,
  icon,
  className = '',
  children,
}: SectionHeaderProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-accent/60">{icon}</span>}
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
        {children}
      </div>
      {description && (
        <p className="text-xs text-tertiary mt-0.5 leading-relaxed max-w-[640px]">
          {description}
        </p>
      )}
    </div>
  );
}
