import type { SimulationOutput } from '../types';
import { formatCurrencyCompact, formatPercent } from '@/utils/format';

interface OutputSummaryPanelProps {
  output: SimulationOutput;
  horizon: '90d' | '1y' | '3y';
}

export default function OutputSummaryPanel({ output, horizon }: OutputSummaryPanelProps) {
  const h = output.horizons[horizon];

  const metrics = [
    { label: 'Gross Value', value: formatCurrencyCompact(h.grossTotalValue), color: 'text-primary' },
    { label: 'Reward Budget', value: formatCurrencyCompact(h.recommendedRewardBudget), color: 'text-primary' },
    { label: 'Net ROI', value: formatCurrencyCompact(h.netROI), color: h.netROI >= 0 ? 'text-green-500' : 'text-red-400' },
    { label: 'Claims Impact', value: formatCurrencyCompact(h.projectedClaimsImpact), color: 'text-primary' },
    { label: 'Morbidity Shift', value: `${h.morbidityShiftBps} bps`, color: 'text-primary' },
    { label: 'Actuary Confidence', value: formatPercent(h.actuaryConfidence), color: h.actuaryConfidence >= 0.62 ? 'text-green-500' : h.actuaryConfidence >= 0.40 ? 'text-amber-400' : 'text-secondary' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => (
        <div key={m.label} className="card flex flex-col gap-1 transition-all duration-150 hover:-translate-y-[1px] hover:shadow-lg">
          <span className="metric-label">{m.label}</span>
          <span className={`metric-value font-display ${m.color}`}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}
