import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { INTERVENTIONS, CLINICAL_RULES } from '../data/interventions';
import InterventionCard from '../components/InterventionCard';
import BehaviourLeverPanel from '../components/BehaviourLeverPanel';
import AdvancedToggle from '../components/AdvancedToggle';
import type { InterventionId, BehaviourLeverId } from '../types';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';

export default function InterventionBuilder() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId, updateInterventions, updateLeverTargets } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No scenario selected.</p>
        <button onClick={() => navigate('/simulator/overview')} className="btn-ghost text-sm mt-2">Go to Overview</button>
      </div>
    );
  }

  function handleToggle(id: string) {
    const interventionId = id as InterventionId;
    const isSelected = scenario!.interventions.includes(interventionId);
    const next = isSelected
      ? scenario!.interventions.filter((i) => i !== interventionId)
      : [...scenario!.interventions, interventionId];
    updateInterventions(scenario!.id, next as InterventionId[]);
  }

  const activeRules = CLINICAL_RULES.filter((r) => scenario.interventions.includes(r.interventionId));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Intervention cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTERVENTIONS.map((intervention) => (
          <InterventionCard
            key={intervention.id}
            intervention={intervention}
            selected={scenario.interventions.includes(intervention.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Lever targets for active interventions */}
      {scenario.interventions.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-primary font-display mb-4">Lever Targets</h3>
          <BehaviourLeverPanel
            baselines={scenario.leverBaselines}
            targets={scenario.leverTargets}
            onChange={(lever, value) => updateLeverTargets(scenario.id, { [lever]: value })}
            leversToShow={[...new Set(
              INTERVENTIONS
                .filter((i) => scenario.interventions.includes(i.id))
                .flatMap((i) => i.levers),
            )] as BehaviourLeverId[]}
          />
        </div>
      )}

      {/* Advanced: clinical rules */}
      <AdvancedToggle label="Clinical Rules & Effect Sizes">
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-2xs text-tertiary border-b border-border pb-1">
            <span>Signal</span>
            <span>Intervention</span>
            <span>Effect Size</span>
            <span>Range</span>
            <span>Evidence</span>
          </div>
          {activeRules.map((rule, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 text-xs text-secondary py-1 border-b border-border/30">
              <span className="font-medium">{HEALTH_METRIC_LABELS[rule.signalId]}</span>
              <span>{rule.interventionId.replace(/_/g, ' ')}</span>
              <span className="font-mono">{(rule.effectSize * 100).toFixed(0)}%</span>
              <span className="font-mono">{(rule.effectSizeRange[0] * 100).toFixed(0)}-{(rule.effectSizeRange[1] * 100).toFixed(0)}%</span>
              <span className="text-2xs text-tertiary truncate">{rule.evidenceId}</span>
            </div>
          ))}
          {activeRules.length === 0 && (
            <p className="text-sm text-tertiary py-3">Select an intervention to see clinical rules.</p>
          )}
        </div>
      </AdvancedToggle>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/rewards')} className="btn-primary text-sm">Next: Reward Function →</button>
        <button onClick={() => navigate('/simulator/evidence')} className="btn-ghost text-sm">← Back</button>
      </div>
    </div>
  );
}
