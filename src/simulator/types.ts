import type { HealthMetric, DataSource } from '@/types';

// ── Layer 1: Signals ────────────────────────────────────────────────

export type SignalSourceType = 'wearable' | 'clinical' | 'user_reported';

export interface SignalDefinition {
  id: HealthMetric;
  label: string;
  unit: string;
  category: string;
  sourceType: SignalSourceType;
  sources: DataSource[];
  behaviourLever: BehaviourLeverId;
  description: string;
  caveat: string;
}

// ── Layer 2: Confidence ─────────────────────────────────────────────

export interface SourceConfidenceBand {
  source: DataSource;
  signalType: SignalSourceType;
  baseConfidence: number;
  minConfidence: number;
  maxConfidence: number;
}

export interface ConfidenceModulatingFactor {
  id: string;
  label: string;
  description: string;
  defaultWeight: number;
  min: number;
  max: number;
}

export interface ConfidenceResult {
  dataConfidence: number;
  evidenceConfidence: number;
  compositeConfidence: number;
  label: 'higher confidence' | 'directional' | 'exploratory';
}

// ── Layer 3: Cohorts & Risk Levers ──────────────────────────────────

export type BehaviourLeverId = 'activity' | 'sleep' | 'cardiovascular' | 'body_composition' | 'stress' | 'smoking';

export interface BehaviourLever {
  id: BehaviourLeverId;
  label: string;
  description: string;
  metrics: HealthMetric[];
  baselineRange: [number, number];
  unit: string;
  improvementCeiling: number;
}

export type DeviceClass = 'advanced_wearable' | 'basic_wearable' | 'ring' | 'clinical' | 'mixed';
export type EngagementTier = 'high' | 'medium' | 'low';
export type BaselineRisk = 'high' | 'medium' | 'low';
export type Market = 'hong_kong' | 'singapore' | 'apac_generic' | 'global';
export type ProductType = 'individual_life' | 'group_life' | 'health' | 'corporate_wellness';

export interface CohortDefinition {
  market: Market;
  productType: ProductType;
  ageRange: [number, number];
  gender?: ('male' | 'female' | 'other')[];
  baselineRisk: BaselineRisk;
  engagementTier?: EngagementTier;
  deviceClass: DeviceClass;
  hasClinicalData?: boolean;
  minDataRichness?: number;
  motivationLevel?: number;
  rewardSensitivity?: number;
}

export interface CohortPreset {
  id: string;
  name: string;
  description: string;
  definition: CohortDefinition;
  estimatedSize: number;
  baselineBehaviour: Record<BehaviourLeverId, number>;
  icon: string;
}

// ── Layer 4: Interventions & Rules ──────────────────────────────────

export type InterventionId = 'activity_uplift' | 'sleep_recovery' | 'cv_risk_reduction';

export interface InterventionConfig {
  id: InterventionId;
  name: string;
  description: string;
  targetBehaviour: string;
  primarySignals: HealthMetric[];
  eligibleCohorts: string[];
  expectedChangeRange: [number, number];
  levers: BehaviourLeverId[];
  linkedEvidenceIds: string[];
}

export interface ClinicalRule {
  signalId: HealthMetric;
  interventionId: InterventionId;
  effectSize: number;
  effectSizeRange: [number, number];
  evidenceId: string;
  description: string;
}

// ── Layer 4b: Behavioural Economics ─────────────────────────────────

export interface BehaviouralEconModifier {
  id: string;
  name: string;
  description: string;
  liftFactor: number;
  category: 'loss_aversion' | 'anchoring' | 'streaks' | 'framing';
  enabled: boolean;
}

// ── Layer 5: Rewards ────────────────────────────────────────────────

export type RewardType = 'cash' | 'loyalty' | 'health_aspirational' | 'status';
export type RewardOutcomeTarget = 'ltv' | 'retention' | 'claims' | 'cross_sell';

export interface RewardConfig {
  id: string;
  name: string;
  description: string;
  outcomeTarget: RewardOutcomeTarget;
  rewardTypeMix: Record<RewardType, number>;
  budgetPerMember: number;
  behaviouralModifiers: string[];
  expectedParticipation: number;
  expectedCompletion: number;
  expectedPersistence: number;
}

// ── Layer 6: Output ─────────────────────────────────────────────────

export type TimeHorizon = '90d' | '1y' | '3y' | '5y';

export interface MonthlyProjection {
  month: number;
  projectedSavings: number;
  cumulativeSavings: number;
  rewardCost: number;
  netValue: number;
  confidenceLow: number;
  confidenceHigh: number;
  engagementRate: number;
}

export interface LeverBreakdown {
  lever: BehaviourLeverId;
  label: string;
  signalMovement: number;
  savingsContribution: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  confidenceScore: number;
}

export interface BridgeStep {
  stage: string;
  label: string;
  description: string;
  value: number;
  unit: string;
  confidence: number;
  evidenceIds: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  layer: string;
  detail: string;
  signalsUsed: HealthMetric[];
  rulesFired: string[];
  evidenceCited: string[];
  assumptions: Record<string, number>;
  modelVersion: string;
}

export interface HorizonOutput {
  netROI: number;
  projectedClaimsImpact: number;
  grossClaimsImpact: number;
  grossTotalValue: number;
  recommendedRewardBudget: number;
  derivedBudgetPerMember: number;
  morbidityShiftBps: number;
  mortalityDelta: number;
  paybackMonths: number;
  lapseRateImpact: number;
  crossSellUplift: number;
  engagementScore: number;
  actuaryConfidence: number;
  scenarioRangeLow: number;
  scenarioRangeHigh: number;
  monthlyProjections: MonthlyProjection[];
}

export interface SimulationOutput {
  scenarioId: string;
  horizons: Record<'90d' | '1y' | '3y', HorizonOutput>;
  leverBreakdowns: LeverBreakdown[];
  healthToValueBridge: BridgeStep[];
  auditTrail: AuditEntry[];
  confidenceLabel: 'higher confidence' | 'directional' | 'exploratory';
  plainEnglishSummary: string;
  caveats: string[];
}

// ── Scenario ────────────────────────────────────────────────────────

export type ScenarioStatus = 'draft' | 'configured' | 'completed';

export interface ScenarioAssumptions {
  discountRate: number;
  dropoutRate: number;
  verificationRate: number;
  claimsInflation: number;
  realizationFactor: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  market: Market;
  productType: ProductType;
  cohortPresetId: string | null;
  cohortDefinition: CohortDefinition;
  interventions: InterventionId[];
  rewardConfigId: string;
  rewardConfig: RewardConfig;
  timeHorizons: TimeHorizon[];
  leverBaselines: Record<BehaviourLeverId, number>;
  leverTargets: Record<BehaviourLeverId, number>;
  rewardCeilingPct: number;
  assumptions: ScenarioAssumptions;
  status: ScenarioStatus;
  createdAt: string;
  result?: SimulationOutput;
}

// ── Evidence ────────────────────────────────────────────────────────

export type StudyDesign = 'rct' | 'meta_analysis' | 'cohort_study' | 'industry_review';

export interface EvidenceCitation {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi: string;
  sampleSize: number;
  studyDesign: StudyDesign;
  effectSize: string;
  effectSizeNumeric: number;
  metricCategories: string[];
  modelUsage: string;
  evidenceLevel: 'high' | 'medium' | 'low';
}

// ── Presentation Mode ───────────────────────────────────────────────

export interface PresentationStep {
  id: string;
  title: string;
  subtitle: string;
  narrative: string;
  layer: number;
}
