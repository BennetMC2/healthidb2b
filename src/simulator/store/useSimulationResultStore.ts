import { create } from 'zustand';
import type { SimulationOutput } from '../types';

export type RunState = 'idle' | 'running' | 'complete' | 'error';
export type RunStep = 'signals' | 'confidence' | 'cohort' | 'rules' | 'rewards' | 'roi' | 'audit';

interface SimulationResultStore {
  runState: RunState;
  currentStep: RunStep | null;
  stepProgress: Record<RunStep, boolean>;
  error: string | null;
  results: Record<string, SimulationOutput>;
  presentationMode: boolean;
  presentationStep: number;

  // Actions
  startRun: () => void;
  advanceStep: (step: RunStep) => void;
  completeRun: (scenarioId: string, output: SimulationOutput) => void;
  failRun: (error: string) => void;
  resetRun: () => void;
  setResult: (scenarioId: string, output: SimulationOutput) => void;
  getResult: (scenarioId: string) => SimulationOutput | undefined;
  enterPresentation: () => void;
  exitPresentation: () => void;
  setPresentationStep: (step: number) => void;
}

const INITIAL_PROGRESS: Record<RunStep, boolean> = {
  signals: false,
  confidence: false,
  cohort: false,
  rules: false,
  rewards: false,
  roi: false,
  audit: false,
};

export const useSimulationResultStore = create<SimulationResultStore>((set, get) => ({
  runState: 'idle',
  currentStep: null,
  stepProgress: { ...INITIAL_PROGRESS },
  error: null,
  results: {},
  presentationMode: false,
  presentationStep: 0,

  startRun: () =>
    set({
      runState: 'running',
      currentStep: 'signals',
      stepProgress: { ...INITIAL_PROGRESS },
      error: null,
    }),

  advanceStep: (step) =>
    set((s) => ({
      currentStep: step,
      stepProgress: { ...s.stepProgress, [step]: true },
    })),

  completeRun: (scenarioId, output) =>
    set((s) => ({
      runState: 'complete',
      currentStep: null,
      stepProgress: Object.fromEntries(
        Object.keys(s.stepProgress).map((k) => [k, true]),
      ) as Record<RunStep, boolean>,
      results: { ...s.results, [scenarioId]: output },
    })),

  failRun: (error) =>
    set({ runState: 'error', error }),

  resetRun: () =>
    set({
      runState: 'idle',
      currentStep: null,
      stepProgress: { ...INITIAL_PROGRESS },
      error: null,
    }),

  setResult: (scenarioId, output) =>
    set((s) => ({ results: { ...s.results, [scenarioId]: output } })),

  getResult: (scenarioId) => get().results[scenarioId],

  enterPresentation: () => set({ presentationMode: true, presentationStep: 0 }),
  exitPresentation: () => set({ presentationMode: false, presentationStep: 0 }),
  setPresentationStep: (step) => set({ presentationStep: step }),
}));
