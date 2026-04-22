import { useMemo, useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';
import { calculateActuarialROI, getMetricComparisons } from '@/utils/actuarial';
import type { HealthMetric, CampaignType, CampaignUseCase } from '@/types';

interface ActuarialROICalculatorProps {
  metric: HealthMetric | '';
  type: CampaignType | '';
  useCase: CampaignUseCase | '';
  maxParticipants: number;
  budgetCeiling: number;
  onApplySuggestedHP?: (hp: number) => void;
  showVNB?: boolean;
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
  showVNB = false,
}: ActuarialROICalculatorProps) {
  const [mode, setMode] = useState<'gross' | 'adjusted'>('gross');

  const roi = useMemo(
    () => calculateActuarialROI({ metric, type, useCase, maxParticipants, budgetCeiling, applyAdjustments: mode === 'adjusted' }),
    [metric, type, useCase, maxParticipants, budgetCeiling, mode],
  );

  const evidence = EVIDENCE_COLORS[roi.evidenceLevel] ?? EVIDENCE_COLORS.low;

  const comparisons = useMemo(
    () => (roi.isReady ? getMetricComparisons(useCase, type, metric) : []),
    [useCase, type, metric, roi.isReady],
  );

  const maxSavings = comparisons.length > 0 ? comparisons[0].savingsPerMember : 1;

  const pPositive = roi.evidenceLevel === 'high' ? '~74%' : roi.evidenceLevel === 'medium' ? '~58%' : '~41%';
  const ciRange = roi.evidenceLevel === 'high'
    ? (type === 'stream' ? '0.6× – 2.8×' : '0.4× – 2.2×')
    : roi.evidenceLevel === 'medium' ? '0.2× – 1.8×' : '0.1× – 1.2×';

  return (
    <div className="card border-accent/10 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-accent/40 before:rounded-l">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
            <TrendingUp size={14} className="text-accent" />
          </div>
          <div>
            <span className="text-sm font-semibold text-primary font-display">Actuarial ROI Projection</span>
            <span className="text-2xs text-tertiary ml-2">Live Model</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-border/50 rounded p-0.5">
          <button
            onClick={() => setMode('gross')}
            className={`px-2 py-0.5 rounded text-2xs font-medium transition-colors ${
              mode === 'gross' ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
            }`}
          >
            Gross
          </button>
          <button
            onClick={() => setMode('adjusted')}
            className={`px-2 py-0.5 rounded text-2xs font-medium transition-colors ${
              mode === 'adjusted' ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
            }`}
          >
            Causal-adj.
          </button>
        </div>
      </div>

      {roi.isReady && (
        <div className={`inline-flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded text-2xs font-medium ${
          mode === 'gross' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${mode === 'gross' ? 'bg-warning' : 'bg-accent'}`} />
          {mode === 'gross'
            ? 'Upper-bound estimate — causal adjustments not applied'
            : 'Causal-adjusted (−30% selection, −15% regression, ×25% uptake)'}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
            {roi.isReady ? formatCurrencyCompact(roi.totalProjectedSavings) : '—'}
          </span>
          {roi.isReady && <span className="text-2xs text-tertiary/60 block">over 18 mo</span>}
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
          {roi.isReady && (
            <span className="text-2xs text-tertiary/60 block leading-tight mt-0.5">
              {pPositive} · CI: {ciRange}
            </span>
          )}
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

        {/* Morbidity Shift */}
        <div>
          <span className="text-2xs text-tertiary block">Morbidity Shift</span>
          <span className={`font-mono text-sm font-semibold ${roi.isReady && roi.morbidityShiftBps > 0 ? 'text-primary' : 'text-tertiary'}`}>
            {roi.isReady && roi.morbidityShiftBps > 0 ? `${roi.morbidityShiftBps} bps` : '—'}
          </span>
        </div>

        {/* Payback Period */}
        <div>
          <span className="text-2xs text-tertiary block">Payback Period</span>
          <span className={`font-mono text-sm font-semibold ${roi.isReady && roi.paybackMonths > 0 ? 'text-primary' : 'text-tertiary'}`}>
            {roi.isReady && roi.paybackMonths > 0
              ? roi.paybackMonths >= 36 ? '36 mo+' : `${roi.paybackMonths} mo`
              : '—'}
          </span>
        </div>
      </div>

      {/* Bühlmann Credibility Banner */}
      {roi.isReady && (
        <div className="flex items-start gap-1.5 mt-3 p-2 rounded bg-border/30">
          <Info size={11} className="text-tertiary mt-0.5 shrink-0" />
          <p className="text-2xs text-tertiary leading-relaxed">
            <span className="font-medium text-secondary">Z ≈ 0 — Literature projection.</span>{' '}
            Projections are based entirely on peer-reviewed literature (Bühlmann credibility factor Z ≈ 0).
            No HealthID-specific claims data exists yet. Treat as indicative, not actuarially certified.
            {' '}<span className="text-tertiary/60">Causal adjustments applied: selection bias −30%, regression-to-mean −15%.</span>
          </p>
        </div>
      )}

      {/* Evidence line */}
      {roi.isReady && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-medium ${
            roi.evidenceLevel === 'high' ? 'bg-success/10 text-success' :
            roi.evidenceLevel === 'medium' ? 'bg-warning/10 text-warning' :
            'bg-tertiary/10 text-tertiary'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${evidence.dot}`} />
            {roi.evidenceLevel} evidence
          </span>
          <span className="text-2xs text-tertiary">{roi.evidenceNote}</span>
        </div>
      )}

      {/* Metric Comparison Bars */}
      {roi.isReady && comparisons.length > 0 && (
        <div className="mt-2.5 space-y-1">
          <span className="text-2xs text-tertiary">vs. top metrics · savings / member</span>
          {comparisons.map((c) => (
            <div key={c.metric} className="flex items-center gap-2">
              <span className={`w-28 truncate text-2xs ${c.isSelected ? 'text-accent font-medium' : 'text-tertiary'}`}>
                {c.label}
              </span>
              <div className="flex-1 h-1 rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${c.isSelected ? 'bg-accent/50' : 'bg-secondary/40'}`}
                  style={{ width: `${(c.savingsPerMember / maxSavings) * 100}%` }}
                />
              </div>
              <span className={`w-10 text-right font-mono text-2xs ${c.isSelected ? 'text-accent font-medium' : 'text-tertiary'}`}>
                ${c.savingsPerMember.toFixed(0)}
              </span>
            </div>
          ))}
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
            {budgetCeiling > 0 && roi.suggestedHP > 0 && (
              <>
                <br />
                <span className="text-tertiary/70">
                  Budget funds ~{Math.floor(budgetCeiling / (roi.suggestedHP * 0.011)).toLocaleString()} verifications at {roi.suggestedHP} HP each
                </span>
              </>
            )}
            {showVNB && roi.vnbImpactPer1MMAPE > 0 && (
              <>
                <br />
                <span className="text-accent/80 font-medium">
                  ~{formatCurrency(roi.vnbImpactPer1MMAPE)} VNB impact per $1M MAPE
                </span>
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
