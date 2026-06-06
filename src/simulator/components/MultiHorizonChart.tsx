import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SimulationOutput } from '../types';
import { formatCurrencyCompact } from '@/utils/format';

interface MultiHorizonChartProps {
  output: SimulationOutput;
}

export default function MultiHorizonChart({ output }: MultiHorizonChartProps) {
  // Merge all horizons into a single timeline
  const maxMonths = 36;
  const data = Array.from({ length: maxMonths }, (_, i) => {
    const month = i + 1;
    const h90d = month <= 3 ? output.horizons['90d'].monthlyProjections[i] : null;
    const h1y = month <= 12 ? output.horizons['1y'].monthlyProjections[i] : null;
    const h3y = month <= 36 ? output.horizons['3y'].monthlyProjections[i] : null;

    const primary = h3y ?? h1y ?? h90d;

    return {
      month,
      netValue: primary?.netValue ?? 0,
      cumulative: primary?.cumulativeSavings ?? 0,
      confidenceLow: primary?.confidenceLow ?? 0,
      confidenceHigh: primary?.confidenceHigh ?? 0,
      rewardCost: primary?.rewardCost ?? 0,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-2xs text-tertiary">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Net Value
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" /> Cumulative Savings
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Reward Cost
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-accent/20" /> Confidence Band
        </span>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              stroke="var(--color-tertiary)"
              label={{ value: 'Month', position: 'bottom', fontSize: 10 }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="var(--color-tertiary)"
              tickFormatter={(v) => formatCurrencyCompact(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number) => formatCurrencyCompact(value)}
            />
            {/* Confidence band */}
            <Area type="monotone" dataKey="confidenceHigh" stroke="none" fill="var(--color-accent)" fillOpacity={0.08} />
            <Area type="monotone" dataKey="confidenceLow" stroke="none" fill="var(--color-surface)" fillOpacity={1} />
            {/* Lines */}
            <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} name="Cumulative" />
            <Area type="monotone" dataKey="netValue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} name="Net Value" />
            <Area type="monotone" dataKey="rewardCost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={1.5} name="Reward Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Horizon markers */}
      <div className="flex items-center gap-4 text-2xs">
        <span className="rounded border border-border bg-surface px-2 py-0.5 text-tertiary">90d</span>
        <span className="rounded border border-accent/20 bg-accent/5 px-2 py-0.5 text-accent">1y</span>
        <span className="rounded border border-border bg-surface px-2 py-0.5 text-tertiary">3y</span>
      </div>
    </div>
  );
}
