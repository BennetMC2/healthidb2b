import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { MARKET_LABELS, PRODUCT_TYPE_LABELS, SCENARIO_STATUS_LABELS, TIME_HORIZON_LABELS } from '../constants';
import { COHORT_PRESETS } from '../data/cohortPresets';
import { INTERVENTIONS } from '../data/interventions';
import type { Market, ProductType, InterventionId, TimeHorizon } from '../types';

export default function ScenarioBuilder() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId, updateScenario, updateMarket, updateProductType, updateInterventions, updateTimeHorizons, updateRewardCeiling } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No scenario selected.</p>
        <button onClick={() => navigate('/simulator/overview')} className="btn-ghost text-sm mt-2">
          Go to Overview
        </button>
      </div>
    );
  }

  const statusColor = scenario.status === 'completed' ? 'text-green-500' : scenario.status === 'configured' ? 'text-accent' : 'text-tertiary';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Name & Description */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary font-display">Scenario Details</h3>
          <span className={`text-2xs font-medium ${statusColor}`}>{SCENARIO_STATUS_LABELS[scenario.status]}</span>
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1">Name</label>
          <input
            type="text"
            value={scenario.name}
            onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
          />
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1">Description</label>
          <textarea
            value={scenario.description}
            onChange={(e) => updateScenario(scenario.id, { description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary resize-none"
          />
        </div>
      </div>

      {/* Market & Product */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-primary font-display">Market & Product</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-2xs text-tertiary block mb-1">Market</label>
            <select
              value={scenario.market}
              onChange={(e) => updateMarket(scenario.id, e.target.value as Market)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
            >
              {Object.entries(MARKET_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-2xs text-tertiary block mb-1">Product Type</label>
            <select
              value={scenario.productType}
              onChange={(e) => updateProductType(scenario.id, e.target.value as ProductType)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
            >
              {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cohort */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary font-display">Cohort</h3>
          <button onClick={() => navigate('/simulator/cohort')} className="btn-ghost text-2xs">Configure →</button>
        </div>
        {scenario.cohortPresetId ? (
          <div className="text-sm text-secondary">
            Preset: {COHORT_PRESETS.find((p) => p.id === scenario.cohortPresetId)?.name ?? 'Custom'}
          </div>
        ) : (
          <div className="text-sm text-tertiary">Custom cohort definition</div>
        )}
      </div>

      {/* Interventions */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary font-display">Interventions</h3>
          <button onClick={() => navigate('/simulator/interventions')} className="btn-ghost text-2xs">Configure →</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {INTERVENTIONS.map((intervention) => {
            const isSelected = scenario.interventions.includes(intervention.id);
            return (
              <button
                key={intervention.id}
                onClick={() => {
                  const next = isSelected
                    ? scenario.interventions.filter((i) => i !== intervention.id)
                    : [...scenario.interventions, intervention.id];
                  updateInterventions(scenario.id, next as InterventionId[]);
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary hover:bg-hover'
                }`}
              >
                {intervention.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reward Ceiling */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-primary font-display">Reward Budget Ceiling</h3>
        <p className="text-2xs text-tertiary">Maximum % of projected behaviour change value allocated to incentive spend.</p>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs text-tertiary">Ceiling</span>
            <span className="text-sm font-mono font-semibold text-accent">{Math.round((scenario.rewardCeilingPct ?? 0.70) * 100)}%</span>
          </div>
          <input
            type="range"
            min={30}
            max={90}
            value={Math.round((scenario.rewardCeilingPct ?? 0.70) * 100)}
            onChange={(e) => updateRewardCeiling(scenario.id, Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="flex justify-between text-2xs text-tertiary mt-1">
            <span>30%</span>
            <span>90%</span>
          </div>
        </div>
      </div>

      {/* Time Horizons */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-primary font-display">Time Horizons</h3>
        <div className="flex gap-2">
          {(['90d', '1y', '3y', '5y'] as TimeHorizon[]).map((h) => {
            const isSelected = scenario.timeHorizons.includes(h);
            return (
              <button
                key={h}
                onClick={() => {
                  const next = isSelected
                    ? scenario.timeHorizons.filter((t) => t !== h)
                    : [...scenario.timeHorizons, h];
                  if (next.length > 0) updateTimeHorizons(scenario.id, next);
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  isSelected ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary hover:bg-hover'
                }`}
              >
                {TIME_HORIZON_LABELS[h]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/cohort')} className="btn-primary text-sm">
          Next: Configure Cohort →
        </button>
        <button onClick={() => navigate('/simulator/run')} className="btn-ghost text-sm">
          Skip to Run
        </button>
      </div>
    </div>
  );
}
