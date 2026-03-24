import { Heart, Moon, Wind, Flame, Scale, FlaskConical, type LucideIcon } from 'lucide-react';
import type { CampaignStatus, CampaignType, CampaignUseCase, ProofType, ReputationTier, HealthMetric, DataSource, ChallengeCriteria } from '@/types';
import { USE_CASE_LABELS, HEALTH_METRIC_LABELS, METRIC_CATEGORY_MAP, HIGH_SIGNAL_METRICS, DATA_SOURCE_LABELS, formatOperator } from '@/utils/constants';
import type { MetricCategory } from '@/utils/constants';

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

// ── Metric Category Badges ──────────────────────────────────────────

const metricCategoryStyles: Record<MetricCategory, { bg: string; border: string; text: string }> = {
  cardiac:     { bg: 'bg-metric-cardiac/10',     border: 'border-metric-cardiac/20',     text: 'text-metric-cardiac' },
  sleep:       { bg: 'bg-metric-sleep/10',       border: 'border-metric-sleep/20',       text: 'text-metric-sleep' },
  respiratory: { bg: 'bg-metric-respiratory/10', border: 'border-metric-respiratory/20', text: 'text-metric-respiratory' },
  activity:    { bg: 'bg-metric-activity/10',    border: 'border-metric-activity/20',    text: 'text-metric-activity' },
  body:        { bg: 'bg-metric-body/10',        border: 'border-metric-body/20',        text: 'text-metric-body' },
  clinical:    { bg: 'bg-metric-clinical/10',    border: 'border-metric-clinical/20',    text: 'text-metric-clinical' },
};

const highSignalBorders: Partial<Record<MetricCategory, string>> = {
  cardiac: 'border-metric-cardiac/40',
};

const categoryIcons: Record<MetricCategory, LucideIcon> = {
  cardiac: Heart,
  sleep: Moon,
  respiratory: Wind,
  activity: Flame,
  body: Scale,
  clinical: FlaskConical,
};

export function MetricBadge({ metric }: { metric: HealthMetric }) {
  const category = METRIC_CATEGORY_MAP[metric];
  const style = metricCategoryStyles[category];
  const isHighSignal = HIGH_SIGNAL_METRICS.has(metric);
  const border = isHighSignal && highSignalBorders[category] ? highSignalBorders[category] : style.border;
  const Icon = categoryIcons[category];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded border ${style.bg} ${border} ${style.text}`}>
      <Icon size={10} />
      {HEALTH_METRIC_LABELS[metric]}
    </span>
  );
}

export function ChallengeDisplay({ challenge, additionalChallenges }: { challenge: ChallengeCriteria; additionalChallenges?: ChallengeCriteria[] }) {
  const renderChallenge = (c: ChallengeCriteria) => (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <MetricBadge metric={c.metric} />
      <span className="text-2xs font-mono text-secondary">
        {c.operator === 'between'
          ? `${c.target}–${c.targetMax ?? ''} ${c.unit}`
          : `${formatOperator(c.operator)} ${c.target} ${c.unit}`}
      </span>
    </span>
  );

  return (
    <div className="flex flex-col gap-1">
      {renderChallenge(challenge)}
      {additionalChallenges?.map((ac, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-1 py-px text-[9px] font-semibold rounded bg-hover text-tertiary uppercase tracking-wide">and</span>
          {renderChallenge(ac)}
        </div>
      ))}
    </div>
  );
}

export function DataSourceBadge({ source }: { source: DataSource }) {
  if (source === 'lab_results') {
    const style = metricCategoryStyles.clinical;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded border ${style.bg} ${style.border} ${style.text}`}>
        <FlaskConical size={10} />
        {DATA_SOURCE_LABELS[source]}
      </span>
    );
  }
  return <Badge variant="default">{DATA_SOURCE_LABELS[source]}</Badge>;
}
