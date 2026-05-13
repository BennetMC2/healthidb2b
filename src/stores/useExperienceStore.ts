import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExperienceStore {
  executiveMode: boolean;
  toggleExecutiveMode: () => void;
}

export const useExperienceStore = create<ExperienceStore>()(
  persist(
    (set) => ({
      executiveMode: false,
      toggleExecutiveMode: () => set((state) => ({ executiveMode: !state.executiveMode })),
    }),
    {
      name: 'healthid-b2b-experience-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
