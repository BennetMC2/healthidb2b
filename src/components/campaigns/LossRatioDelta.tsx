import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { calculateLossRatioDelta } from '@/utils/actuarial';
import { formatCurrency } from '@/utils/format';
import type { Campaign } from '@/types';

interface LossRatioDeltaProps {
  campaign: Campaign;
}

export default function LossRatioDelta({ campaign }: LossRatioDeltaProps) {
  const result = useMemo(() => {
    const startDate = new Date(campaign.startDate);
    const campaignAgeMonths = Math.max(1, Math.round((Date.now() - startDate.getTime()) / (30 * 86400000)));

    return calculateLossRatioDelta({
      metric: campaign.challenge.metric,
      useCase: campaign.useCase,
      type: campaign.type,
      enrolled: campaign.funnel.enrolled,
      verified: campaign.funnel.verified,
      budgetSpent: campaign.rewards.budgetSpent,
      budgetCeiling: campaign.rewards.budgetCeiling,
      campaignAgeMonths,
    });
  }, [campaign]);

  const chartData = result.complianceLiftTimeSeries.map((d) => ({
    month: `M${d.month}`,
    observed: d.observed,
    predicted: d.predicted,
  }));

  return (
    <div className="card border-t-2 border-t-accent">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown size={16} className="text-accent" />
        <h3 className="text-sm font-semibold text-primary">Loss-Ratio Delta Model</h3>
      </div>

      {/* Hero metric */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-3xl font-bold text-success">
          {result.deltaPercent > 0 ? '+' : ''}{result.deltaPercent.toFixed(2)}%
        </span>
        <span className="text-xs text-tertiary">vs Do Nothing Baseline</span>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
          <div className="text-2xs text-tertiary">Baseline Loss Ratio</div>
          <div className="font-mono text-sm font-semibold text-primary mt-0.5">
            {(result.baselineLossRatio * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
          <div className="text-2xs text-tertiary">Projected Loss Ratio</div>
          <div className="font-mono text-sm font-semibold text-primary mt-0.5">
            {(result.projectedLossRatio * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
          <div className="text-2xs text-tertiary">Cost / Compliant Member</div>
          <div className="font-mono text-sm font-semibold text-primary mt-0.5">
            {formatCurrency(result.costPerCompliantMember)}
          </div>
        </div>
      </div>

      {/* Compliance Lift Chart */}
      <div className="h-[200px] mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-tertiary)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-tertiary)' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="observed"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Observed"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 2 }}
              name="Predicted"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-2xs text-tertiary border-t border-border pt-2">
        <span>Annualized savings: <span className="font-mono text-secondary">{formatCurrency(result.annualizedSavings)}</span></span>
        <span>Model confidence: <span className="font-mono text-secondary">{(result.confidence * 100).toFixed(0)}%</span></span>
      </div>
    </div>
  );
}
