import { useMemo } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';
import { calculateActuarialROI, useEconomics } from '@/lib/economics';
import { useModelStore } from '@/stores/useModelStore';
import type { PlayEconomics } from '@/lib/playEconomics';
import type { CampaignType, CampaignUseCase, HealthMetric } from '@/types';

interface ActuarialROICalculatorProps {
  metric: HealthMetric | '';
  type: CampaignType | '';
  useCase: CampaignUseCase | '';
  maxParticipants: number;
  budgetCeiling: number;
  onApplySuggestedHP?: (hp: number) => void;
  showVNB?: boolean;
  variant?: 'compact' | 'hero';
  // When set (creating a recommended play), the headline economics are pinned to
  // the canonical per-play simulation so this panel matches the AI Actuary card.
  pinnedEcon?: PlayEconomics | null;
}

const EVIDENCE_COLORS: Record<string, { dot: string; value: string }> = {
  high: { dot: 'bg-success', value: 'text-success' },
  medium: { dot: 'bg-warning', value: 'text-warning' },
  low: { dot: 'bg-tertiary/50', value: 'text-tertiary' },
};

function getProjectionCopy(useCase: CampaignUseCase | '') {
  if (useCase === 'acquisition') {
    return {
      description: 'The model prices Health Points against verified signup quality and projected acquired est. book value.',
      primaryRate: 'Verified Signup Rate',
      valueLabel: 'Est. Acquired Book Value',
      shiftLabel: 'Quality Shift',
      verifiedDetail: 'verified signups',
      framingLabel: 'acquired value',
    };
  }

  if (useCase === 'renewal') {
    return {
      description: 'The model prices Health Points against engagement recovery, renewal lift, and retained est. book value.',
      primaryRate: 'Renewal Lift',
      valueLabel: 'Est. Retained Book Value',
      shiftLabel: 'Retention Shift',
      verifiedDetail: 'verified streaks',
      framingLabel: 'retained value',
    };
  }

  if (useCase === 'underwriting') {
    return {
      description: 'The model prices Health Points against proof completion, review avoidance, and underwriting efficiency value.',
      primaryRate: 'Review Avoidance',
      valueLabel: 'Efficiency Value',
      shiftLabel: 'Risk Selection Shift',
      verifiedDetail: 'eligible receipts',
      framingLabel: 'efficiency value',
    };
  }

  return {
    description: 'The model prices Health Points against expected behaviour change and healthy-life value uplift.',
    primaryRate: 'Risk Improvement',
    valueLabel: 'Healthy-Life Value',
    shiftLabel: 'Morbidity Shift',
    verifiedDetail: 'verified lives',
    framingLabel: 'healthy-life value',
  };
}

