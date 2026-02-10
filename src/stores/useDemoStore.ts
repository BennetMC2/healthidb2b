import { create } from 'zustand';
import type { WalkthroughStep } from '@/walkthrough/types';
import { walkthroughSteps } from '@/walkthrough/steps';

interface DemoStore {
  isActive: boolean;
  currentStepIndex: number;
  steps: WalkthroughStep[];

  startDemo: () => void;
  endDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  notifyUserAction: () => void;
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  isActive: false,
  currentStepIndex: 0,
  steps: walkthroughSteps,

  startDemo: () =>
    set({
      isActive: true,
      currentStepIndex: 0,
    }),

  endDemo: () =>
    set({
      isActive: false,
      currentStepIndex: 0,
    }),

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      get().endDemo();
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  goToStep: (index) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStepIndex: index });
    }
  },

  notifyUserAction: () => {
    const { currentStepIndex, steps } = get();
    const step = steps[currentStepIndex];
    if (
      step &&
      (step.actionType === 'click-target' ||
        step.actionType === 'click-any-in' ||
        step.actionType === 'interact')
    ) {
      get().nextStep();
    }
  },
}));
