import { ArrowLeft, Users, Activity, Shield, Gauge } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Sparkline from '@/components/ui/Sparkline';
import DataTable from '@/components/ui/DataTable';
import CohortTrajectoryChart from '@/components/charts/CohortTrajectoryChart';
import { ReputationBadge } from '@/components/ui/Badge';
import { formatNumber, formatPercent, formatRelativeTime } from '@/utils/format';
import { getConfidenceLabel, CONFIDENCE_COLORS } from '@/utils/constants';
import { cohortTrajectories } from '@/data';
import type { CohortSummary } from '@/utils/cohorts';
import type { HealthIdentity, ReputationTier } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

interface CohortDetailViewProps {
  cohort: CohortSummary;
  members: HealthIdentity[];
  onBack: () => void;
  onSelectIdentity: (identity: HealthIdentity) => void;
}

const columns: ColumnDef<HealthIdentity, unknown>[] = [
  { accessorKey: 'anonymizedId', header: 'Identity', cell: ({ getValue }) => <span className="font-mono text-xs text-accent/80">{getValue<string>()}</span> },
  { accessorKey: 'healthScore', header: 'Health Score', cell: ({ getValue }) => {
    const v = getValue<number>();
    const color = v >= 80 ? 'text-health-excellent' : v >= 60 ? 'text-health-good' : v >= 40 ? 'text-health-moderate' : 'text-health-poor';
    return <span className={`font-mono text-sm ${color}`}>{v}</span>;
  }},
  { accessorKey: 'healthTrend', header: 'Trend', cell: ({ getValue, row }) => {
    const trend = getValue<number[]>();
    if (!trend || trend.length < 2) return <span className="text-2xs text-tertiary">—</span>;
    const score = row.original.healthScore;
    return <Sparkline data={trend} width={56} height={18} color={score >= 60 ? 'var(--a-accent)' : 'var(--a-warning)'} />;
  }},
  { accessorKey: 'confidenceScore', header: 'Confidence', cell: ({ getValue }) => {
    const v = getValue<number>();
    const tier = getConfidenceLabel(v);
    return <span className="font-mono text-xs" style={{ color: CONFIDENCE_COLORS[tier] }}>{v.toFixed(2)}</span>;
  }},
  { accessorKey: 'reputationTier', header: 'Trust Tier', cell: ({ getValue }) => <ReputationBadge tier={getValue<ReputationTier>()} /> },
  { accessorKey: 'connectedSources', header: 'Sources', cell: ({ getValue }) => <span className="text-xs text-secondary">{getValue<string[]>().length}</span> },
  { accessorKey: 'verificationCount', header: 'Verifications', cell: ({ getValue }) => <span className="font-mono text-xs text-secondary">{getValue<number>()}</span> },
  { accessorKey: 'lastVerified', header: 'Freshness', cell: ({ getValue }) => {
    const v = getValue<string | null>();
    if (!v) return <span className="text-2xs text-tertiary">—</span>;
    const days = Math.floor((Date.now() - new Date(v).getTime()) / (24 * 60 * 60 * 1000));
    const label = days <= 30 ? 'Fresh' : days <= 90 ? 'Stale' : 'Lapsed';
    const tone = days <= 30 ? 'text-success border-success/20 bg-success-muted' : days <= 90 ? 'text-warning border-warning/20 bg-warning-muted' : 'text-error border-error/20 bg-error-muted';
    return (
      <div className="flex flex-col gap-1">
        <span className={`badge ${tone}`}>{label}</span>
        <span className="text-2xs text-tertiary">{formatRelativeTime(v)}</span>
      </div>
    );
  }},
];

export default function CohortDetailView({ cohort, members, onBack, onSelectIdentity }: CohortDetailViewProps) {
  const riskColor = cohort.riskScore >= 0.65 ? 'text-error' : cohort.riskScore >= 0.45 ? 'text-warning' : 'text-success';
  const trajectory = cohortTrajectories[cohort.name];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost p-1">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-primary">{cohort.name}</h2>
          <p className="text-2xs text-tertiary mt-0.5">
            Risk score <span className={`font-mono font-medium ${riskColor}`}>{(cohort.riskScore * 100).toFixed(0)}</span> · {formatNumber(cohort.memberCount)} members
          </p>
        </div>
      </div>

      {/* Hero: Cohort trajectory chart */}
      {trajectory && <CohortTrajectoryChart trajectory={trajectory} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Members" value={formatNumber(cohort.memberCount)} icon={<Users size={14} />} />
        <MetricCard label="Avg Health Score" value={String(cohort.avgHealthScore)} icon={<Activity size={14} />} />
        <MetricCard label="Avg Confidence" value={cohort.avgConfidenceScore.toFixed(2)} icon={<Gauge size={14} />} />
        <MetricCard label="Verified" value={formatPercent(cohort.verifiedPct)} icon={<Shield size={14} />} />
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable
          data={members}
          columns={columns}
          pageSize={20}
          onRowClick={onSelectIdentity}
        />
      </div>
    </div>
  );
}
