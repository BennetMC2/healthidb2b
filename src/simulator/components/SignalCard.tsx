import type { SignalDefinition } from '../types';
import { SOURCE_CONFIDENCE_BANDS } from '../data/sourceConfidence';
import { DATA_SOURCE_LABELS } from '@/utils/constants';

interface SignalCardProps {
  signal: SignalDefinition;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const sourceTypeColor = signal.sourceType === 'clinical' ? 'text-green-500 bg-green-500/10 border-green-500/20'
    : signal.sourceType === 'wearable' ? 'text-accent bg-accent/10 border-accent/20'
    : 'text-amber-500 bg-amber-500/10 border-amber-500/20';

  const bestSource = signal.sources
    .map((s) => SOURCE_CONFIDENCE_BANDS.find((b) => b.source === s))
    .filter(Boolean)
    .sort((a, b) => b!.baseConfidence - a!.baseConfidence)[0];

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-primary font-display">{signal.label}</h3>
          <span className={`mt-1 inline-flex items-center rounded-sm border px-1.5 py-0.5 text-2xs font-medium ${sourceTypeColor}`}>
            {signal.sourceType.replace('_', '-')}
          </span>
        </div>
        <span className="text-xs text-tertiary font-mono">{signal.unit}</span>
      </div>

      <p className="text-xs text-secondary leading-relaxed">{signal.description}</p>

      {bestSource && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-tertiary">Confidence Band</span>
            <span className="text-secondary font-mono">
              {Math.round(bestSource.minConfidence * 100)}-{Math.round(bestSource.maxConfidence * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${bestSource.baseConfidence * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {signal.sources.map((source) => (
          <span key={source} className="text-2xs text-tertiary bg-surface border border-border rounded px-1 py-0.5">
            {DATA_SOURCE_LABELS[source]}
          </span>
        ))}
      </div>

      <div className="text-2xs text-tertiary italic border-t border-border pt-2">
        {signal.caveat}
      </div>
    </div>
  );
}
