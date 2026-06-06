import type { SensitivityVariable } from '../types';

interface TornadoChartProps {
  variables: SensitivityVariable[];
  className?: string;
}

export default function TornadoChart({ variables, className = '' }: TornadoChartProps) {
  // Find max absolute impact for scaling
  const maxImpact = variables.reduce((max, v) => {
    return Math.max(max, Math.abs(v.impactOnROI.low), Math.abs(v.impactOnROI.high));
  }, 0);

  const scale = maxImpact > 0 ? 100 / maxImpact : 1;

  return (
    <div className={`space-y-2 ${className}`}>
      {variables.map((variable) => {
        const lowPct = variable.impactOnROI.low * scale;
        const highPct = variable.impactOnROI.high * scale;
        return (
          <div key={variable.id} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-40 shrink-0 text-right text-xs text-secondary">
              {variable.label}
            </div>

            {/* Bar container */}
            <div className="relative flex-1 h-7">
              {/* Center line (baseline) */}
              <div className="absolute left-1/2 top-0 h-full w-px bg-border" />

              {/* Downside bar (red) */}
              {lowPct < 0 && (
                <div
                  className="absolute top-0.5 h-6 rounded-l bg-red-400/60"
                  style={{
                    right: '50%',
                    width: `${Math.abs(lowPct) / 2}%`,
                  }}
                />
              )}

              {/* Upside bar (green) */}
              {highPct > 0 && (
                <div
                  className="absolute top-0.5 h-6 rounded-r bg-green-400/60"
                  style={{
                    left: '50%',
                    width: `${Math.abs(highPct) / 2}%`,
                  }}
                />
              )}
            </div>

            {/* Impact values */}
            <div className="w-28 shrink-0 flex items-center gap-1 text-2xs">
              <span className="text-red-500 font-mono">
                {formatImpact(variable.impactOnROI.low)}
              </span>
              <span className="text-tertiary">/</span>
              <span className="text-green-500 font-mono">
                +{formatImpact(variable.impactOnROI.high)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatImpact(value: number): string {
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
