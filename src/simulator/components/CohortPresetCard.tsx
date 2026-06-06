import { Users } from 'lucide-react';
import type { CohortPreset } from '../types';
import { MARKET_LABELS, DEVICE_CLASS_LABELS, BASELINE_RISK_LABELS } from '../constants';
import { formatNumber } from '@/utils/format';

interface CohortPresetCardProps {
  preset: CohortPreset;
  selected?: boolean;
  onSelect: (id: string) => void;
}

export default function CohortPresetCard({ preset, selected, onSelect }: CohortPresetCardProps) {
  return (
    <div
      className={`card cursor-pointer transition-all duration-150 hover:-translate-y-[1px] hover:shadow-lg ${
        selected ? 'ring-1 ring-accent/40 bg-accent/5' : ''
      }`}
      onClick={() => onSelect(preset.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
          <Users size={16} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary font-display">{preset.name}</h3>
          <p className="mt-1 text-xs text-tertiary line-clamp-2">{preset.description}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <div className="text-2xs text-tertiary">Est. Size</div>
          <div className="text-sm font-semibold text-primary">{formatNumber(preset.estimatedSize)}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Market</div>
          <div className="text-sm text-secondary">{MARKET_LABELS[preset.definition.market]}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Risk</div>
          <div className="text-sm text-secondary">{BASELINE_RISK_LABELS[preset.definition.baselineRisk]}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Device</div>
          <div className="text-sm text-secondary">{DEVICE_CLASS_LABELS[preset.definition.deviceClass]}</div>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-2">
        <div className="text-2xs text-tertiary mb-1">Baseline Behaviour</div>
        <div className="flex gap-1">
          {Object.entries(preset.baselineBehaviour).slice(0, 4).map(([lever, value]) => (
            <div key={lever} className="flex-1">
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/60"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <div className="text-[9px] text-tertiary mt-0.5 capitalize">{lever.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
