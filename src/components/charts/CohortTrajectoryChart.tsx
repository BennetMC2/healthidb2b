import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, ShieldCheck, FlaskConical } from 'lucide-react';
import type { TrajectoryData } from '@/data/cohortTrajectories';

interface CohortTrajectoryChartProps {
  trajectory: TrajectoryData;
  /** Compact variant for embedding in cards */
  compact?: boolean;
}

export default function CohortTrajectoryChart({ trajectory, compact = false }: CohortTrajectoryChartProps) {
  const { points, deltaVsHoldout, confidenceInterval, pValue, treatmentN, holdoutN, status, baselineHealth, campaignStartWeek, leadSignal } = trajectory;

  const chartData = useMemo(() =>
    points.map((p) => ({
      week: `W${p.week}`,
      weekNum: p.week,
      Treatment: p.treatmentHealth,
      Holdout: p.holdoutHealth,
    })),
    [points],
  );

  const deltaSign = deltaVsHoldout > 0 ? '+' : '';
  const isSignificant = pValue < 0.05;
  const StatusIcon = status === 'verified' ? ShieldCheck : FlaskConical;
  const statusLabel = status === 'verified' ? 'Verified vs holdout' : 'Projected';
  const statusClass = status === 'verified'
    ? 'bg-success/10 text-success border-success/20'
    : 'bg-warning/10 text-warning border-warning/20';

  if (compact) {
    return (
      <div className="card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-xs font-medium text-secondary">Health trajectory</span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${statusClass}`}>
            <StatusIcon size={10} />
            {statusLabel}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-mono text-2xl font-bold text-success">{deltaSign}{deltaVsHoldout} pts</span>
          <span className="text-2xs text-tertiary">vs holdout</span>
        </div>

        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--n-border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'rgb(var(--n-tertiary))' }} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: 'rgb(var(--n-tertiary))' }} domain={['dataMin - 1', 'dataMax + 1']} />
              <ReferenceLine x={`W${campaignStartWeek}`} stroke="rgb(var(--a-accent))" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="Treatment" stroke="rgb(var(--a-accent))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Holdout" stroke="rgb(var(--n-tertiary))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-t-2 border-t-accent">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
            <TrendingUp size={20} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.18em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Cohort trajectory · {leadSignal ?? 'Health Score'}
            </div>
            <h2 className="mt-1 text-xl font-semibold text-primary">Direction of travel</h2>
            <p className="mt-1 text-sm text-secondary">
              12-week health score trend for treatment group ({treatmentN.toLocaleString()} members) vs randomised holdout ({holdoutN.toLocaleString()} members).
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shrink-0 ${statusClass}`}>
          <StatusIcon size={13} />
          {statusLabel}
        </span>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
          <div className="text-2xs text-tertiary">Delta vs holdout</div>
          <div className="mt-1 font-mono text-2xl font-bold text-success">{deltaSign}{deltaVsHoldout} pts</div>
          <div className="mt-1 text-2xs text-tertiary">
            95% CI [{confidenceInterval[0]}, {confidenceInterval[1]}]
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
          <div className="text-2xs text-tertiary">Statistical significance</div>
          <div className={`mt-1 font-mono text-2xl font-bold ${isSignificant ? 'text-success' : 'text-warning'}`}>
            p = {pValue < 0.001 ? '<0.001' : pValue.toFixed(3)}
          </div>
          <div className="mt-1 text-2xs text-tertiary">
            {isSignificant ? 'Significant at 95%' : 'Not yet significant'}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
          <div className="text-2xs text-tertiary">Baseline health</div>
          <div className="mt-1 font-mono text-2xl font-bold text-primary">{baselineHealth}</div>
          <div className="mt-1 text-2xs text-tertiary">Pre-intervention avg</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
          <div className="text-2xs text-tertiary">Current treatment</div>
          <div className="mt-1 font-mono text-2xl font-bold text-accent">
            {trajectory.latestTreatmentHealth}
          </div>
          <div className="mt-1 text-2xs text-tertiary">Week {points.length - 1} avg</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="treatmentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--a-accent))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="rgb(var(--a-accent))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--n-border))" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: 'rgb(var(--n-tertiary))' }}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'rgb(var(--n-tertiary))' }}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <ReferenceLine
              x={`W${campaignStartWeek}`}
              stroke="rgb(var(--a-accent))"
              strokeDasharray="6 4"
              strokeOpacity={0.6}
              label={{
                value: 'Campaign start',
                position: 'top',
                fill: 'rgb(var(--a-accent))',
                fontSize: 10,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--n-surface))',
                borderColor: 'rgb(var(--n-border))',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 18px 36px rgba(15,23,42,0.08)',
              }}
              formatter={(value: number, name: string) => [
                value.toFixed(1),
                name,
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="Treatment"
              stroke="rgb(var(--a-accent))"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'rgb(var(--a-accent))', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--n-surface))' }}
            />
            <Line
              type="monotone"
              dataKey="Holdout"
              stroke="rgb(var(--n-tertiary))"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={{ r: 2.5, fill: 'rgb(var(--n-tertiary))', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-2xs text-tertiary">
        <span>
          Treatment n={treatmentN.toLocaleString()} · Holdout n={holdoutN.toLocaleString()} ({trajectory.holdoutPct}% reserved)
        </span>
        <span>
          {status === 'verified'
            ? 'Outcomes measured against randomised holdout group'
            : 'Projected from modelled improvement trajectory'}
        </span>
      </div>
    </div>
  );
}
