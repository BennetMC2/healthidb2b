import { create } from 'zustand';
import type { Partner } from '@/types';
import { partners } from '@/data/partners';

interface PartnerStore {
  currentPartner: Partner;
  allPartners: Partner[];
  setCurrentPartner: (id: string) => void;
}

export const usePartnerStore = create<PartnerStore>((set) => ({
  currentPartner: partners[0],
  allPartners: partners,
  setCurrentPartner: (id) =>
    set({ currentPartner: partners.find((p) => p.id === id) || partners[0] }),
}));
