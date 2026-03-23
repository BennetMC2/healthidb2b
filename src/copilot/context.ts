import type { Campaign, Partner } from '@/types';
import type { DataContext } from './types';
import { identities } from '@/data/identities';
import { verifications } from '@/data/verifications';
import { treasuryState } from '@/data/treasury';
import { complianceRecords } from '@/data/compliance';
import { useCampaignStore } from '@/stores/useCampaignStore';

export function buildDataContext(partner: Partner, currentPage?: string): DataContext {
  // ── Campaigns scoped to partner ──
  const allCampaigns: Campaign[] = useCampaignStore.getState().campaigns;
  const partnerCampaigns = allCampaigns.filter((c) => c.partnerId === partner.id);
  const activeCampaigns = partnerCampaigns.filter((c) => c.status === 'active');
  const completedCampaigns = partnerCampaigns.filter((c) => c.status === 'completed');
  const draftCampaigns = partnerCampaigns.filter((c) => c.status === 'draft');
  const pausedCampaigns = partnerCampaigns.filter((c) => c.status === 'paused');

  const totalBudget = partnerCampaigns.reduce((s, c) => s + c.rewards.budgetCeiling, 0);
  const totalSpent = partnerCampaigns.reduce((s, c) => s + c.rewards.budgetSpent, 0);

  // Top campaign by verified count
  const topCampaign = partnerCampaigns.length > 0
    ? [...partnerCampaigns].sort((a, b) => b.funnel.verified - a.funnel.verified)[0].name
    : null;

  // ── Identities (global — not partner-scoped) ──
  const tierCounts: Record<string, number> = {};
  let totalScore = 0;
  const sourceCounts: Record<string, number> = {};

  for (const id of identities) {
    tierCounts[id.reputationTier] = (tierCounts[id.reputationTier] || 0) + 1;
    totalScore += id.healthScore;
    for (const src of id.connectedSources) {
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }
  }

  const topSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([src]) => src);

  // ── Verifications scoped to partner campaigns ──
  const partnerCampaignIds = new Set(partnerCampaigns.map((c) => c.id));
  const partnerVerifications = verifications.filter((v) => partnerCampaignIds.has(v.campaignId));

  const verified = partnerVerifications.filter((v) => v.status === 'verified').length;
  const pending = partnerVerifications.filter((v) => v.status === 'pending').length;
  const failed = partnerVerifications.filter((v) => v.status === 'failed').length;
  const expired = partnerVerifications.filter((v) => v.status === 'expired').length;
  const successRate = partnerVerifications.length > 0
    ? Math.round((verified / partnerVerifications.length) * 100)
    : 0;
  const avgProofTimeMs = partnerVerifications.length > 0
    ? Math.round(partnerVerifications.reduce((s, v) => s + v.proofGenerationMs, 0) / partnerVerifications.length)
    : 0;

  const byProofType: Record<string, number> = {};
  for (const v of partnerVerifications) {
    byProofType[v.proofType] = (byProofType[v.proofType] || 0) + 1;
  }

  // ── Compliance scoped to partner ──
  const partnerCompliance = complianceRecords.filter((r) => r.partnerId === partner.id);
  const byEventType: Record<string, number> = {};
  let recentFailures = 0;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const r of partnerCompliance) {
    byEventType[r.eventType] = (byEventType[r.eventType] || 0) + 1;
    if (r.eventType === 'proof_failed' && new Date(r.timestamp).getTime() > thirtyDaysAgo) {
      recentFailures++;
    }
  }

  return {
    currentPage,
    partner: {
      name: partner.label,
      tier: partner.tier,
      industry: partner.industry,
    },
    campaigns: {
      total: partnerCampaigns.length,
      active: activeCampaigns.length,
      completed: completedCampaigns.length,
      draft: draftCampaigns.length,
      paused: pausedCampaigns.length,
      totalBudget,
      totalSpent,
      topCampaign,
    },
    identities: {
      total: identities.length,
      byTier: tierCounts,
      avgHealthScore: Math.round(totalScore / identities.length),
      topSources,
    },
    verifications: {
      total: partnerVerifications.length,
      verified,
      pending,
      failed,
      expired,
      successRate,
      avgProofTimeMs,
      byProofType,
    },
    treasury: {
      totalBudget: treasuryState.totalBudget,
      availableBalance: treasuryState.availableBalance,
      yieldRate: treasuryState.yieldRate,
      yieldGenerated: treasuryState.yieldGenerated,
      valueMultiplier: treasuryState.valueMultiplier,
      pointsDistributed: treasuryState.pointsDistributed,
    },
    compliance: {
      totalRecords: partnerCompliance.length,
      byEventType,
      piiAccessEvents: 0,
      recentFailures,
    },
  };
}
