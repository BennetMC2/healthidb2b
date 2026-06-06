import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useSimulationResultStore } from '../store/useSimulationResultStore';
import ScenarioComparePanel from '../components/ScenarioComparePanel';
import LeverBreakdownTable from '../components/LeverBreakdownTable';
import { formatCurrencyCompact } from '@/utils/format';

export default function ScenarioComparison() {
  const navigate = useNavigate();
  const { scenarios } = useSimulatorStore();
  const { results } = useSimulationResultStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [horizon, setHorizon] = useState<'90d' | '1y' | '3y'>('1y');

  const completedScenarios = scenarios.filter((s) => results[s.id]);

  function toggleScenario(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  }

  const selectedScenarios = selectedIds
    .map((id) => {
      const s = scenarios.find((sc) => sc.id === id);
      const output = results[id];
      return s && output ? { name: s.name, output, scenario: s } : null;
    })
    .filter(Boolean) as { name: string; output: NonNullable<typeof results[string]>; scenario: typeof scenarios[0] }[];

  // Recommendation
  const best = selectedScenarios.length >= 2
    ? selectedScenarios.reduce((a, b) => a.output.horizons[horizon].netROI > b.output.horizons[horizon].netROI ? a : b)
    : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Scenario selector */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Select 2-3 Scenarios to Compare</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {completedScenarios.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            const h = results[s.id].horizons[horizon];
            return (
              <button
                key={s.id}
                onClick={() => toggleScenario(s.id)}
                disabled={!isSelected && selectedIds.length >= 3}
                className={`rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                  isSelected ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface hover:bg-hover'
                }`}
              >
                <div className="text-sm font-medium text-primary">{s.name}</div>
                <div className="text-2xs text-tertiary mt-0.5">
                  ROI: {formatCurrencyCompact(h.netROI)} · {h.morbidityShiftBps} bps
                </div>
              </button>
            );
          })}
        </div>
        {completedScenarios.length === 0 && (
          <p className="text-sm text-tertiary py-3">Run at least 2 scenarios to use comparison.</p>
        )}
      </div>

      {/* Horizon selector */}
      <div className="flex items-center gap-2">
        {(['90d', '1y', '3y'] as const).map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              horizon === h ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary'
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Comparison panel */}
      {selectedScenarios.length >= 2 && (
        <>
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-3">Side-by-Side Metrics</h3>
            <ScenarioComparePanel scenarios={selectedScenarios} horizon={horizon} />
          </div>

          {/* Per-lever comparison */}
          {selectedScenarios.map((s) => (
            <div key={s.name} className="card">
              <h3 className="text-sm font-semibold text-primary font-display mb-3">Lever Breakdown: {s.name}</h3>
              <LeverBreakdownTable breakdowns={s.output.leverBreakdowns} />
            </div>
          ))}

          {/* Recommendation */}
          {best && (
            <div className="card-elevated border-green-500/20">
              <h3 className="text-sm font-semibold text-green-500 font-display mb-1">Recommendation</h3>
              <p className="text-sm text-secondary">
                <span className="font-semibold text-primary">{best.name}</span> shows the strongest projected net ROI
                at {formatCurrencyCompact(best.output.horizons[horizon].netROI)} over the {horizon} horizon,
                with {best.output.horizons[horizon].morbidityShiftBps} bps morbidity shift
                and {best.output.confidenceLabel}.
              </p>
            </div>
          )}
        </>
      )}

      {selectedScenarios.length < 2 && completedScenarios.length >= 2 && (
        <div className="text-center py-10 text-sm text-tertiary">Select at least 2 scenarios to compare.</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/output')} className="btn-ghost text-sm">← Back to Output</button>
      </div>
    </div>
  );
}
