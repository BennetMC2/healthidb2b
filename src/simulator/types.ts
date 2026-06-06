import type { HealthMetric, CampaignUseCase } from '@/types';

// ── Core Utility Types ─────────────────────────────────────────────

/** Low / central / high uncertainty range used across all engine outputs */
export interface Range {
  low: number;
  central: number;
  high: number;
}

// ── Simulation Config (user inputs) ────────────────────────────────

export type Market = 'hong_kong' | 'singapore';
export type IncentiveType = 'financial' | 'gamification' | 'social' | 'mixed';

export interface SimulationConfig {
  market: Market;
  cohortSize: number;
  /** Campaign IDs (1-3) from campaignTemplates */
  selectedCampaigns: string[];
  useCase: CampaignUseCase;
  rewardCeilingPct: number;
  horizonMonths: number;
  realizationDiscount: number;
  archetypeWeights?: Record<string, number>;
}

// ── Demographics ───────────────────────────────────────────────────

export interface AgeBand {
  range: [number, number];
  label: string;
  male: number;
  female: number;
  totalPct: number;
}

export interface MarketDemographics {
  market: Market;
  totalPopulation: number;
  workingAgePopulation: number;
  ageBands: AgeBand[];
  source: string;
  sourceYear: number;
}

// ── Activity Baselines ─────────────────────────────────────────────

export interface ActivityBaseline {
  market: Market;
  ageBand: string;
  avgDailySteps: number;
  stepsSD: number;
  pctMeetingGuidelines: number;
  pctSedentary: number;
  source: string;
}

// ── Mortality Tables ───────────────────────────────────────────────

export interface MortalityRate {
  market: Market;
  ageBand: string;
  gender: 'male' | 'female';
  annualMortalityPer1000: number;
  source: string;
}

// ── Claims Costs ───────────────────────────────────────────────────

export interface ClaimsCostData {
  market: Market;
  avgAnnualPremium: number;
  claimsRatio: number;
  avgSumAssured: number;
  avgAnnualClaimCostHealth: number;
  hospitalizationCostPerDay: number;
  source: string;
}

// ── Dose-Response ──────────────────────────────────────────────────

export interface DoseResponsePoint {
  dailySteps: number;
  hazardRatio: number;
  hazardRatioLow: number;
  hazardRatioHigh: number;
}

export interface DoseResponseCurve {
  id: string;
  name: string;
  source: string;
  sampleSize: number;
  points: DoseResponsePoint[];
}

// ── Behavioural Archetypes ─────────────────────────────────────────

export type DecayCurve = 'none' | 'fast' | 'gradual' | 'slow';
export type AgeSkew = 'younger' | 'older' | 'neutral';

export interface BehaviouralArchetype {
  id: string;
  name: string;
  description: string;
  cohortShareRange: [number, number];
  defaultCohortShare: number;
  stepChangeRange: [number, number];
  stepChangeMean: number;
  stepChangeSD: number;
  persistenceAt12Mo: number;
  persistenceAt36Mo: number;
  ageSkew: AgeSkew;
  decayCurve: DecayCurve;
  sources: string[];
}

// ── Programme Evidence ─────────────────────────────────────────────

export interface ProgrammeEvidencePoint {
  id: string;
  source: string;
  sampleSize: number;
  interventionType: string;
  avgStepIncrease: number;
  participationRate: number;
  persistenceAt12Months: number;
  persistenceAt36Months?: number;
  incentiveType: string;
  incentiveCostPerMember: number;
  notes: string;
}

// ── Population Model Outputs ───────────────────────────────────────

export interface SignalCoverage {
  phoneCount: number;       // people with smartphone → steps
  appCount: number;         // people with health app → self-reported sleep, stress
  wearableCount: number;    // people with wearable → HR, HRV, sleep staging, SpO₂
}

export interface CohortCell {
  ageBand: string;
  gender: 'male' | 'female';
  count: number;
  baselineSteps: Range;
  baselineMortalityPer1000: number;
  signalCoverage: SignalCoverage;
  archetypeBreakdown: Record<string, number>;
}

export interface PopulationCohort {
  market: Market;
  totalSize: number;
  cells: CohortCell[];
  archetypeTotals: Record<string, number>;
  signalCoverageTotals: SignalCoverage;
  summary: {
    avgAge: number;
    avgSteps: Range;
    pctSedentary: Range;
    pctWithPhone: number;
    pctWithApp: number;
    pctWithWearable: number;
  };
  sources: string[];
}

// ── Behaviour Model Outputs ────────────────────────────────────────

export interface ArchetypeBehaviourResult {
  archetypeId: string;
  archetypeName: string;
  count: number;
  baselineSteps: number;
  stepChange: Range;
  projectedSteps: Range;
  persistingAtHorizon: Range;
  monthlyEngagement: number[];
}

export interface CellBehaviourResult {
  ageBand: string;
  gender: 'male' | 'female';
  totalCount: number;
  archetypes: ArchetypeBehaviourResult[];
  weightedStepChange: Range;
  weightedPersistence: Range;
  effectiveParticipants: Range;
}

