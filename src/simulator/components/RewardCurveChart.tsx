import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RewardConfig } from '../types';
import { REWARD_TYPE_LABELS } from '../constants';

interface RewardCurveChartProps {
  config: RewardConfig;
}

export default function RewardCurveChart({ config }: RewardCurveChartProps) {
  // Generate engagement curve data
  const data = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const dropoff = Math.pow(0.92, month);
    return {
      month,
      participation: Math.round(config.expectedParticipation * dropoff * 100),
      completion: Math.round(config.expectedCompletion * dropoff * 100),
      persistence: Math.round(config.expectedPersistence * dropoff * 100),
      cost: Math.round(config.budgetPerMember * config.expectedCompletion * dropoff),
    };
  });

  return (
    <div className="space-y-3">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--color-tertiary)" label={{ value: 'Month', position: 'bottom', fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--color-tertiary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Area type="monotone" dataKey="participation" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Participation %" />
            <Area type="monotone" dataKey="completion" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Completion %" />
            <Area type="monotone" dataKey="persistence" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="Persistence %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(config.rewardTypeMix) as [string, number][]).map(([type, weight]) => (
          <div key={type} className="text-center">
            <div className="text-2xs text-tertiary">{REWARD_TYPE_LABELS[type as keyof typeof REWARD_TYPE_LABELS]}</div>
            <div className="text-sm font-semibold text-primary">{Math.round(weight * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
