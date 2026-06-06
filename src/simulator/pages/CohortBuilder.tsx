import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { COHORT_PRESETS } from '../data/cohortPresets';
import CohortPresetCard from '../components/CohortPresetCard';
import CohortDimensionFilter from '../components/CohortDimensionFilter';
import BehaviourLeverPanel from '../components/BehaviourLeverPanel';
import { filterCohort } from '../engine/cohortEngine';
import { formatNumber } from '@/utils/format';

export default function CohortBuilder() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId, updateScenario, updateCohort, updateLeverTargets } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);
  const [advancedMode, setAdvancedMode] = useState(false);

  const cohortResult = useMemo(() => {
    if (!scenario) return null;
    return filterCohort(scenario.cohortDefinition);
  }, [scenario?.cohortDefinition]);

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No scenario selected.</p>
        <button onClick={() => navigate('/simulator/overview')} className="btn-ghost text-sm mt-2">Go to Overview</button>
      </div>
    );
  }

  function handlePresetSelect(presetId: string) {
    const preset = COHORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateScenario(scenario!.id, {
      cohortPresetId: presetId,
      cohortDefinition: preset.definition,
      leverBaselines: { ...preset.baselineBehaviour },
      leverTargets: {
        activity: Math.min(1, preset.baselineBehaviour.activity + 0.18),
        sleep: Math.min(1, preset.baselineBehaviour.sleep + 0.12),
        cardiovascular: Math.min(1, preset.baselineBehaviour.cardiovascular + 0.15),
        body_composition: Math.min(1, preset.baselineBehaviour.body_composition + 0.08),
        stress: Math.min(1, preset.baselineBehaviour.stress + 0.10),
        smoking: Math.min(1, preset.baselineBehaviour.smoking + 0.05),
      },
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Live counter */}
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-2xs text-tertiary">Live Cohort Size</div>
          <div className="text-2xl font-semibold text-primary font-display">
            {cohortResult ? formatNumber(cohortResult.size) : '—'}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-tertiary">Avg Health Score: </span>
            <span className="text-primary font-mono">{cohortResult?.avgHealthScore ?? '—'}</span>
          </div>
          <div>
            <span className="text-tertiary">Avg Confidence: </span>
            <span className="text-primary font-mono">{cohortResult?.avgConfidence ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAdvancedMode(false)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            !advancedMode ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setAdvancedMode(true)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            advancedMode ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary'
          }`}
        >
          Advanced
        </button>
      </div>

      {/* Preset mode */}
      {!advancedMode && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COHORT_PRESETS.map((preset) => (
            <CohortPresetCard
              key={preset.id}
              preset={preset}
              selected={scenario.cohortPresetId === preset.id}
              onSelect={handlePresetSelect}
            />
          ))}
        </div>
      )}

      {/* Advanced mode */}
      {advancedMode && (
        <div className="card">
          <h3 className="text-sm font-semibold text-primary font-display mb-4">Dimension Filters</h3>
          <CohortDimensionFilter
            definition={scenario.cohortDefinition}
            onChange={(def) => updateCohort(scenario.id, def)}
          />
        </div>
      )}

      {/* Behaviour Lever Targets */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-4">Behaviour Lever Targets</h3>
        <BehaviourLeverPanel
          baselines={scenario.leverBaselines}
          targets={scenario.leverTargets}
          onChange={(lever, value) => updateLeverTargets(scenario.id, { [lever]: value })}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/signals')} className="btn-primary text-sm">
          Next: Signal Confidence →
        </button>
        <button onClick={() => navigate('/simulator/scenario')} className="btn-ghost text-sm">
          ← Back
        </button>
      </div>
    </div>
  );
}
