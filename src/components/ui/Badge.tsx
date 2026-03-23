import type { CampaignStatus, CampaignType, CampaignUseCase, ProofType, ReputationTier } from '@/types';
import { USE_CASE_LABELS } from '@/utils/constants';

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

export function UseCaseBadge({ useCase }: { useCase: CampaignUseCase }) {
  return <Badge variant="default">{USE_CASE_LABELS[useCase]}</Badge>;
}

export function ReputationBadge({ tier }: { tier: ReputationTier }) {
  const styles: Record<ReputationTier, { bg: string; border: string; text: string }> = {
    high: { bg: 'bg-trust-high/10', border: 'border-trust-high/20', text: 'text-trust-high' },
    medium: { bg: 'bg-trust-medium/10', border: 'border-trust-medium/20', text: 'text-trust-medium' },
    low: { bg: 'bg-trust-low/10', border: 'border-trust-low/20', text: 'text-trust-low' },
  };
  const labels: Record<ReputationTier, string> = {
    high: 'High Trust',
    medium: 'Medium Trust',
    low: 'Low Trust',
  };
  const s = styles[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded border ${s.bg} ${s.border} ${s.text}`}
    >
      {labels[tier]}
    </span>
  );
}
