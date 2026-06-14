// ── Portfolio Allocator Types ─────────────────────────────────────────
// The top-level object is an Allocation, not a Campaign.
// Reward is a solved output, not a user input.

import type { HealthMetric, CampaignUseCase } from './index';

// ── Objective weights ────────────────────────────────────────────────
// 5 dials the operator steers. Sum is normalised internally.

export interface ObjectiveWeights {
  /** Morbidity: claims avoided via behaviour change */
  claims: number;
  /** Mortality margin: life-book avoided-death-claim value */
  mortality: number;
  /** Retention: retained premium from renewal / lapse prevention */
  retention: number;
  /** Acquisition: LTV of new pre-verified members */
  acquisition: number;
  /** Data fidelity: verification-grade uplift (multiplier on all other pools) */
  fidelity: number;
}

export const DEFAULT_WEIGHTS: ObjectiveWeights = {
  claims: 0.35,
  mortality: 0.20,
  retention: 0.20,
  acquisition: 0.15,
  fidelity: 0.10,
};

export const WEIGHT_LABELS: Record<keyof ObjectiveWeights, string> = {
  claims: 'Claims reduction',
  mortality: 'Mortality margin',
  retention: 'Retention',
  acquisition: 'Acquisition',
  fidelity: 'Data fidelity',
};

// ── Multi-pool value breakdown ───────────────────────────────────────

export interface PoolBreakdown {
  claims: number;
  mortality: number;
  retention: number;
  acquisition: number;
  /** Fidelity is a multiplier, but we also express the attributed dollar value */
  fidelity: number;
  /** Sum of all pools */
  total: number;
}

// ── Verification grade (from lifeInsuranceValue.ts) ──────────────────

export type VerificationGrade =
  | 'self_reported'
  | 'device'
  | 'source_attested'
  | 'multi_signal'
  | 'zero_custody_verified';

export const VERIFICATION_GRADE_MULTIPLIER: Record<VerificationGrade, number> = {
  self_reported: 0.25,
  device: 0.50,
  source_attested: 0.72,
  multi_signal: 0.86,
  zero_custody_verified: 1.00,
};

export const VERIFICATION_GRADE_LABELS: Record<VerificationGrade, string> = {
  self_reported: 'Self-reported',
  device: 'Device',
  source_attested: 'Source-attested',
  multi_signal: 'Multi-signal',
  zero_custody_verified: 'ZK-verified',
};

// ── Allocation line ──────────────────────────────────────────────────

export type LineStatus = 'included' | 'excluded' | 'pinned';

export interface AllocationLine {
  id: string;
  /** Display name for this play */
  name: string;
  /** Primary health metric driving this line */
  signal: HealthMetric;
  signalLabel: string;
  /** Business use case */
  useCase: CampaignUseCase;
  /** Target cohort name */
  cohort: string;
  cohortSize: number;
  /** Engine-derived reward (Health Points per verification) */
  derivedRewardHp: number;
  /** Engine-derived reward (USD PMPM equivalent) */
  derivedRewardUsd: number;
  /** Multi-pool value breakdown */
  value: PoolBreakdown;
  /** Weighted value (objective-adjusted) */
  weightedValue: number;
  /** Line-level ROI = total value / reward cost */
  roi: number;
  /** Budget allocated to this line */
  budgetAllocated: number;
  /** Evidence confidence level */
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  /** Required verification grade for bookable outcomes */
  verificationGrade: VerificationGrade;
  /** Line status in the portfolio */
  status: LineStatus;
  /** If pinned, the operator-chosen reward (otherwise null) */
  pinnedRewardHp: number | null;
  /** Holdout percentage for this line's measurement */
  holdoutPct: number;
  /** Cross-play: lines this enables (fidelity uplift) */
  enables: string[];
  /** Cross-play: lines that enable this */
  enabledBy: string[];
  /** Whether attention-constrained (overlapping member attention budget) */
  attentionConstrained: boolean;
  /** Payback period in months */
  paybackMonths: number;
  /** Morbidity shift in basis points */
  morbidityShiftBps: number;
  /** Expected verified lives */
  expectedVerifiedLives: number;
  /** Evidence note from the actuarial model */
  evidenceNote: string;
  /** Source insight ID if derived from actuaryInsights */
  sourceInsightId?: string;
}

// ── Portfolio constraints ────────────────────────────────────────────

export interface PortfolioConstraints {
  /** Total budget envelope in USD */
  budget: number;
  /** Minimum portfolio-level ROI (default ≥ 1) */
  roiFloor: number;
  /** Whether ring-fences are enabled */
  ringFencesEnabled: boolean;
  /** Per-line ring-fences (min/max budget per use case) */
  ringFences: Partial<Record<CampaignUseCase, { min: number; max: number }>>;
  /** Max active campaign nudges per member */
  attentionCap: number;
  /** Cooldown days between different line nudges */
  attentionCooldownDays: number;
}

export const DEFAULT_CONSTRAINTS: PortfolioConstraints = {
  budget: 250_000,
  roiFloor: 1.0,
  ringFencesEnabled: false,
  ringFences: {},
  attentionCap: 3,
  attentionCooldownDays: 14,
};

// ── Efficient frontier ───────────────────────────────────────────────

export interface FrontierPoint {
  /** Budget spend at this point */
  budgetSpend: number;
  /** Total portfolio value */
  portfolioValue: number;
  /** Portfolio ROI */
  roi: number;
  /** Weights that produced this point */
  weights: ObjectiveWeights;
  /** Number of lines included */
  lineCount: number;
}

// ── Portfolio allocation (the top-level object) ──────────────────────

export type AllocationStatus = 'draft' | 'committed';

export interface PortfolioAllocation {
  id: string;
  /** Partner context */
  partnerId: string;
  partnerLabel: string;
  /** Current objective weights */
  weights: ObjectiveWeights;
  /** Constraints */
  constraints: PortfolioConstraints;
  /** All candidate lines (included, excluded, pinned) */
  lines: AllocationLine[];
  /** Efficient frontier points */
  frontier: FrontierPoint[];

  // ── Aggregate metrics ──────────────────────────────────────────────
  /** Sum of all included lines' value */
  totalValue: PoolBreakdown;
  /** Sum of all included lines' budget */
  totalBudget: number;
  /** Portfolio-level ROI */
  portfolioRoi: number;
  /** Weighted confidence across included lines */
  weightedConfidence: number;
  /** Total addressable lives */
  addressableLives: number;
  /** Count of included lines */
  includedLineCount: number;

  /** Status */
  status: AllocationStatus;
  /** When committed */
  committedAt: string | null;
  /** Created timestamp */
  createdAt: string;
}
