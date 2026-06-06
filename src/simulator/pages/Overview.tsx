import { useNavigate } from 'react-router-dom';
import { Plus, Presentation } from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useSimulationResultStore } from '../store/useSimulationResultStore';
import ScenarioCard from '../components/ScenarioCard';
import FlowDiagram from '../components/FlowDiagram';
import PresentationMode from '../components/PresentationMode';

export default function Overview() {
  const navigate = useNavigate();
  const { scenarios, setActiveScenario, duplicateScenario, deleteScenario } = useSimulatorStore();
  const { presentationMode, enterPresentation, exitPresentation, results } = useSimulationResultStore();
  const demoScenarios = scenarios.filter((s) => s.id.startsWith('demo_'));
  const userScenarios = scenarios.filter((s) => !s.id.startsWith('demo_'));

  // Find first completed scenario for presentation mode
  const completedScenario = scenarios.find((s) => results[s.id]);

  function handleSelect(id: string) {
    setActiveScenario(id);
    navigate('/simulator/scenario');
  }

  function handleNewScenario() {
    const id = `sim_${Date.now()}`;
    useSimulatorStore.getState().addScenario({
      id,
      name: 'New Scenario',
      description: '',
      market: 'hong_kong',
      productType: 'individual_life',
      cohortPresetId: null,
      cohortDefinition: {
        market: 'hong_kong',
        productType: 'individual_life',
        ageRange: [25, 54],
        baselineRisk: 'medium',
        deviceClass: 'advanced_wearable',
      },
      interventions: [],
      rewardConfigId: 'weekly_streak',
      rewardConfig: {
        id: 'weekly_streak',
        name: 'Weekly Streak Reward',
        description: 'Default reward configuration',
        outcomeTarget: 'claims',
        rewardTypeMix: { cash: 0.6, loyalty: 0.2, health_aspirational: 0.15, status: 0.05 },
        budgetPerMember: 120,
        behaviouralModifiers: ['loss_aversion', 'streak_multiplier'],
        expectedParticipation: 0.45,
        expectedCompletion: 0.28,
        expectedPersistence: 0.18,
      },
      timeHorizons: ['90d', '1y', '3y'],
      leverBaselines: { activity: 0.40, sleep: 0.50, cardiovascular: 0.45, body_composition: 0.42, stress: 0.48, smoking: 0.80 },
      leverTargets: { activity: 0.58, sleep: 0.62, cardiovascular: 0.60, body_composition: 0.50, stress: 0.58, smoking: 0.85 },
      rewardCeilingPct: 0.70,
      assumptions: { discountRate: 0.08, dropoutRate: 0.25, verificationRate: 0.31, claimsInflation: 0.04, realizationFactor: 0.65 },
      status: 'draft',
      createdAt: new Date().toISOString(),
    });
    setActiveScenario(id);
    navigate('/simulator/scenario');
  }

  if (presentationMode && completedScenario && results[completedScenario.id]) {
    return (
      <PresentationMode
        scenario={completedScenario}
        output={results[completedScenario.id]}
        onExit={exitPresentation}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero */}
      <div className="card-elevated border-accent/15 p-6">
        <div className="text-2xs uppercase tracking-[0.2em] text-accent/80 mb-2">Actuarial Behaviour Model v1</div>
        <h2 className="text-[1.75rem] font-semibold leading-tight font-display text-primary">
          Health Signal → Insurer Value Simulator
        </h2>
        <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-tertiary">
          End-to-end simulation from wearable and clinical health signals through to projected ROI for insurer cohorts.
          6-layer model with real clinical evidence, configurable rewards, and full audit lineage.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleNewScenario} className="btn-primary text-sm gap-1.5">
            <Plus size={14} /> Start New Scenario
          </button>
          {completedScenario && (
            <button onClick={enterPresentation} className="btn-ghost text-sm gap-1.5">
              <Presentation size={14} /> Enter Presentation Mode
            </button>
          )}
        </div>
      </div>

      {/* Demo scenarios */}
      <div>
        <h3 className="text-base font-semibold text-primary font-display mb-3">Demo Scenarios</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoScenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onSelect={handleSelect}
              onDuplicate={duplicateScenario}
            />
          ))}
        </div>
      </div>

      {/* User scenarios */}
      {userScenarios.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-primary font-display mb-3">Your Scenarios</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userScenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onSelect={handleSelect}
                onDuplicate={(id) => duplicateScenario(id)}
                onDelete={(id) => deleteScenario(id)}
                isActive={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Flow diagram */}
      <div>
        <h3 className="text-base font-semibold text-primary font-display mb-3">6-Layer Model Architecture</h3>
        <div className="card max-w-md">
          <FlowDiagram />
        </div>
      </div>
    </div>
  );
}
