import type { SimulationOutput } from '../types';
import { formatCurrencyCompact, formatPercent } from '@/utils/format';

interface ScenarioComparePanelProps {
  scenarios: { name: string; output: SimulationOutput }[];
  horizon: '90d' | '1y' | '3y';
}

const COMPARE_METRICS = [
  { key: 'netROI', label: 'Net ROI', format: (v: number) => formatCurrencyCompact(v) },
  { key: 'projectedClaimsImpact', label: 'Claims Impact', format: (v: number) => formatCurrencyCompact(v) },
  { key: 'morbidityShiftBps', label: 'Morbidity Shift (bps)', format: (v: number) => `${v}` },
  { key: 'paybackMonths', label: 'Payback (months)', format: (v: number) => `${v}` },
  { key: 'engagementScore', label: 'Engagement Score', format: (v: number) => `${v}/100` },
  { key: 'actuaryConfidence', label: 'Actuary Confidence', format: (v: number) => formatPercent(v) },
  { key: 'lapseRateImpact', label: 'Lapse Impact', format: (v: number) => formatCurrencyCompact(v) },
  { key: 'crossSellUplift', label: 'Cross-Sell Uplift', format: (v: number) => formatCurrencyCompact(v) },
] as const;

export default function ScenarioComparePanel({ scenarios, horizon }: ScenarioComparePanelProps) {
  if (scenarios.length === 0) return null;

  // Find best value for each metric
  const bestValues: Record<string, number> = {};
  for (const metric of COMPARE_METRICS) {
    const values = scenarios.map((s) => {
      const h = s.output.horizons[horizon];
      return h[metric.key as keyof typeof h] as number;
    });
    bestValues[metric.key] = Math.max(...values);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-3 text-2xs text-tertiary font-normal">Metric</th>
            {scenarios.map((s) => (
              <th key={s.name} className="py-2 px-3 text-left text-2xs text-tertiary font-normal">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_METRICS.map((metric) => (
            <tr key={metric.key} className="border-b border-border/40">
              <td className="py-2.5 pr-3 text-secondary font-medium">{metric.label}</td>
              {scenarios.map((s) => {
                const h = s.output.horizons[horizon];
                const value = h[metric.key as keyof typeof h] as number;
                const isBest = scenarios.length > 1 && value === bestValues[metric.key];

                return (
                  <td key={s.name} className="py-2.5 px-3">
                    <span className={`font-mono ${isBest ? 'text-green-500 font-semibold' : 'text-primary'}`}>
                      {metric.format(value)}
                    </span>
                    {isBest && scenarios.length > 1 && (
                      <span className="ml-1 text-2xs text-green-500">Best</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
