import type { PartnerIndustry } from '@/types';

// ── Messages ────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

// ── Data Context ────────────────────────────────────────────────────

export interface DataContext {
  currentPage?: string;
  partner: {
    name: string;
    tier: string;
    industry: PartnerIndustry;
    portfolioBrief?: string;
    lives?: number;
    leadSignal?: string;
  };
  campaigns: {
    total: number;
    active: number;
    completed: number;
    draft: number;
    paused: number;
    totalBudget: number;
    totalSpent: number;
    topCampaign: string | null;
  };
  identities: {
    total: number;
    byTier: Record<string, number>;
    avgHealthScore: number;
    topSources: string[];
  };
  verifications: {
    total: number;
    verified: number;
    pending: number;
    failed: number;
    expired: number;
    successRate: number;
    avgProofTimeMs: number;
    byProofType: Record<string, number>;
  };
  treasury: {
    totalBudget: number;
    availableBalance: number;
    yieldRate: number;
    yieldGenerated: number;
    valueMultiplier: number;
    pointsDistributed: number;
  };
  compliance: {
    totalRecords: number;
    byEventType: Record<string, number>;
    piiAccessEvents: number;
    recentFailures: number;
    verifiedReceipts?: number;
  };
  /** Computed actuarial metrics for insights — derived from the engine, not hardcoded. */
  actuarial?: {
    leadInsight: {
      campaignName: string;
      cohortSize: number;
      bookValueUsd: number;
      roiMultiple: number;
      claimsReductionPct: number;
      paybackMonths: number;
      budgetUsd: number;
      hpPerMember: number;
    };
    secondInsight?: {
      campaignName: string;
      bookValueUsd: number;
      roiMultiple: number;
      paybackMonths: number;
    };
    sleepInsight?: {
      campaignName: string;
      bookValueUsd: number;
      roiMultiple: number;
      paybackMonths: number;
    };
    rhrInsight?: {
      campaignName: string;
      bookValueUsd: number;
      roiMultiple: number;
      paybackMonths: number;
    };
  };
  /** Engine-derived signal library and economic assumptions (for grounded AI generation) */
  engine?: {
    assumptionSetVersion: string;
    assumptionSetLabel: string;
    signals: Array<{
      signalId: string;
      displayName: string;
      evidenceTier: string;
      trustCeiling: string;
      attributionConfidence: number;
      claimsPathway: string;
      doseEffectP50: number | null;
    }>;
    claimsBridge: Array<{
      key: string;
      annualDeltaUsd: number;
      prevalence: number;
      attribution: number;
    }>;
    economics: {
      valuationHorizonYears: number;
      discountRatePct: number;
      persistedSavingsYears: number;
      rewardCostRatio: number;
      lapseReduction: number;
      ltvPerMember: number;
    };
  };
}

// ── Provider Interface ──────────────────────────────────────────────

export interface CopilotProvider {
  generateResponse(
    messages: Message[],
    context: DataContext,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<string, void, undefined>;
}
