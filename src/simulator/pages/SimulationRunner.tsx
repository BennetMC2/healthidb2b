import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw } from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useSimulationResultStore } from '../store/useSimulationResultStore';
import type { RunStep } from '../store/useSimulationResultStore';
import SimulationProgressSteps from '../components/SimulationProgressSteps';
import AdvancedToggle from '../components/AdvancedToggle';
import { INTERVENTION_LABELS } from '../constants';
import { COHORT_PRESETS } from '../data/cohortPresets';
import { runSimulation } from '../engine/simulate';
import { formatPercent } from '@/utils/format';

const RUN_STEPS: RunStep[] = ['signals', 'confidence', 'cohort', 'rules', 'rewards', 'roi', 'audit'];

export default function SimulationRunner() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId, updateScenario, updateAssumptions } = useSimulatorStore();
  const { runState, currentStep, stepProgress, startRun, advanceStep, completeRun, failRun, resetRun } = useSimulationResultStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);

  const handleRun = useCallback(async () => {
    if (!scenario) return;
    startRun();

    try {
      // Animate through steps
      for (let i = 0; i < RUN_STEPS.length; i++) {
        advanceStep(RUN_STEPS[i]);
        await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
      }

      // Run actual simulation
      const result = runSimulation(scenario);

      // Complete
      completeRun(scenario.id, result);
      updateScenario(scenario.id, { status: 'completed', result });
    } catch (err) {
      failRun(err instanceof Error ? err.message : 'Simulation failed');
    }
  }, [scenario, startRun, advanceStep, completeRun, failRun, updateScenario]);

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No scenario selected.</p>
        <button onClick={() => navigate('/simulator/overview')} className="btn-ghost text-sm mt-2">Go to Overview</button>
      </div>
    );
  }

  const preset = COHORT_PRESETS.find((p) => p.id === scenario.cohortPresetId);
  const isRunning = runState === 'running';
  const isComplete = runState === 'complete';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Scenario summary */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-primary font-display">Scenario Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-tertiary">Scenario: </span>
            <span className="text-primary font-medium">{scenario.name}</span>
          </div>
          <div>
            <span className="text-tertiary">Cohort: </span>
            <span className="text-primary">{preset?.name ?? 'Custom'}</span>
          </div>
          <div>
            <span className="text-tertiary">Interventions: </span>
            <span className="text-primary">{scenario.interventions.map((i) => INTERVENTION_LABELS[i]).join(', ') || 'None'}</span>
          </div>
          <div>
            <span className="text-tertiary">Reward Ceiling: </span>
            <span className="text-primary">{Math.round((scenario.rewardCeilingPct ?? 0.70) * 100)}%</span>
            <span className="text-tertiary ml-1 text-xs">({scenario.rewardConfig.name})</span>
          </div>
          <div>
            <span className="text-tertiary">Time Horizons: </span>
            <span className="text-primary">{scenario.timeHorizons.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-primary font-display">Assumptions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { key: 'discountRate' as const, label: 'Discount Rate' },
            { key: 'dropoutRate' as const, label: 'Dropout Rate' },
            { key: 'verificationRate' as const, label: 'Verification Rate' },
            { key: 'claimsInflation' as const, label: 'Claims Inflation' },
            { key: 'realizationFactor' as const, label: 'Realization Factor' },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="text-2xs text-tertiary mb-1">{label}</div>
              <div className="text-sm font-semibold text-primary font-mono">
                {formatPercent(scenario.assumptions[key])}
              </div>
            </div>
          ))}
        </div>

        <AdvancedToggle label="Override Assumptions">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { key: 'discountRate' as const, label: 'Discount Rate', min: 0, max: 20 },
              { key: 'dropoutRate' as const, label: 'Dropout Rate', min: 0, max: 50 },
              { key: 'verificationRate' as const, label: 'Verification Rate', min: 5, max: 60 },
              { key: 'claimsInflation' as const, label: 'Claims Inflation', min: 0, max: 10 },
              { key: 'realizationFactor' as const, label: 'Realization Factor', min: 20, max: 100 },
            ].map(({ key, label, min, max }) => (
              <div key={key}>
                <label className="text-2xs text-tertiary block mb-1">{label}: {formatPercent(scenario.assumptions[key])}</label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={Math.round(scenario.assumptions[key] * 100)}
                  onChange={(e) => updateAssumptions(scenario.id, { [key]: Number(e.target.value) / 100 })}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </AdvancedToggle>
      </div>

      {/* Progress */}
      <div className="card">
        <SimulationProgressSteps
          currentStep={currentStep}
          stepProgress={stepProgress}
          isRunning={isRunning}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isComplete && (
          <button
            onClick={handleRun}
            disabled={isRunning || scenario.interventions.length === 0}
            className="btn-primary text-sm gap-1.5 disabled:opacity-50"
          >
            <Play size={14} />
            {isRunning ? 'Running...' : 'Run Simulation'}
          </button>
        )}
        {isComplete && (
          <>
            <button onClick={() => navigate('/simulator/output')} className="btn-primary text-sm">
              View Results →
            </button>
            <button onClick={resetRun} className="btn-ghost text-sm gap-1.5">
              <RotateCcw size={14} /> Re-run
            </button>
          </>
        )}
        {!isRunning && (
          <button onClick={() => navigate('/simulator/rewards')} className="btn-ghost text-sm">← Back</button>
        )}
      </div>

      {scenario.interventions.length === 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-400">Select at least one intervention before running the simulation.</p>
        </div>
      )}
    </div>
  );
}