export default function ActuarialROICalculator({
  metric,
  type,
  useCase,
  maxParticipants,
  budgetCeiling,
  onApplySuggestedHP,
  showVNB = false,
  variant = 'compact',
  pinnedEcon = null,
}: ActuarialROICalculatorProps) {
  const isHero = variant === 'hero';
  const copy = getProjectionCopy(useCase);
  const eco = useEconomics();
  // Economics follow the GLOBAL model switch (Forward = upside, Floor =
  // conservative) — there is no separate local toggle anymore.
  const currentModel = useModelStore((s) => s.currentModel());
  const isUpside = currentModel.confidencePosture !== 'floor';

  const roi = useMemo(
    () =>
      calculateActuarialROI(eco, {
        metric,
        type,
        useCase,
        maxParticipants,
        budgetCeiling,
        applyAdjustments: !isUpside,
      }),
    [metric, type, useCase, maxParticipants, budgetCeiling, isUpside, eco],
  );

  const evidence = EVIDENCE_COLORS[roi.evidenceLevel] ?? EVIDENCE_COLORS.low;
  // Pinned mode: headline tiles come from the canonical play simulation so this
  // panel exactly matches the AI Actuary card. Pricing tiles (HP yield, morbidity
  // shift) stay from the live projection.
  const pinned = pinnedEcon;
  const ready = pinned ? true : roi.isReady;
  const projectionTiles = [
    {
      label: copy.primaryRate,
      value: pinned ? `${(pinned.behaviorChangeRate * 100).toFixed(0)}%` : roi.isReady ? `${(roi.claimsReductionRate * 100).toFixed(1)}%` : '—',
      detail: pinned ? 'behaviour change' : roi.isReady ? `${roi.confidenceLabel}` : 'Select a signal',
      tone: ready ? evidence.value : 'text-tertiary',
    },
    {
      label: copy.valueLabel,
      value: pinned ? formatCurrencyCompact(pinned.bookValue) : roi.isReady ? formatCurrencyCompact(roi.totalProjectedSavings) : '—',
      detail: pinned ? 'from play simulation' : roi.isReady ? `${roi.scenarioHorizonMonths}-month horizon` : 'Awaiting cohort',
      tone: ready ? 'text-accent' : 'text-tertiary',
    },
    {
      label: 'Budget ROI',
      value: pinned ? `${pinned.roi.toFixed(1)}×` : roi.isReady ? `${roi.budgetROI.toFixed(1)}×` : '—',
      detail: pinned
        ? `${pinned.roiLow.toFixed(1)}×–${pinned.roiHigh.toFixed(1)}× band`
        : roi.isReady ? `${formatCurrencyCompact(roi.scenarioRangeLow)}–${formatCurrencyCompact(roi.scenarioRangeHigh)} range` : 'Budget required',
      tone: !ready ? 'text-tertiary' : (pinned ? pinned.roi : roi.budgetROI) >= 2 ? 'text-accent' : (pinned ? pinned.roi : roi.budgetROI) < 1 ? 'text-warning' : 'text-primary',
    },
    {
      label: 'Suggested HP Yield',
      value: roi.isReady ? `${roi.suggestedHP} HP` : '—',
      detail: roi.isReady ? 'Per verified receipt' : 'No model yet',
      tone: roi.isReady ? 'text-primary' : 'text-tertiary',
    },
    {
      label: copy.shiftLabel,
      value: roi.isReady ? `${roi.morbidityShiftBps} bps` : '—',
      detail: roi.isReady ? `${roi.expectedVerifiedLives.toLocaleString()} ${copy.verifiedDetail}` : 'Needs participants',
      tone: roi.isReady ? 'text-primary' : 'text-tertiary',
    },
    {
      label: 'Payback Period',
      value: pinned
        ? (pinned.payback != null ? `${pinned.payback} mo` : '—')
        : roi.isReady && roi.paybackMonths > 0 ? (roi.paybackMonths >= 36 ? '36 mo+' : `${roi.paybackMonths} mo`) : '—',
      detail: ready ? 'Net-positive estimate' : 'Needs budget',
      tone: ready ? 'text-primary' : 'text-tertiary',
    },
  ];

  return (
    <div className={`card relative overflow-hidden border-accent/20 bg-elevated before:absolute before:left-0 before:right-0 before:top-0 before:h-[3px] before:bg-accent ${isHero ? 'p-6' : 'p-5'}`}>
      <div className={`mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${isHero ? 'xl:mb-6' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
            <TrendingUp size={20} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.18em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              AI Actuary · Live Projection
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-primary">
              Campaign economics
            </h2>
            <p className={`mt-1 text-sm leading-relaxed text-secondary ${isHero ? 'max-w-[680px]' : ''}`}>
              {copy.description}
            </p>
          </div>
        </div>
        {/* Model is driven by the global switch in the header — shown here, not toggled. */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface/80 px-3 py-1.5 text-2xs font-medium text-secondary">
          <span className={`h-1.5 w-1.5 rounded-full ${isUpside ? 'bg-warning' : 'bg-accent'}`} />
          Model: {currentModel.name}
        </div>
      </div>

      {ready && (
        <div
          className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium ${
            isUpside ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isUpside ? 'bg-warning' : 'bg-accent'}`} />
          {pinned ? 'Priced from play simulation' : isUpside ? 'Modeled upside case' : 'Conservative case'}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${isHero ? 'xl:grid-cols-3 2xl:grid-cols-6' : ''}`}>
        {projectionTiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border bg-surface/70 p-4">
            <span className="metric-label block">{tile.label}</span>
            <span className={`mt-2 block font-mono font-semibold leading-none tracking-tight ${isHero ? 'text-[1.65rem]' : 'text-[1.85rem]'} ${tile.tone}`}>
              {tile.value}
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-tertiary">{tile.detail}</span>
            {tile.label === 'Suggested HP Yield' && roi.isReady && onApplySuggestedHP && (
              <button onClick={() => onApplySuggestedHP(roi.suggestedHP)} className="mt-2 text-xs font-medium text-accent underline">
                Apply yield
              </button>
            )}
          </div>
        ))}
      </div>

      {roi.isReady && (
        <div className={`mt-4 grid grid-cols-1 gap-3 ${isHero ? 'lg:grid-cols-2' : ''}`}>
          <div className="flex items-start gap-2 rounded-2xl border border-border bg-surface/70 p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-tertiary" />
            <p className="text-xs leading-relaxed text-tertiary">
              <span className="font-medium text-secondary">{roi.confidenceLabel}.</span>{' '}
              Directional planning model based on literature, expected verification conversion, and outcome timing. Useful for prioritization, not certification.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-2xl border border-border bg-surface/60 p-3">
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-2xs font-medium ${
                roi.evidenceLevel === 'high'
                  ? 'bg-success/10 text-success'
                  : roi.evidenceLevel === 'medium'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-tertiary/10 text-tertiary'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${evidence.dot}`} />
              {roi.evidenceLevel} evidence
            </span>
            <span className="text-xs leading-relaxed text-tertiary">{roi.evidenceNote}</span>
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-tertiary">
        {roi.isReady ? (
          <>
            {roi.savingsFraming} · {maxParticipants.toLocaleString()} targeted members · ${roi.savingsPerMember.toFixed(0)}/targeted member
            {roi.additionalNote && (
              <>
                <br />
                <span className="text-tertiary/70">{roi.additionalNote}</span>
              </>
            )}
            <br />
            <span className="text-tertiary/70">
              Modeled improvement rate {(roi.modeledImprovementRate * 100).toFixed(1)}% · confidence {roi.modelConfidence.toFixed(2)}
            </span>
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
                <span className="text-accent/80 font-medium">~{formatCurrency(roi.vnbImpactPer1MMAPE)} VNB impact per $1M MAPE</span>
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
