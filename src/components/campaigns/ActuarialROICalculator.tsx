import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { calculateActuarialROI } from '@/utils/actuarial';
import type { HealthMetric, CampaignType, CampaignUseCase } from '@/types';

interface ActuarialROICalculatorProps {
  metric: HealthMetric | '';
  type: CampaignType | '';
  useCase: CampaignUseCase | '';
  maxParticipants: number;
  budgetCeiling: number;
  onApplySuggestedHP?: (hp: number) => void;
}

const EVIDENCE_COLORS: Record<string, { dot: string; text: string; value: string }> = {
  high:   { dot: 'bg-success',       text: 'text-success',   value: 'text-success' },
  medium: { dot: 'bg-warning',       text: 'text-warning',   value: 'text-warning' },
  low:    { dot: 'bg-tertiary/50',   text: 'text-tertiary',  value: 'text-tertiary' },
};

export default function ActuarialROICalculator({
  metric,
  type,
  useCase,
  maxParticipants,
  budgetCeiling,
  onApplySuggestedHP,
}: ActuarialROICalculatorProps) {
  const roi = useMemo(
    () => calculateActuarialROI({ metric, type, useCase, maxParticipants, budgetCeiling }),
    [metric, type, useCase, maxParticipants, budgetCeiling],
  );

  const evidence = EVIDENCE_COLORS[roi.evidenceLevel] ?? EVIDENCE_COLORS.low;

  return (
    <div className="card border-accent/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
          <TrendingUp size={14} className="text-accent" />
        </div>
        <div>
          <span className="text-xs font-semibold text-primary">Actuarial ROI Projection</span>
          <span className="text-2xs text-tertiary ml-2">Live Model</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Claims Reduction */}
        <div>
          <span className="text-2xs text-tertiary block">Claims Reduction</span>
          <span className={`font-mono text-sm font-semibold ${roi.isReady ? evidence.value : 'text-tertiary'}`}>
            {roi.isReady ? `${(roi.claimsReductionRate * 100).toFixed(0)}%` : '—'}
          </span>
        </div>

        {/* Projected Savings */}
        <div>
          <span className="text-2xs text-tertiary block">Projected Savings</span>
          <span className={`font-mono text-sm font-semibold ${roi.isReady && roi.totalProjectedSavings > 0 ? 'text-accent' : 'text-tertiary'}`}>
            {roi.isReady ? formatCurrency(roi.totalProjectedSavings) : '—'}
          </span>
        </div>

        {/* Budget ROI */}
        <div>
          <span className="text-2xs text-tertiary block">Budget ROI</span>
          <span className={`font-mono text-sm font-semibold ${
            !roi.isReady ? 'text-tertiary' :
            roi.budgetROI >= 2 ? 'text-accent' :
            roi.budgetROI < 1 ? 'text-warning' :
            'text-primary'
          }`}>
            {roi.isReady ? `${roi.budgetROI.toFixed(1)}×` : '—'}
          </span>
        </div>

        {/* Suggested HP */}
        <div>
          <span className="text-2xs text-tertiary block">Suggested HP</span>
          <span className="font-mono text-sm font-semibold text-primary">
            {roi.isReady ? `${roi.suggestedHP} HP` : '—'}
          </span>
          {roi.isReady && onApplySuggestedHP && (
            <button
              onClick={() => onApplySuggestedHP(roi.suggestedHP)}
              className="text-2xs text-accent underline mt-0.5 block"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {/* Evidence line */}
      {roi.isReady && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className={`w-1.5 h-1.5 rounded-full ${evidence.dot}`} />
          <span className={`text-2xs font-medium ${evidence.text} capitalize`}>{roi.evidenceLevel}</span>
          <span className="text-2xs text-tertiary">{roi.evidenceNote}</span>
        </div>
      )}

      {/* Footer */}
      <p className="text-2xs text-tertiary mt-1.5">
        {roi.isReady ? (
          <>
            {roi.savingsFraming} · {maxParticipants.toLocaleString()} participants · ${roi.savingsPerMember.toFixed(0)}/member
            {roi.additionalNote && (
              <>
                <br />
                <span className="text-tertiary/70">{roi.additionalNote}</span>
              </>
            )}
          </>
        ) : (
          'Select a metric and audience to see projections'
        )}
      </p>
    </div>
  );
}
