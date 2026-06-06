import { useMemo } from 'react';
import { DollarSign, TrendingUp, Award } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import RangeDisplay from '../../components/RangeDisplay';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { runSimulation } from '../../engine/simulate';

export default function FinancialChapter() {
  const config = useSimulatorStore((s) => s.config);

  const result = useMemo(() => {
    if (config.selectedCampaigns.length === 0) return null;
    try {
      return runSimulation(config);
    } catch {
      return null;
    }
  }, [config]);

  if (!result) {
    return (
      <ChapterLayout chapter={6}>
        <EvidenceCallout title="Run simulation first" type="warning">
          Go back to Chapter 3 to select your campaigns.
        </EvidenceCallout>
      </ChapterLayout>
    );
  }

  const { financials, multiCampaign } = result;
  const combined = multiCampaign.combined;
  const horizonYears = config.horizonMonths / 12;

  return (
    <ChapterLayout
      chapter={6}
      sources={financials.sources}
    >
      {/* Headline ROI */}
      <div className="card border-accent/20">
        <div className="text-center">
          <div className="text-2xs uppercase tracking-[0.2em] text-accent/80">Net ROI Multiple</div>
          <div className="mt-2 font-mono text-5xl font-semibold text-primary">
            {combined.roiMultiple.central.toFixed(1)}×
          </div>
          <RangeDisplay range={combined.roiMultiple} format="multiple" className="mt-1 justify-center" />
          <p className="mt-2 text-sm text-tertiary">
            For every $1 spent on rewards, ${combined.roiMultiple.central.toFixed(1)} returns in value
          </p>
        </div>
      </div>

      {/* Value breakdown */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <DollarSign size={15} className="text-accent" />
          Value Breakdown ({horizonYears} year{horizonYears > 1 ? 's' : ''})
        </div>

        <div className="mt-4 space-y-3">
          <ValueRow label="Claims savings (mortality + morbidity)" range={financials.grossClaimsSavings} />
          <ValueRow label="Lapse reduction" range={financials.lapseReduction} />
          <ValueRow label="Cross-sell uplift" range={financials.crossSellUplift} />
          <div className="border-t border-border pt-2">
            <ValueRow label="Gross total value" range={financials.grossTotalValue} bold />
          </div>
          <ValueRow label={`Reward budget (${(config.rewardCeilingPct * 100).toFixed(0)}% ceiling)`} range={financials.affordableRewardBudget} negative />
          <div className="border-t border-border pt-2">
            <ValueRow label="Net ROI" range={financials.netROI} bold />
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Reward per member/month"
          range={financials.rewardPerMemberPerMonth}
          format="currency"
          icon={<Award size={18} className="text-accent" />}
        />
        <MetricCard
          label="Payback period"
          range={financials.paybackMonths}
          format="number"
          suffix=" months"
          icon={<TrendingUp size={18} className="text-accent" />}
        />
        <MetricCard
          label="ROI multiple"
          range={combined.roiMultiple}
          format="multiple"
          icon={<DollarSign size={18} className="text-accent" />}
        />
      </div>

      {/* Discovery benchmark */}
      <EvidenceCallout title="Discovery Vitality benchmark" type="success" source="Discovery Vitality 13-year longitudinal programme data (2010-2023). n=5,200,000">
        Discovery Vitality achieves 1.8× ROI at scale with $120/member/year.
        Our central estimate of {combined.roiMultiple.central.toFixed(1)}× is{' '}
        {combined.roiMultiple.central > 1.8 ? 'above' : combined.roiMultiple.central > 1.5 ? 'consistent with' : 'below'}{' '}
        this benchmark. The model uses the same archetype-based framework
        calibrated from their 13-year longitudinal data.
      </EvidenceCallout>

      {/* Per-archetype ROI */}
      <div className="card">
        <div className="text-sm font-semibold text-primary">Per-Archetype ROI</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left text-tertiary font-medium">Archetype</th>
                <th className="py-2 text-right text-tertiary font-medium">Count</th>
                <th className="py-2 text-right text-tertiary font-medium">Gross Value</th>
                <th className="py-2 text-right text-tertiary font-medium">Reward Cost</th>
                <th className="py-2 text-right text-tertiary font-medium">Net Value</th>
                <th className="py-2 text-right text-tertiary font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {financials.archetypeROI.map((arch) => (
                <tr key={arch.id} className="border-b border-border/50">
                  <td className="py-2 font-medium text-primary">{arch.name}</td>
                  <td className="py-2 text-right font-mono text-secondary">{arch.count.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono text-secondary">
                    <RangeDisplay range={arch.grossValue} format="currency" compact />
                  </td>
                  <td className="py-2 text-right font-mono text-secondary">
                    <RangeDisplay range={arch.rewardCost} format="currency" compact />
                  </td>
                  <td className="py-2 text-right font-mono text-primary">
                    <RangeDisplay range={arch.netValue} format="currency" compact />
                  </td>
                  <td className="py-2 text-right font-mono text-primary">
                    <RangeDisplay range={arch.roiMultiple} format="multiple" compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ChapterLayout>
  );
}

function ValueRow({ label, range, bold, negative }: {
  label: string;
  range: import('../../types').Range;
  bold?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${bold ? 'font-semibold text-primary' : 'text-secondary'}`}>
        {negative && '−'}{label}
      </span>
      <RangeDisplay range={range} format="currency" className={bold ? 'text-primary' : ''} />
    </div>
  );
}

function MetricCard({ label, range, format, suffix, icon }: {
  label: string;
  range: import('../../types').Range;
  format: 'currency' | 'number' | 'multiple';
  suffix?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-tertiary">{label}</span>
      </div>
      <div className="mt-2">
        <RangeDisplay range={range} format={format} />
        {suffix && <span className="text-xs text-tertiary">{suffix}</span>}
      </div>
    </div>
  );
}
