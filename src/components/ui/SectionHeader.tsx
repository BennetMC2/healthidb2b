import { type ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  as?: 'h1' | 'h2';
}

export default function SectionHeader({
  title,
  description,
  icon,
  className = '',
  children,
  as = 'h2',
}: SectionHeaderProps) {
  const Heading = as;

  return (
    <div className={`mb-3 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-accent/60">{icon}</span>}
        <Heading className="text-base font-semibold text-primary font-display">{title}</Heading>
        {children}
      </div>
      {description && (
        <p className="text-sm text-tertiary mt-1 leading-relaxed max-w-[640px]">
          {description}
        </p>
      )}
    </div>
  );
}
