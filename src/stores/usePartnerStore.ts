import { create } from 'zustand';
import type { Partner, PartnerSettings, PartnerIndustry } from '@/types';
import { partners } from '@/data/partners';

interface PartnerStore {
  currentPartner: Partner;
  allPartners: Partner[];
  setCurrentPartner: (id: string) => void;
  updatePartnerLabel: (label: string) => void;
  updatePartnerSettings: (settings: Partial<PartnerSettings> & { industry?: PartnerIndustry }) => void;
}

export const usePartnerStore = create<PartnerStore>((set) => ({
  currentPartner: partners[0],
  allPartners: partners,
  setCurrentPartner: (id) => {
    const found = partners.find((p) => p.id === id) || partners[0];
    set((s) => {
      // Also update in allPartners if current was modified
      const allPartners = s.allPartners.map((p) => (p.id === s.currentPartner.id ? s.currentPartner : p));
      return { currentPartner: allPartners.find((p) => p.id === id) || found, allPartners };
    });
  },
  updatePartnerLabel: (label) =>
    set((s) => ({
      currentPartner: { ...s.currentPartner, label },
      allPartners: s.allPartners.map((p) =>
        p.id === s.currentPartner.id ? { ...p, label } : p,
      ),
    })),
  updatePartnerSettings: (updates) =>
    set((s) => {
      const { industry, ...settingsUpdates } = updates;
      const newPartner = {
        ...s.currentPartner,
        ...(industry ? { industry } : {}),
        settings: { ...s.currentPartner.settings, ...settingsUpdates },
      };
      return {
        currentPartner: newPartner,
        allPartners: s.allPartners.map((p) =>
          p.id === s.currentPartner.id ? newPartner : p,
        ),
      };
    }),
}));
