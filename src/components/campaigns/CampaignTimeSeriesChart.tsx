import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { campaignTimeSeries } from '@/data';
import { formatNumber, formatPercent } from '@/utils/format';

interface CampaignTimeSeriesChartProps {
  campaignId: string;
}

export default function CampaignTimeSeriesChart({ campaignId }: CampaignTimeSeriesChartProps) {
  const data = useMemo(
    () => campaignTimeSeries.filter((s) => s.campaignId === campaignId),
    [campaignId],
  );

  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const prior = data[Math.max(0, data.length - 8)];
  const enrolledDelta = latest.enrolled - prior.enrolled;
  const verifiedDelta = latest.verified - prior.verified;
  const verificationRate = latest.verified / Math.max(latest.enrolled, 1);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-medium text-secondary">Programme momentum</span>
          <p className="text-2xs text-tertiary mt-1">
            Enrollment and verified outcome trend across the current campaign window.
          </p>
        </div>
        <span className="text-2xs text-tertiary font-mono">{data.length} day series</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-border bg-hover/60 px-3 py-2">
          <div className="text-2xs text-tertiary">Latest enrolled</div>
          <div className="mt-1 text-sm font-mono font-semibold text-primary">{formatNumber(latest.enrolled)}</div>
          <div className="text-2xs text-success mt-1">+{formatNumber(enrolledDelta)} this week</div>
        </div>
        <div className="rounded-xl border border-border bg-hover/60 px-3 py-2">
          <div className="text-2xs text-tertiary">Latest verified</div>
          <div className="mt-1 text-sm font-mono font-semibold text-primary">{formatNumber(latest.verified)}</div>
          <div className="text-2xs text-success mt-1">+{formatNumber(verifiedDelta)} this week</div>
        </div>
        <div className="rounded-xl border border-border bg-hover/60 px-3 py-2">
          <div className="text-2xs text-tertiary">Current verification rate</div>
          <div className="mt-1 text-sm font-mono font-semibold text-primary">{formatPercent(verificationRate)}</div>
          <div className="text-2xs text-tertiary mt-1">receipt / enrolled ratio</div>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--a-accent))" stopOpacity={0.36} />
                <stop offset="100%" stopColor="rgb(var(--a-accent))" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="verifyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--a-accent-secondary))" stopOpacity={0.34} />
                <stop offset="100%" stopColor="rgb(var(--a-accent-secondary))" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--n-border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'rgb(var(--n-tertiary))' }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis tick={{ fontSize: 10, fill: 'rgb(var(--n-tertiary))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--n-surface))',
                borderColor: 'rgb(var(--n-border))',
                borderRadius: 12,
                fontSize: 11,
                boxShadow: '0 18px 36px rgba(15,23,42,0.08)',
              }}
              labelFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'enrolled' ? 'Enrolled' : 'Verified',
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) => (value === 'enrolled' ? 'Enrolled' : 'Verified')}
            />
            <Area
              type="monotone"
              dataKey="enrolled"
              stroke="rgb(var(--a-accent))"
              strokeWidth={2}
              fill="url(#enrollGrad)"
            />
            <Area
              type="monotone"
              dataKey="verified"
              stroke="rgb(var(--a-accent-secondary))"
              strokeWidth={2}
              fill="url(#verifyGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
