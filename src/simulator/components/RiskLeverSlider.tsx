import type { BehaviourLeverId } from '../types';
import { BEHAVIOUR_LEVER_LABELS, LEVER_COLORS } from '../constants';

interface RiskLeverSliderProps {
  lever: BehaviourLeverId;
  baseline: number;
  target: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export default function RiskLeverSlider({ lever, baseline, target, onChange, readOnly }: RiskLeverSliderProps) {
  const color = LEVER_COLORS[lever];
  const improvement = target - baseline;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary">{BEHAVIOUR_LEVER_LABELS[lever]}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-tertiary">{Math.round(baseline * 100)}%</span>
          <span className="text-accent">→</span>
          <span className="font-semibold" style={{ color }}>{Math.round(target * 100)}%</span>
          {improvement > 0 && (
            <span className="text-2xs text-green-500">+{Math.round(improvement * 100)}pp</span>
          )}
        </div>
      </div>
      <div className="relative">
        <div className="h-2 rounded-full bg-border overflow-hidden">
          {/* Baseline */}
          <div
            className="absolute h-2 rounded-full bg-secondary/30"
            style={{ width: `${baseline * 100}%` }}
          />
          {/* Target */}
          <div
            className="absolute h-2 rounded-full"
            style={{ width: `${target * 100}%`, backgroundColor: color, opacity: 0.6 }}
          />
        </div>
        {!readOnly && (
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(target * 100)}
            onChange={(e) => onChange(Number(e.target.value) / 100)}
            className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
          />
        )}
      </div>
    </div>
  );
}
