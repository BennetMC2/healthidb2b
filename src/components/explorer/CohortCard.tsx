import { ArrowRight } from 'lucide-react';
import { formatNumber } from '@/utils/format';
import { DATA_SOURCE_LABELS } from '@/utils/constants';
import type { CohortSummary } from '@/utils/cohorts';

interface CohortCardProps {
  cohort: CohortSummary;
  onClick: () => void;
}

function riskColor(score: number): string {
  if (score >= 0.65) return 'text-error';
  if (score >= 0.45) return 'text-warning';
  return 'text-success';
}

function riskBg(score: number): string {
  if (score >= 0.65) return 'bg-error-muted border-error/20';
  if (score >= 0.45) return 'bg-warning-muted border-warning/20';
  return 'bg-success-muted border-success/20';
}

export default function CohortCard({ cohort, onClick }: CohortCardProps) {
  return (
    <button
      onClick={onClick}
      className="card text-left transition-colors hover:bg-hover group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${riskBg(cohort.riskScore)} ${riskColor(cohort.riskScore)}`}>
              Risk {(cohort.riskScore * 100).toFixed(0)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-primary truncate">{cohort.name}</h3>
        </div>
        <ArrowRight size={14} className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div>
          <span className="text-2xs text-tertiary block">Members</span>
          <span className="text-xs font-mono font-medium text-primary">{formatNumber(cohort.memberCount)}</span>
        </div>
        <div>
          <span className="text-2xs text-tertiary block">Avg Health</span>
          <span className="text-xs font-mono font-medium text-primary">{cohort.avgHealthScore}</span>
        </div>
        <div>
          <span className="text-2xs text-tertiary block">Confidence</span>
          <span className="text-xs font-mono font-medium text-primary">{cohort.avgConfidenceScore.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {cohort.topSources.map((s) => (
          <span key={s.source} className="badge bg-elevated border-border text-tertiary text-2xs">
            {DATA_SOURCE_LABELS[s.source]}
          </span>
        ))}
      </div>
    </button>
  );
}