export interface BehaviourModelOutput {
  byCellAndArchetype: CellBehaviourResult[];
  totalEffectiveParticipants: Range;
  totalWeightedStepChange: Range;
  archetypeSummary: ArchetypeBehaviourResult[];
  sources: string[];
  explanation: string;
}

// ── Health Impact Outputs ──────────────────────────────────────────

export interface ArchetypeHealthImpact {
  archetypeId: string;
  count: number;
  stepChange: Range;
  hazardRatioBaseline: number;
  hazardRatioProjected: Range;
  relativeRiskReduction: Range;
  avoidedDeaths: Range;
  morbidityReduction: Range;
}

export interface CellHealthImpact {
  ageBand: string;
  gender: 'male' | 'female';
  baselineAnnualDeaths: number;
  archetypeImpacts: ArchetypeHealthImpact[];
  totalAvoidedDeaths: Range;
  totalMorbidityReduction: Range;
}

/** Per-signal pathway contribution to total health value */
export interface SignalPathwayValue {
  signal: string;
  label: string;
  source: string;
  cohortCovered: number;
  pctOfCohort: number;
  avoidedDeaths: Range;
  morbidityReduction: Range;
  pctOfTotalValue: number;
}

export interface HealthImpactOutput {
  byCellAndArchetype: CellHealthImpact[];
  totals: {
    avoidedDeaths: Range;
    mortalityReductionPct: Range;
    morbidityReductionPct: Range;
    archetypeContribution: { id: string; name: string; pctOfTotalValue: number }[];
  };
  /** Breakdown of health value by signal pathway — shows what each signal contributes */
  signalPathways: SignalPathwayValue[];
  sources: string[];
  explanation: string;
}

// ── Financial Outputs ──────────────────────────────────────────────

export interface ArchetypeROI {
  id: string;
  name: string;
  count: number;
  grossValue: Range;
  rewardCost: Range;
  netValue: Range;
  roiMultiple: Range;
}

export interface MonthlyProjection {
  month: number;
  savings: Range;
  cumulativeSavings: Range;
  rewardCost: number;
  netValue: Range;
  activeParticipants: number;
}

export interface FinancialResult {
  grossClaimsSavings: Range;
  crossSellUplift: Range;
  lapseReduction: Range;
  grossTotalValue: Range;
  affordableRewardBudget: Range;
  rewardPerMemberPerMonth: Range;
  netROI: Range;
  roiMultiple: Range;
  paybackMonths: Range;
  breakdown: {
    lifeMortalitySavings: Range;
    healthMorbiditySavings: Range;
    lapseValueRetained: Range;
  };
  archetypeROI: ArchetypeROI[];
  monthlyProjection: MonthlyProjection[];
  sources: string[];
  explanation: string;
}

// ── Per-Campaign Simulation Result ───────────────────────────────

export interface CampaignSimulationResult {
  campaignId: string;
  campaignName: string;
  metric: HealthMetric;
  /** Eligible cohort after signal filtering */
  eligibleCohort: number;
  /** Archetype shares adapted for this metric */
  archetypeShares: Record<string, number>;
  behaviour: BehaviourModelOutput;
  health: HealthImpactOutput;
  /** Per-campaign financial impact before combination */
  perCampaignSavings: Range;
  perCampaignMorbiditySavings: Range;
  sources: string[];
}

// ── Multi-Campaign Combined Output ───────────────────────────────

export interface MultiCampaignOutput {
  campaigns: CampaignSimulationResult[];
  combined: {
    overlapDiscount: number;
    grossClaimsSavings: Range;
    grossTotalValue: Range;
    affordableRewardBudget: Range;
    rewardPerMemberPerMonth: Range;
    netROI: Range;
    roiMultiple: Range;
    paybackMonths: Range;
  };
  sensitivity: SensitivityOutput;
}

// ── Sensitivity Analysis ─────────────────────────────────────────

export interface SensitivityVariable {
  id: string;
  label: string;
  baseValue: number;
  lowScenario: number;
  highScenario: number;
  impactOnROI: { low: number; high: number };
}

export interface SensitivityOutput {
  variables: SensitivityVariable[];
  breakeven: {
    minImprovementRate: number;
    minParticipationRate: number;
  };
  scenarios: {
    conservative: Range;
    central: Range;
    optimistic: Range;
  };
}

// ── Full Simulation Output ─────────────────────────────────────────

export interface SimulationOutput {
  cohort: PopulationCohort;
  multiCampaign: MultiCampaignOutput;
  financials: FinancialResult;
  narrative: string;
  config: SimulationConfig;
}

// ── Evidence ───────────────────────────────────────────────────────

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
  /** Optional: links this citation to a specific health metric */
  metricKey?: string;
}

// ── Simulation Run State ───────────────────────────────────────────

export type RunState = 'idle' | 'running' | 'complete' | 'error';
export type RunStep = 'population' | 'activity' | 'behaviour' | 'health' | 'claims' | 'economics';

// ── Chapter Navigation ───────────────────────────────────────────

export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
