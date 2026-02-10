// ── Reputation & Health ──────────────────────────────────────────────

export type ReputationTier = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';

export type DataSource =
  | 'apple_health'
  | 'fitbit'
  | 'garmin'
  | 'oura'
  | 'whoop'
  | 'google_fit'
  | 'samsung_health'
  | 'lab_results';

export type HealthMetric =
  | 'steps'
  | 'sleep_hours'
  | 'sleep_quality'
  | 'heart_rate_resting'
  | 'hrv'
  | 'active_minutes'
  | 'stress_score'
  | 'hydration'
  | 'body_composition'
  | 'blood_glucose';

// ── Health Identity ─────────────────────────────────────────────────

export interface HealthIdentity {
  id: string;
  anonymizedId: string;
  healthScore: number;
  reputationTier: ReputationTier;
  connectedSources: DataSource[];
  demographics: {
    ageRange: string;
    gender: 'male' | 'female' | 'other';
    region: string;
  };
  verificationCount: number;
  lastVerified: string | null;
  enrolledCampaigns: number;
  createdAt: string;
}

// ── Campaigns ───────────────────────────────────────────────────────

export type CampaignType = 'snapshot' | 'stream';
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'paused';

export type ChallengeOperator = 'gte' | 'lte' | 'eq' | 'between';

export interface ChallengeCriteria {
  metric: HealthMetric;
  operator: ChallengeOperator;
  target: number;
  targetMax?: number;
  unit: string;
}

export interface CohortTargeting {
  healthScoreMin?: number;
  healthScoreMax?: number;
  reputationTiers?: ReputationTier[];
  dataSources?: DataSource[];
  ageRanges?: string[];
  genders?: ('male' | 'female' | 'other')[];
  regions?: string[];
}

export interface CampaignRewards {
  pointsPerVerification: number;
  budgetCeiling: number;
  budgetSpent: number;
  maxParticipants: number;
}

export interface CampaignFunnelData {
  eligible: number;
  invited: number;
  enrolled: number;
  verified: number;
  rewarded: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  partnerId: string;
  challenge: ChallengeCriteria;
  targeting: CohortTargeting;
  rewards: CampaignRewards;
  funnel: CampaignFunnelData;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface SnapshotCampaign extends Campaign {
  type: 'snapshot';
  endDate: string;
}

export interface StreamCampaign extends Campaign {
  type: 'stream';
  frequency: 'daily' | 'weekly' | 'monthly';
  streamDuration: number; // days
  dynamicPricing: boolean;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  icon: string;
  challenge: ChallengeCriteria;
  targeting: Partial<CohortTargeting>;
  suggestedBudget: number;
  suggestedPoints: number;
}

// ── Verifications ───────────────────────────────────────────────────

export type ProofType = 'zk_snark' | 'zk_stark' | 'bulletproof';
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';

export interface VerificationReceipt {
  id: string;
  campaignId: string;
  identityId: string;
  proofType: ProofType;
  proofHash: string;
  status: VerificationStatus;
  metric: HealthMetric;
  dataSources: DataSource[];
  timestamp: string;
  verifiedAt: string | null;
  proofGenerationMs: number;
  metadata: {
    aggregationType: 'mean' | 'max' | 'min' | 'sum' | 'latest';
    timeWindowHours: number;
    dataPointCount: number;
  };
}

// ── Treasury ────────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit'
  | 'yield_credit'
  | 'distribution'
  | 'expiration'
  | 'withdrawal';

export interface TreasuryState {
  totalBudget: number;
  availableBalance: number;
  yieldRate: number;
  yieldGenerated: number;
  valueMultiplier: number;
  pointsDistributed: number;
  pointsReserved: number;
  pointsExpired: number;
}

export interface TreasuryTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  timestamp: string;
  partnerId: string;
}

export interface TreasurySnapshot {
  date: string;
  totalBudget: number;
  yieldAccrued: number;
  cumulativeYield: number;
  pointsDistributed: number;
  valueMultiplier: number;
}

export interface HealthPointsConfig {
  wholesaleRate: number;
  expirationMonths: number;
  budgetCeiling: number;
  minDistribution: number;
}

// ── Compliance ──────────────────────────────────────────────────────

export type ComplianceEventType =
  | 'verification_requested'
  | 'proof_generated'
  | 'proof_verified'
  | 'proof_failed'
  | 'data_processed'
  | 'audit_query';

export interface ComplianceRecord {
  id: string;
  eventType: ComplianceEventType;
  timestamp: string;
  partnerId: string;
  campaignId: string | null;
  proofHash: string | null;
  piiAccessed: false; // always false — ZK architecture
  ipHash: string;
  userAgent: string;
  details: string;
}

export interface DataProcessingSummary {
  period: string;
  recordsProcessed: number;
  proofsGenerated: number;
  proofsVerified: number;
  proofsFailed: number;
  avgProofGenerationMs: number;
  dataSourcesAccessed: DataSource[];
  piiAccessEvents: 0; // always 0
}

// ── Partner ─────────────────────────────────────────────────────────

export type PartnerTier = 'enterprise' | 'professional' | 'starter';
export type PartnerIndustry = 'insurance' | 'pharma' | 'employer' | 'research' | 'healthcare';

export interface Partner {
  id: string;
  label: string;
  tier: PartnerTier;
  industry: PartnerIndustry;
  apiKeyPrefix: string;
  settings: PartnerSettings;
  createdAt: string;
}

export interface PartnerSettings {
  notifications: {
    verificationAlerts: boolean;
    budgetAlerts: boolean;
    weeklyDigest: boolean;
    complianceReports: boolean;
  };
  dataRetention: {
    proofRetentionDays: number;
    auditLogRetentionDays: number;
  };
  allowedRegions: string[];
  maxConcurrentCampaigns: number;
}

// ── UI State ────────────────────────────────────────────────────────

export interface FilterState {
  healthScoreRange: [number, number];
  reputationTiers: ReputationTier[];
  dataSources: DataSource[];
  ageRanges: string[];
  genders: ('male' | 'female' | 'other')[];
}
