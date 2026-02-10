import type { CampaignStatus, CampaignType, ProofType, ReputationTier } from '@/types';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-elevated border-border text-secondary',
  accent: 'bg-accent-dim border-accent/20 text-accent',
  success: 'bg-success-muted border-success/20 text-success',
  warning: 'bg-warning-muted border-warning/20 text-warning',
  error: 'bg-error-muted border-error/20 text-error',
  muted: 'bg-hover border-border text-tertiary',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded-sm border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Convenience components

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const variants: Record<CampaignStatus, BadgeVariant> = {
    draft: 'muted',
    active: 'success',
    completed: 'accent',
    paused: 'warning',
  };
  const labels: Record<CampaignStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
    paused: 'Paused',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

export function TypeBadge({ type }: { type: CampaignType }) {
  return (
    <Badge variant={type === 'snapshot' ? 'accent' : 'default'}>
      {type === 'snapshot' ? 'Snapshot' : 'Stream'}
    </Badge>
  );
}

export function ProofBadge({ type }: { type: ProofType }) {
  const labels: Record<ProofType, string> = {
    zk_snark: 'ZK-SNARK',
    zk_stark: 'ZK-STARK',
    bulletproof: 'Bulletproof',
  };
  return <Badge variant="accent">{labels[type]}</Badge>;
}

export function ReputationBadge({ tier }: { tier: ReputationTier }) {
  const colors: Record<ReputationTier, string> = {
    diamond: 'bg-reputation-diamond/10 border-reputation-diamond/20 text-reputation-diamond',
    platinum: 'bg-reputation-platinum/10 border-reputation-platinum/20 text-reputation-platinum',
    gold: 'bg-reputation-gold/10 border-reputation-gold/20 text-reputation-gold',
    silver: 'bg-reputation-silver/10 border-reputation-silver/20 text-reputation-silver',
    bronze: 'bg-reputation-bronze/10 border-reputation-bronze/20 text-reputation-bronze',
  };
  const labels: Record<ReputationTier, string> = {
    diamond: 'Diamond',
    platinum: 'Platinum',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded-sm border ${colors[tier]}`}
    >
      {labels[tier]}
    </span>
  );
}
