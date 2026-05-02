import type { ReactNode } from 'react';
import Badge from '@/components/ui/Badge';

export function FutureHero({
  eyebrow,
  title,
  description,
  badges = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  badges?: string[];
}) {
  return (
    <div className="card-elevated border-accent/15">
      <div className="text-2xs uppercase tracking-[0.2em] text-accent/80">{eyebrow}</div>
      <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight text-primary font-display">{title}</h2>
      <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-secondary">{description}</p>
      {badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge} variant="accent">{badge}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function FuturePanel({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          {description && <p className="mt-1 max-w-[720px] text-xs leading-relaxed text-tertiary">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
