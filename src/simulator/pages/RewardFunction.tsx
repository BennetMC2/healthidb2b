import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { REWARD_PRESETS } from '../data/rewards';
import RewardCurveChart from '../components/RewardCurveChart';
import BehaviouralEconOverlay from '../components/BehaviouralEconOverlay';
import { REWARD_OUTCOME_LABELS, REWARD_TYPE_LABELS } from '../constants';
import { formatPercent } from '@/utils/format';
import type { RewardConfig, RewardOutcomeTarget, RewardType } from '../types';

export default function RewardFunction() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId, updateReward, updateRewardCeiling } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);
  const [advancedMode, setAdvancedMode] = useState(false);

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No scenario selected.</p>
        <button onClick={() => navigate('/simulator/overview')} className="btn-ghost text-sm mt-2">Go to Overview</button>
      </div>
    );
  }

  function handlePresetSelect(preset: RewardConfig) {
    updateReward(scenario!.id, preset);
  }

  function handleModifierToggle(id: string) {
    const current = scenario!.rewardConfig.behaviouralModifiers;
    const next = current.includes(id) ? current.filter((m) => m !== id) : [...current, id];
    updateReward(scenario!.id, { ...scenario!.rewardConfig, behaviouralModifiers: next });
  }

  const ceilingPct = scenario.rewardCeilingPct ?? 0.70;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAdvancedMode(false)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            !advancedMode ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary'
          }`}
        >
          Engagement Strategy
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

      {/* Engagement Strategy presets */}
      {!advancedMode && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REWARD_PRESETS.map((preset) => {
            const isSelected = scenario.rewardConfigId === preset.id;
            return (
              <div
                key={preset.id}
                className={`card cursor-pointer transition-all duration-150 hover:-translate-y-[1px] hover:shadow-lg ${
                  isSelected ? 'ring-1 ring-accent/40 bg-accent/5' : ''
                }`}
                onClick={() => handlePresetSelect(preset)}
              >
                <h3 className="text-sm font-semibold text-primary font-display">{preset.name}</h3>
                <p className="mt-1 text-xs text-tertiary">{preset.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-tertiary">Participation: </span>
                    <span className="text-primary font-mono">{formatPercent(preset.expectedParticipation)}</span>
                  </div>
                  <div>
                    <span className="text-tertiary">Completion: </span>
                    <span className="text-primary font-mono">{formatPercent(preset.expectedCompletion)}</span>
                  </div>
                  <div>
                    <span className="text-tertiary">Persistence: </span>
                    <span className="text-primary font-mono">{formatPercent(preset.expectedPersistence)}</span>
                  </div>
                  <div>
                    <span className="text-tertiary">Target: </span>
                    <span className="text-primary">{REWARD_OUTCOME_LABELS[preset.outcomeTarget]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advanced mode */}
      {advancedMode && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-primary font-display">Reward Parameters</h3>
            <div>
              <label className="text-2xs text-tertiary block mb-1">Primary Outcome Target</label>
              <select
                value={scenario.rewardConfig.outcomeTarget}
                onChange={(e) => updateReward(scenario.id, { ...scenario.rewardConfig, outcomeTarget: e.target.value as RewardOutcomeTarget })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
              >
                {Object.entries(REWARD_OUTCOME_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-2xs text-tertiary block mb-2">Reward Type Mix</label>
              <div className="grid gap-3 sm:grid-cols-4">
                {(Object.entries(scenario.rewardConfig.rewardTypeMix) as [RewardType, number][]).map(([type, weight]) => (
                  <div key={type}>
                    <div className="text-2xs text-tertiary mb-1">{REWARD_TYPE_LABELS[type]}: {Math.round(weight * 100)}%</div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(weight * 100)}
                      onChange={(e) => {
                        const newMix = { ...scenario.rewardConfig.rewardTypeMix, [type]: Number(e.target.value) / 100 };
                        updateReward(scenario.id, { ...scenario.rewardConfig, rewardTypeMix: newMix });
                      }}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <BehaviouralEconOverlay
              enabledIds={scenario.rewardConfig.behaviouralModifiers}
              onToggle={handleModifierToggle}
            />
          </div>
        </div>
      )}

      {/* Reward Budget Ceiling */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-primary font-display">Reward Budget Ceiling</h3>
        <p className="text-xs text-tertiary">
          Maximum percentage of projected behaviour change value allocated to incentive spend.
          The per-member budget is derived from this ceiling after simulation.
        </p>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs text-tertiary">Reward Ceiling</span>
            <span className="text-sm font-mono font-semibold text-accent">{Math.round(ceilingPct * 100)}%</span>
          </div>
          <input
            type="range"
            min={30}
            max={90}
            value={Math.round(ceilingPct * 100)}
            onChange={(e) => updateRewardCeiling(scenario.id, Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="flex justify-between text-2xs text-tertiary mt-1">
            <span>30% (conservative)</span>
            <span>90% (aggressive)</span>
          </div>
        </div>
      </div>

      {/* Reward curve chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Engagement Projection</h3>
        <RewardCurveChart config={scenario.rewardConfig} />
      </div>

      {/* Preview */}
      <div className="card grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xs text-tertiary">Expected Participation</div>
          <div className="text-xl font-semibold text-primary font-display">{formatPercent(scenario.rewardConfig.expectedParticipation)}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Expected Completion</div>
          <div className="text-xl font-semibold text-primary font-display">{formatPercent(scenario.rewardConfig.expectedCompletion)}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Expected Persistence</div>
          <div className="text-xl font-semibold text-primary font-display">{formatPercent(scenario.rewardConfig.expectedPersistence)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/run')} className="btn-primary text-sm">Next: Run Simulation →</button>
        <button onClick={() => navigate('/simulator/interventions')} className="btn-ghost text-sm">← Back</button>
      </div>
    </div>
  );
}
