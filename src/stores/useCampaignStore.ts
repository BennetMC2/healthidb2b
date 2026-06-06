import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Campaign, CampaignB2CSyncState, CampaignStatus } from '@/types';
import { campaigns as seedCampaigns } from '@/data/campaigns';

interface CampaignStore {
  campaigns: Campaign[];
  deletedCampaignIds: string[];
  addCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
  updateStatus: (id: string, status: CampaignStatus) => void;
  updateBudget: (id: string, budgetSpent: number) => void;
  updateBudgetCeiling: (id: string, budgetCeiling: number) => void;
  updateB2CSync: (id: string, sync: Partial<CampaignB2CSyncState>) => void;
  getCampaign: (id: string) => Campaign | undefined;
}

function mergeCampaignLists(persistedCampaigns?: Campaign[], deletedCampaignIds: string[] = []): Campaign[] {
  const merged = new Map<string, Campaign>();
  const seedIds = new Set(seedCampaigns.map((campaign) => campaign.id));
  const deletedIds = new Set(deletedCampaignIds);

  seedCampaigns.forEach((campaign) => {
    if (deletedIds.has(campaign.id)) return;
    merged.set(campaign.id, campaign);
  });

  (persistedCampaigns ?? []).forEach((campaign) => {
    if (deletedIds.has(campaign.id)) return;
    if (seedIds.has(campaign.id)) return;
    merged.set(campaign.id, campaign);
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      campaigns: mergeCampaignLists(),
      deletedCampaignIds: [],

      addCampaign: (campaign) =>
        set((s) => ({
          campaigns: mergeCampaignLists([campaign, ...s.campaigns], s.deletedCampaignIds.filter((id) => id !== campaign.id)),
          deletedCampaignIds: s.deletedCampaignIds.filter((id) => id !== campaign.id),
        })),

      deleteCampaign: (id) =>
        set((s) => ({
          campaigns: s.campaigns.filter((campaign) => campaign.id !== id),
          deletedCampaignIds: s.deletedCampaignIds.includes(id)
            ? s.deletedCampaignIds
            : [...s.deletedCampaignIds, id],
        })),

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

      updateBudgetCeiling: (id, budgetCeiling) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id
              ? { ...c, rewards: { ...c.rewards, budgetCeiling } }
              : c,
          ),
        })),

      updateB2CSync: (id, sync) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) => {
            if (c.id !== id) return c;

            const nextSync = { ...c.b2cSync, ...sync } as CampaignB2CSyncState;

            return {
              ...c,
              b2cSync: nextSync,
              funnel: {
                eligible: nextSync.eligibleUsers ?? c.funnel.eligible,
                invited: nextSync.inviteCount ?? c.funnel.invited,
                enrolled: nextSync.acceptedCount ?? c.funnel.enrolled,
                verified: nextSync.verifiedCount ?? c.funnel.verified,
                rewarded: nextSync.rewardedCount ?? c.funnel.rewarded,
              },
            };
          }),
        })),

      getCampaign: (id) => get().campaigns.find((c) => c.id === id),
    }),
    {
      name: 'healthid-b2b-campaign-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        campaigns: state.campaigns,
        deletedCampaignIds: state.deletedCampaignIds,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { campaigns?: Campaign[]; deletedCampaignIds?: string[] } | undefined;
        const persistedCampaigns = persisted?.campaigns;
        const deletedCampaignIds = persisted?.deletedCampaignIds ?? [];
        return {
          ...currentState,
          campaigns: mergeCampaignLists(persistedCampaigns, deletedCampaignIds),
          deletedCampaignIds,
        };
      },
    },
  ),
);
