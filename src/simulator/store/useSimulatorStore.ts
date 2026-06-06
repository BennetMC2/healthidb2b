import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Scenario, ScenarioAssumptions, CohortDefinition, InterventionId, RewardConfig, BehaviourLeverId, TimeHorizon, Market, ProductType } from '../types';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

interface SimulatorStore {
  scenarios: Scenario[];
  activeScenarioId: string | null;

  // Actions
  setActiveScenario: (id: string | null) => void;
  getActiveScenario: () => Scenario | undefined;
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => Scenario | undefined;

  // Wizard helpers
  updateCohort: (id: string, definition: CohortDefinition) => void;
  updateInterventions: (id: string, interventions: InterventionId[]) => void;
  updateReward: (id: string, config: RewardConfig) => void;
  updateAssumptions: (id: string, assumptions: Partial<ScenarioAssumptions>) => void;
  updateLeverTargets: (id: string, targets: Partial<Record<BehaviourLeverId, number>>) => void;
  updateTimeHorizons: (id: string, horizons: TimeHorizon[]) => void;
  updateRewardCeiling: (id: string, pct: number) => void;
  updateMarket: (id: string, market: Market) => void;
  updateProductType: (id: string, productType: ProductType) => void;
}

export const useSimulatorStore = create<SimulatorStore>()(
  persist(
    (set, get) => ({
      scenarios: [...DEMO_SCENARIOS],
      activeScenarioId: null,

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      getActiveScenario: () => {
        const { scenarios, activeScenarioId } = get();
        return scenarios.find((s) => s.id === activeScenarioId);
      },

      addScenario: (scenario) =>
        set((s) => ({ scenarios: [...s.scenarios, scenario] })),

      updateScenario: (id, updates) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, ...updates } : sc,
          ),
        })),

      deleteScenario: (id) =>
        set((s) => ({
          scenarios: s.scenarios.filter((sc) => sc.id !== id),
          activeScenarioId: s.activeScenarioId === id ? null : s.activeScenarioId,
        })),

      duplicateScenario: (id) => {
        const scenario = get().scenarios.find((s) => s.id === id);
        if (!scenario) return undefined;
        const dup: Scenario = {
          ...scenario,
          id: `sim_${Date.now()}`,
          name: `${scenario.name} (copy)`,
          status: 'draft',
          result: undefined,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ scenarios: [...s.scenarios, dup] }));
        return dup;
      },

      updateCohort: (id, definition) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, cohortDefinition: definition, status: 'draft' as const } : sc,
          ),
        })),

      updateInterventions: (id, interventions) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, interventions, status: 'draft' as const } : sc,
          ),
        })),

      updateReward: (id, config) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, rewardConfig: config, rewardConfigId: config.id, status: 'draft' as const } : sc,
          ),
        })),

      updateAssumptions: (id, assumptions) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id
              ? { ...sc, assumptions: { ...sc.assumptions, ...assumptions } }
              : sc,
          ),
        })),

      updateLeverTargets: (id, targets) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id
              ? { ...sc, leverTargets: { ...sc.leverTargets, ...targets } }
              : sc,
          ),
        })),

      updateTimeHorizons: (id, horizons) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, timeHorizons: horizons } : sc,
          ),
        })),

      updateRewardCeiling: (id, pct) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, rewardCeilingPct: pct, status: 'draft' as const } : sc,
          ),
        })),

      updateMarket: (id, market) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, market } : sc,
          ),
        })),

      updateProductType: (id, productType) =>
        set((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id ? { ...sc, productType } : sc,
          ),
        })),
    }),
    {
      name: 'healthid-simulator-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SimulatorStore> | undefined;
        const persistedScenarios = p?.scenarios ?? [];
        const demoIds = new Set(DEMO_SCENARIOS.map((d) => d.id));
        const userScenarios = persistedScenarios.filter((s) => !demoIds.has(s.id));
        return {
          ...current,
          scenarios: [...DEMO_SCENARIOS, ...userScenarios],
          activeScenarioId: p?.activeScenarioId ?? null,
        };
      },
    },
  ),
);
