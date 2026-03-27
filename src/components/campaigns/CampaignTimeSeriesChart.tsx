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

interface CampaignTimeSeriesChartProps {
  campaignId: string;
}

export default function CampaignTimeSeriesChart({ campaignId }: CampaignTimeSeriesChartProps) {
  const data = useMemo(
    () => campaignTimeSeries.filter((s) => s.campaignId === campaignId),
    [campaignId],
  );

  if (data.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-secondary">Enrollment & Verification Trend</span>
        <span className="text-2xs text-tertiary font-mono">{data.length} days</span>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--a-accent))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(var(--a-accent))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="verifyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--a-success))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(var(--a-success))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--n-border))" />
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
                borderRadius: 6,
                fontSize: 11,
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
              strokeWidth={1.5}
              fill="url(#enrollGrad)"
            />
            <Area
              type="monotone"
              dataKey="verified"
              stroke="rgb(var(--a-success))"
              strokeWidth={1.5}
              fill="url(#verifyGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
