import type { BridgeStep } from '../types';
import { formatCurrencyCompact } from '@/utils/format';

interface HealthToValueSankeyProps {
  steps: BridgeStep[];
}

const STAGE_COLORS = [
  '#22c55e', // signal movement
  '#3b82f6', // behaviour change
  '#8b5cf6', // risk factor
  '#f59e0b', // health outcome
  '#ef4444', // claims impact
  '#1D7A5E', // net value
];

export default function HealthToValueSankey({ steps }: HealthToValueSankeyProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const color = STAGE_COLORS[i] ?? '#6b7280';
        const confidenceWidth = Math.round(step.confidence * 100);
        const isLast = i === steps.length - 1;

        return (
          <div key={step.stage}>
            <div className="flex items-stretch gap-4">
              {/* Flow bar */}
              <div className="flex w-12 flex-col items-center">
                <div
                  className="w-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: color, opacity: 0.4 }}
                />
              </div>

              {/* Stage content */}
              <div className={`flex-1 rounded-xl border border-border/60 bg-surface/40 p-4 ${
                isLast ? 'ring-1 ring-accent/20' : ''
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <h4 className="text-sm font-semibold text-primary font-display">{step.label}</h4>
                    </div>
                    <p className="mt-1 text-xs text-tertiary">{step.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-primary font-mono">
                      {step.unit.includes('USD') ? formatCurrencyCompact(step.value) : step.value.toLocaleString()}
                    </div>
                    <div className="text-2xs text-tertiary">{step.unit.replace('USD ', '')}</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${confidenceWidth}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-2xs text-tertiary font-mono">{confidenceWidth}% conf.</span>
                </div>

                {step.evidenceIds.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {step.evidenceIds.map((id) => (
                      <span key={id} className="text-[9px] text-tertiary bg-surface border border-border rounded px-1 py-0.5">
                        {id.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow connector */}
            {!isLast && (
              <div className="flex w-12 items-center justify-center py-0.5">
                <div className="h-3 w-0.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[i + 1] ?? '#6b7280', opacity: 0.3 }} />
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
        <p className="text-2xs text-amber-400 italic">
          Directional — requires carrier data validation. Confidence decreases at each stage as the model moves from measured signals to projected financial outcomes.
        </p>
      </div>
    </div>
  );
}
