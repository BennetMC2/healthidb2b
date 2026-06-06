import { Play, Copy, Trash2 } from 'lucide-react';
import type { Scenario } from '../types';
import { SCENARIO_STATUS_LABELS, MARKET_LABELS, INTERVENTION_LABELS } from '../constants';
import { formatCurrencyCompact } from '@/utils/format';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  isActive?: boolean;
}

export default function ScenarioCard({ scenario, onSelect, onDuplicate, onDelete, isActive }: ScenarioCardProps) {
  const statusColor = scenario.status === 'completed' ? 'text-green-500' : scenario.status === 'configured' ? 'text-accent' : 'text-tertiary';

  return (
    <div
      className={`card cursor-pointer transition-all duration-150 hover:-translate-y-[1px] hover:shadow-lg ${
        isActive ? 'ring-1 ring-accent/40' : ''
      }`}
      onClick={() => onSelect(scenario.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-primary font-display truncate">{scenario.name}</h3>
            <span className={`text-2xs font-medium ${statusColor}`}>
              {SCENARIO_STATUS_LABELS[scenario.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-tertiary line-clamp-2">{scenario.description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-sm border border-border bg-surface px-1.5 py-0.5 text-2xs text-secondary">
          {MARKET_LABELS[scenario.market]}
        </span>
        {scenario.interventions.map((id) => (
          <span key={id} className="inline-flex items-center rounded-sm border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-2xs text-accent">
            {INTERVENTION_LABELS[id]}
          </span>
        ))}
      </div>

      {scenario.result && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <div className="text-2xs text-tertiary">Net ROI (1y)</div>
            <div className="text-sm font-semibold text-primary font-display">
              {formatCurrencyCompact(scenario.result.horizons['1y'].netROI)}
            </div>
          </div>
          <div>
            <div className="text-2xs text-tertiary">Morbidity</div>
            <div className="text-sm font-semibold text-primary font-display">
              {scenario.result.horizons['1y'].morbidityShiftBps} bps
            </div>
          </div>
          <div>
            <div className="text-2xs text-tertiary">Confidence</div>
            <div className="text-sm font-semibold text-primary font-display">
              {scenario.result.confidenceLabel}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(scenario.id); }}
          className="btn-ghost text-2xs gap-1"
        >
          <Play size={11} /> Run
        </button>
        {onDuplicate && (
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(scenario.id); }}
            className="btn-ghost text-2xs gap-1"
          >
            <Copy size={11} /> Copy
          </button>
        )}
        {onDelete && !scenario.id.startsWith('demo_') && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }}
            className="btn-ghost text-2xs gap-1 text-red-400 hover:text-red-300"
          >
            <Trash2 size={11} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
