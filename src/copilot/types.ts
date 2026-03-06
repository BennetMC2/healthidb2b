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
  partner: {
    name: string;
    tier: string;
    industry: PartnerIndustry;
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
  };
}

// ── Provider Interface ──────────────────────────────────────────────

export interface CopilotProvider {
  generateResponse(
    messages: Message[],
    context: DataContext,
  ): AsyncGenerator<string, void, undefined>;
}
