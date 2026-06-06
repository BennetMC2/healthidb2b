import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SimulationConfig, SimulationOutput, RunState, RunStep, ChapterId } from '../types';
import { DEFAULT_CONFIG } from '../engine/simulate';

interface SimulatorStore {
  config: SimulationConfig;
  result: SimulationOutput | null;
  runState: RunState;
  currentStep: RunStep | null;
  stepProgress: Record<RunStep, boolean>;
  error: string | null;

  // Chapter navigation
  currentChapter: ChapterId;
  chapterCompletion: Record<ChapterId, boolean>;

  // Actions
  updateConfig: (updates: Partial<SimulationConfig>) => void;
  setResult: (result: SimulationOutput) => void;
  resetResult: () => void;
  startRun: () => void;
  advanceStep: (step: RunStep) => void;
  completeRun: (result: SimulationOutput) => void;
  failRun: (error: string) => void;
  resetRun: () => void;

  // Chapter actions
  setCurrentChapter: (chapter: ChapterId) => void;
  completeChapter: (chapter: ChapterId) => void;
  resetChapters: () => void;

  // Campaign selection
  toggleCampaign: (campaignId: string) => void;
}

const INITIAL_PROGRESS: Record<RunStep, boolean> = {
  population: false,
  activity: false,
  behaviour: false,
  health: false,
  claims: false,
  economics: false,
};

const INITIAL_CHAPTER_COMPLETION: Record<ChapterId, boolean> = {
  1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false,
};

export const useSimulatorStore = create<SimulatorStore>()(
  persist(
    (set) => ({
      config: { ...DEFAULT_CONFIG },
      result: null,
      runState: 'idle',
      currentStep: null,
      stepProgress: { ...INITIAL_PROGRESS },
      error: null,
      currentChapter: 1 as ChapterId,
      chapterCompletion: { ...INITIAL_CHAPTER_COMPLETION },

      updateConfig: (updates) =>
        set((s) => ({
          config: { ...s.config, ...updates },
          result: null,
          runState: 'idle',
        })),

      setResult: (result) =>
        set({ result, runState: 'complete' }),

      resetResult: () =>
        set({ result: null, runState: 'idle', currentStep: null, stepProgress: { ...INITIAL_PROGRESS }, error: null }),

      startRun: () =>
        set({
          runState: 'running',
          currentStep: 'population',
          stepProgress: { ...INITIAL_PROGRESS },
          error: null,
          result: null,
        }),

      advanceStep: (step) =>
        set((s) => ({
          currentStep: step,
          stepProgress: { ...s.stepProgress, [step]: true },
        })),

      completeRun: (result) =>
        set({
          runState: 'complete',
          currentStep: null,
          stepProgress: {
            population: true,
            activity: true,
            behaviour: true,
            health: true,
            claims: true,
            economics: true,
          },
          result,
        }),

      failRun: (error) =>
        set({ runState: 'error', error }),

      resetRun: () =>
        set({
          runState: 'idle',
          currentStep: null,
          stepProgress: { ...INITIAL_PROGRESS },
          error: null,
        }),

      setCurrentChapter: (chapter) =>
        set({ currentChapter: chapter }),

      completeChapter: (chapter) =>
        set((s) => ({
          chapterCompletion: { ...s.chapterCompletion, [chapter]: true },
        })),

      resetChapters: () =>
        set({
          currentChapter: 1 as ChapterId,
          chapterCompletion: { ...INITIAL_CHAPTER_COMPLETION },
        }),

      toggleCampaign: (campaignId) =>
        set((s) => {
          const current = s.config.selectedCampaigns;
          const isSelected = current.includes(campaignId);
          let next: string[];
          if (isSelected) {
            next = current.filter((id) => id !== campaignId);
          } else if (current.length < 3) {
            next = [...current, campaignId];
          } else {
            return s; // Max 3 campaigns
          }
          return {
            config: { ...s.config, selectedCampaigns: next },
            result: null,
            runState: 'idle' as const,
          };
        }),
    }),
    {
      name: 'healthid-simulator-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        currentChapter: state.currentChapter,
        chapterCompletion: state.chapterCompletion,
      }),
    },
  ),
);
