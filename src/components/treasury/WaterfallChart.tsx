import { formatCurrency } from '@/utils/format';

interface WaterfallChartProps {
  budget: number;
  yield_: number;
  buyingPower: number;
}

export default function WaterfallChart({ budget, yield_, buyingPower }: WaterfallChartProps) {
  const total = budget + yield_ + buyingPower;
  const maxVal = total;

  const steps = [
    { label: 'Base Budget', value: budget, cumulative: budget, isTotal: false },
    { label: 'Yield Earned', value: yield_, cumulative: budget + yield_, isTotal: false },
    { label: 'Buying Power', value: buyingPower, cumulative: total, isTotal: false },
    { label: 'Total Value', value: total, cumulative: total, isTotal: true },
  ];

  return (
    <div className="flex flex-col gap-2 h-[180px] justify-end">
      {steps.map((step, i) => {
        const barWidth = (step.value / maxVal) * 100;
        const offset = step.isTotal ? 0 : ((step.cumulative - step.value) / maxVal) * 100;

        return (
          <div key={step.label} className="flex items-center gap-2">
            <span className="text-2xs text-tertiary w-[80px] text-right truncate">
              {step.label}
            </span>
            <div className="flex-1 h-[28px] relative bg-base rounded-sm">
              <div
                className={`absolute h-full rounded-sm transition-all duration-500 ${
                  step.isTotal ? 'bg-accent/30' : i === 0 ? 'bg-accent/20' : 'bg-accent/40'
                }`}
                style={{
                  left: `${offset}%`,
                  width: `${barWidth}%`,
                }}
              />
              {/* Connector line */}
              {i < steps.length - 1 && !step.isTotal && (
                <div
                  className="absolute top-full w-px h-2 bg-border"
                  style={{ left: `${(step.cumulative / maxVal) * 100}%` }}
                />
              )}
            </div>
            <span className="text-2xs font-mono text-secondary w-[70px] text-right">
              {step.isTotal ? '' : '+'}{formatCurrency(step.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
