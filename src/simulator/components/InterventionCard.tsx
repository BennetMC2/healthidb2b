import { Crosshair, Check } from 'lucide-react';
import type { InterventionConfig } from '../types';
import { BEHAVIOUR_LEVER_LABELS } from '../constants';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import { EVIDENCE_LIBRARY } from '../data/evidence';

interface InterventionCardProps {
  intervention: InterventionConfig;
  selected?: boolean;
  onToggle?: (id: string) => void;
}

export default function InterventionCard({ intervention, selected, onToggle }: InterventionCardProps) {
  const linkedEvidence = intervention.linkedEvidenceIds
    .map((id) => EVIDENCE_LIBRARY.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <div
      className={`card cursor-pointer transition-all duration-150 hover:-translate-y-[1px] hover:shadow-lg ${
        selected ? 'ring-1 ring-accent/40 bg-accent/5' : ''
      }`}
      onClick={() => onToggle?.(intervention.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
          }`}>
            {selected ? <Check size={16} /> : <Crosshair size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary font-display">{intervention.name}</h3>
            <p className="mt-1 text-xs text-tertiary">{intervention.targetBehaviour}</p>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-secondary leading-relaxed">{intervention.description}</p>

      <div className="mt-3 space-y-2">
        <div>
          <div className="text-2xs text-tertiary mb-1">Primary Signals</div>
          <div className="flex flex-wrap gap-1">
            {intervention.primarySignals.map((s) => (
              <span key={s} className="inline-flex items-center rounded-sm border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-2xs text-accent">
                {HEALTH_METRIC_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-2xs text-tertiary mb-1">Behaviour Levers</div>
          <div className="flex flex-wrap gap-1">
            {intervention.levers.map((l) => (
              <span key={l} className="inline-flex items-center rounded-sm border border-border bg-surface px-1.5 py-0.5 text-2xs text-secondary">
                {BEHAVIOUR_LEVER_LABELS[l]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-2xs text-tertiary mb-1">Expected Change</div>
          <div className="text-xs text-secondary font-mono">
            {Math.round(intervention.expectedChangeRange[0] * 100)}-{Math.round(intervention.expectedChangeRange[1] * 100)}%
          </div>
        </div>
      </div>

      {linkedEvidence.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <div className="text-2xs text-tertiary mb-1">Linked Evidence ({linkedEvidence.length})</div>
          <div className="space-y-0.5">
            {linkedEvidence.slice(0, 3).map((e) => (
              <div key={e!.id} className="text-2xs text-secondary truncate">
                {e!.authors.split(',')[0]} et al. ({e!.year})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
