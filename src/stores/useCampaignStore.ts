import { create } from 'zustand';
import type { Campaign, CampaignStatus } from '@/types';
import { campaigns as seedCampaigns } from '@/data/campaigns';

interface CampaignStore {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  updateStatus: (id: string, status: CampaignStatus) => void;
  updateBudget: (id: string, budgetSpent: number) => void;
  getCampaign: (id: string) => Campaign | undefined;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [...seedCampaigns],

  addCampaign: (campaign) =>
    set((s) => ({ campaigns: [campaign, ...s.campaigns] })),

  updateStatus: (id, status) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === id ? { ...c, status } : c,
      ),
    })),

  updateBudget: (id, budgetSpent) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === id
          ? { ...c, rewards: { ...c.rewards, budgetSpent } }
          : c,
      ),
    })),

  getCampaign: (id) => get().campaigns.find((c) => c.id === id),
}));
