// ---------------------------------------------------------------------------
// Domain types (shared between server engine and frontend)
// ---------------------------------------------------------------------------
// NOTE: Drizzle table definitions live in shared/tables.ts (server-only).
// This file is safe to import from the Vite-bundled client.
// ---------------------------------------------------------------------------

// Re-export table types so server code that imports from schema.ts still works
export type { InsertUser, User, InsertRun, Run, InsertScenario, InsertBacktest, Backtest, InsertEvidenceCollectionRecord, EvidenceCollectionRecord, InsertSegmentUpload, InsertModelInputVersion, InsertAuditEvent } from "./tables";
// Types also used by client components
export type { Scenario, SegmentUpload, ModelInputVersion, AuditEvent } from "./tables";

export type Market = "HK" | "SG";
export type SignalId = string;
/** @deprecated Use SignalId. Kept for one release while legacy components migrate. */
export type CampaignType = SignalId;

export type EvidenceTier = "Proven" | "Emerging" | "Experimental";
export type TrustTier = "High" | "Medium" | "Low";

export const HP_PER_USD = 100;
export const USD_PER_HP = 0.01;

export type SignalCategory =
  | "movement"
  | "cardio_autonomic"
  | "respiratory"
  | "sleep_recovery"
  | "metabolic"
  | "mind";

export interface DoseResponse {
  effectP50: number;
  effectCI: [number, number];
  unit: string;
}

export interface SignalDef {
  signalId: SignalId;
  displayName: string;
  category: SignalCategory;
  dataSources: string[];
  trustCeiling: TrustTier;
  evidenceTier: EvidenceTier;
  behaviourLever: string;
  doseResponse: DoseResponse | null;
  claimsPathway: string;
  evidenceSources: Citation[];
  attributionConfidence: number;
  probeReward: number;
  outcome: string;
  doseLabel: string;
  doseKind: "steplift" | "intensity";
  shortName: string;
}

export interface FusionDef {
  fusionId: SignalId;
  displayName: string;
  components: { signalId: SignalId; weight: number }[];
  evidenceTier: EvidenceTier;
  corroboration: boolean;
  rationale: string;
}

// ---------------------------------------------------------------------------
// Per-campaign metric vocabulary. ONE source of truth so the hero strip,
// narrative and scan all describe the campaign's OWN primary outcome — never
// a steps metric on a cardio/sleep/screening campaign.
//   - `outcome`        : short noun phrase for the clinical target
//   - `doseLabel`      : label for the achieved-dose stat shown in the hero
//   - `doseKind`       : "steplift" => use meanStepLift (+N/day); "intensity"
//                        => use meanEffortIntensity rendered as adherence %
//   - `shortName`      : compact name for chips / shortlist cards
// ---------------------------------------------------------------------------
export interface CampaignMetric {
  shortName: string;
  outcome: string;
  doseLabel: string;
  doseKind: "steplift" | "intensity";
}

export const CAMPAIGN_METRIC: Record<string, CampaignMetric> = {
  steps: {
    shortName: "Step challenge",
    outcome: "daily step count",
    doseLabel: "mean step lift",
    doseKind: "steplift",
  },
  vo2max: {
    shortName: "VO2max / Zone-2 cardio",
    outcome: "cardiorespiratory fitness",
    doseLabel: "mean Zone-2 adherence",
    doseKind: "intensity",
  },
  sleep: {
    shortName: "Sleep regularity",
    outcome: "sleep-schedule consistency",
    doseLabel: "mean sleep-routine adherence",
    doseKind: "intensity",
  },
  bp_screening: {
    shortName: "BP screening + control",
    outcome: "blood-pressure control",
    doseLabel: "mean treatment adherence",
    doseKind: "intensity",
  },
  hba1c_screening: {
    shortName: "HbA1c screening",
    outcome: "glycaemic control",
    doseLabel: "mean management adherence",
    doseKind: "intensity",
  },
};

export interface IncentiveDesign {
  configured: boolean;
  rewardPmpm: number;
  adminCostPmpm: number;
  platformCostPmpm: number;
}

export interface RewardStrategyConfig {
  objective: "balanced" | "attract_users" | "reduce_morbidity" | "reduce_mortality" | "max_net_value" | "max_persistency";
  budgetPmpm?: number;
}

export interface LifeAssumptionOverrides {
  baselineAnnualMortalityRate?: number;
  sumAssured?: number;
  annualPremium?: number;
  morbidityValuePctOfMortality?: number;
  acquisitionValuePerNewVerifiedMember?: number;
  maxLapseImprovement?: number;
}

// NOTE: the first scenario pass can run without incentive economics. In that
// mode `assumedOfferPmpm` is only the member-agent offer context. ROI is
// available only when an explicit IncentiveDesign is supplied.
export interface ResolvedPlan {
  signals: SignalId[];
  fusion?: SignalId;
  primarySignal: SignalId;
  campaign: CampaignType;
  campaignLabel: string;
  signalDefinitions?: SignalDef[];
  fusionDefinition?: FusionDef;
  market: Market;
  marketLabel: string;
  bookSize: number;
  horizonMonths: number;
  sampleSize: number;
  objective: string; // human-readable goal restatement
  probeReward: number;
  probeRewardHp: number;
  // USD/member/month offer context shown to member-agents. When incentive
  // economics are configured, this equals the selected reward; otherwise it is
  // derived from the reward strategy budget or the default planning assumption.
  assumedOfferPmpm: number;
  // When true, the campaign is offered only to the high-/moderate-risk tiers
  // (least-active members) instead of the whole book: costs shrink to the
  // targeted fraction and claims tiers renormalize to the targeted pool.
  targetHighRisk?: boolean;
  incentiveDesign?: IncentiveDesign;
  parseMode?: "llm" | "heuristic";
  llmModel?: string;
  fallbackReason?: string;
}

export interface MemberAgent {
  id: number;
  age: number;
  ageBand: string;
  sex: "M" | "F";
  baselineSteps: number;
  mortalityPer1k: number;
  wearableOwner: boolean;
  // latent traits 0..1
  motivation: number;
  conscientiousness: number;
  timePressure: number;
  techSavvy: number;
  healthAnxiety: number;
  // financial pressure proxy
  financialPressure: number;
  // diversity dimensions (v2) — give the LLM distinct material per persona
  occupation: string;
  district: string;
  family: string;
  healthHistory: string;
  attitude: string;
  // socio-economic band implied by the occupation; keeps district, financial
  // pressure and wearable ownership coherent. Optional for older saved runs.
  incomeBand?: "low" | "middle" | "high";
  personaBlurb: string;
  // Synthetic-RCT reward arm: when set, THIS agent is offered this reward
  // (PMPM) instead of the run-level offer, so the dose-response curve can be
  // fit through observed arm engagement instead of stated sensitivities.
  armRewardPmpm?: number;
}

export type Decision = "enrolled" | "engaged" | "dropped" | "nonstarter";

export interface AgentDecision {
  agentId: number;
  decision: Decision;
  enrolled: boolean;
  weeksEngaged: number;
  persisted12mo: boolean;
  avgStepIncrease: number;
  // Campaign-agnostic adherence intensity (0..1): how hard THIS engaged member
  // actually worked the target behaviour (e.g. Zone-2 sessions/wk for VO2,
  // medication+monitoring adherence for BP, sleep-schedule consistency, step
  // effort). 0 if not engaged. This drives the dose-response for EVERY campaign
  // so the health effect reflects what agents did, not a static assumption.
  effortIntensity: number;
  // reward sensitivity (0..1): how much THIS member's enrollment depends on a
  // higher reward — used to build the population reward->engagement curve.
  rewardSensitivity: number;
  // Raw model-stated probabilities BEFORE the bernoulli draw. Kept so population
  // aggregates can use the smooth agent-level signal (heterogeneity, reward-
  // response shape) instead of only the realized coin flips.
  enrollLikelihood?: number;
  persistLikelihood?: number;
  // The reward this agent was actually shown (its synthetic-RCT arm when arms
  // are active; otherwise the run-level offer).
  armRewardPmpm?: number;
  reasoning: string;
  agent: MemberAgent;
  mode: "llm" | "heuristic";
  fallbackReason?: string;
}

// Agent-derived subgroup response — who the campaign actually moves.
export interface BehaviorSegment {
  id: string;
  label: string;
  n: number;
  enrollmentRate: number;
  engagedRate: number;
  meanRewardSensitivity: number;
}

// Agent-derived shape of the reward→engagement curve, expressed as ratios of
// the engaged level: floorShare = engagement retained if the reward went to
// zero (money-indifferent members), capShare = engagement reachable if money
// stopped being the constraint. Derived from per-agent enroll likelihoods ×
// reward sensitivities — NOT from hardcoded curve constants.
export interface RewardCurveShape {
  floorShare: number;
  capShare: number;
}

// One randomized reward arm of the synthetic RCT: a subset of agents who all
// saw the SAME reward. The $0 arm directly measures intrinsic motivation —
// members who engage with no cash on the table (health goals + the companion
// experience alone). Observed arm rates let the dose-response curve be fit
// through real points instead of stated sensitivities.
export interface DoseResponseArm {
  rewardPmpm: number;
  n: number;
  enrollmentRate: number;
  engagedRate: number;
  engagedCI: [number, number];
  isOfferArm: boolean;
}

export interface BehaviorRates {
  enrollmentRate: number;
  enrollmentCI: [number, number];
  persistenceRate: number; // among enrolled, persisted to 12mo
  persistenceCI: [number, number];
  meanStepLift: number; // among engaged (steps campaigns only; 0 otherwise)
  stepLiftCI: [number, number];
  // Mean campaign-agnostic adherence intensity (0..1) among engaged members.
  // Drives the dose-response for all campaign types.
  meanEffortIntensity: number;
  effortIntensityCI: [number, number];
  meanWeeksEngaged: number;
  // share of the FULL sample who meaningfully changed behaviour (the hero %)
  behaviorChangeRate: number;
  behaviorChangeCI: [number, number];
  meanRewardSensitivity: number;
  sampleSize: number;
  archetypeMix: { decision: Decision; count: number; pct: number }[];
  // Agent-derived heterogeneity (optional; populated by aggregateBehavior)
  segments?: BehaviorSegment[];
  rewardCurveShape?: RewardCurveShape;
  // Observed synthetic-RCT reward arms (present when the run was large enough
  // to randomize agents across reward levels). Headline rates above are the
  // OFFER arm only; these points carry the observed dose-response.
  doseResponseArms?: DoseResponseArm[];
}

// ---------------------------------------------------------------------------
// Calibration: the explicit step that nudges emergent agent rates toward
// published anchors so the LEVELS are grounded, not free-floating.
// ---------------------------------------------------------------------------
export interface CalibrationAnchor {
  metric: string;
  rawValue: number; // emergent value from the raw agent sample
  anchorLow: number;
  anchorHigh: number;
  calibratedValue: number; // posterior value after blending with the prior
  source: string;
  referenceClass?: string;
  legacyAnchorLow?: number;
  legacyAnchorHigh?: number;
  // Bayesian blend detail (v0.3): agent evidence vs literature prior.
  rawCI?: [number, number]; // sample CI around the raw agent value
  posteriorCI?: [number, number]; // CI of the blended posterior
  priorWeight?: number; // weight the PRIOR carried in the blend (0..1), derived from precisions
  divergenceZ?: number; // standardized distance between agent evidence and prior
  diverges?: boolean; // true when agents materially disagree with the literature
}

export interface CalibrationReport {
  method: string;
  shrinkage: number; // mean weight placed on the published prior across metrics (0..1)
  // prior-trust dial used for this run: 1 = full literature prior precision,
  // 0 = agents only (prior ignored). Surfaced so the blend is auditable.
  priorTrust?: number;
  // Plain-language findings where the agent sample materially disagrees with
  // the literature prior. Surfaced as insight, never silently shrunk away.
  divergenceFindings?: string[];
  effectiveSampleSize?: number;
  referenceClass?: string;
  referenceClasses?: {
    id: string;
    label: string;
    active: boolean;
    evidenceScope: string;
    anchors: {
      metric: string;
      low: number;
      high: number;
      source: string;
    }[];
  }[];
  anchors: CalibrationAnchor[];
}

// ---------------------------------------------------------------------------
// Reward -> Engagement saturating response & ROI optimisation
// ---------------------------------------------------------------------------
export interface ResponseCurvePoint {
  reward: number; // USD/member/month
  engagement: number; // effective engaged fraction of the book
}

export interface RewardRoiPoint {
  reward: number; // USD/member/month
  rewardHp: number; // Health Points/member/month
  engagement: number; // engaged fraction of the book (0..1)
  behaviorChange: number; // fraction of members who meaningfully improve (0..1)
  members: number; // absolute count meaningfully improving
  claimsSaved: number; // USD clinical claims savings at this reward
  productivityValue: number; // USD group productivity value at this reward (0 for individual books)
  retentionValue: number; // USD lapse/retention value at this reward
  mortalityValue?: number; // USD life-book mortality-margin value at this reward
  valueCreated: number; // USD total value = claims + productivity + retention + mortality at this reward
  rewardToSustain: number; // USD total reward spend implied to sustain this point
  adminCost: number; // USD admin / operations cost
  platformCost: number; // USD HealthID/platform cost
  totalCost: number; // USD reward + admin + platform
  netValue: number; // USD valueCreated - totalCost
  roi: number; // netValue / totalCost (deterministic median-params)
  // ROI as a RATIO (net/cost) — Monte Carlo percentiles at this reward level
  roiP50: number;
  roiP5: number;
  roiP95: number;
  // net value in USD — Monte Carlo percentiles at this reward level (chart band)
  netValueP5: number;
  netValueP95: number;
}

export interface RewardOptimization {
  // saturating response curve params (engagement = floor + (cap-floor)*(1-exp(-k*reward)))
  floor: number;
  cap: number;
  k: number;
  // provenance of the curve shape: observed randomized reward arms (synthetic
  // RCT), per-agent stated decisions, or fallback constants
  shapeSource?: "observed-arms" | "agent-derived" | "fallback-heuristic";
  responseCurve: ResponseCurvePoint[];
  roiCurve: RewardRoiPoint[];
  // reward where value created per reward dollar is most efficient (ROI-max point)
  // illustrative anchor: the lowest SIGNIFICANT reward that already captures most of
  // the achievable value. This is NOT a per-campaign mandate — it marks where the
  // "works well" band begins. The story is the curve + the band, not this single point.
  optimalReward: number;
  optimalRoi: number; // net value at that reward point
  recommendedRewardIndex: number; // index into roiCurve at the band's lower edge (slider default)
  // "WORKS-WELL" BAND: contiguous range of significant rewards where value created stays
  // strong (>=80% of peak). This is the headline conclusion — bigger rewards generally
  // work across this whole zone; the user picks a point in it based on budget/strategy.
  workWellRange: [number, number] | null;
  // reward range where gross value clears all costs
  viableRewardRange: [number, number] | null;
  // reward back-calculated to SUSTAIN the engagement the agents actually produced
  derivedReward: number;
  derivedRewardHp: number;
  derivedRewardLow: number;
  derivedRewardHigh: number;
  derivedEngagement: number;
}

export interface Distribution {
  values: number[]; // raw MC samples (subsampled for transport)
  histogram: { x: number; count: number }[];
  p5: number;
  p50: number;
  p95: number;
  mean: number;
}

export interface TornadoBar {
  factor: string;
  low: number;
  high: number;
  swing: number;
}

// Transparent breakdown of how the headline claims-savings number is built,
// surfaced behind a click-to-expand on the value figure.
export interface ClaimsBreakdown {
  engagedMembers: number; // members who meaningfully changed behaviour
  effectiveTreated: number; // persisting + partially-credited members
  baselineClaimsPerMember: number; // annual baseline claims per member (USD)
  doseResponsePct: number; // achieved dose/adherence factor retained for backward-compatible UI code
  claimsSavings: number; // claims bridge PV savings, not mortality RR applied to claims baseline
  productivityValue?: number;
  annualClaimsDeltaPerTreated?: number; // claims-denominated annual saving per applicable treated member
  applicablePrevalence?: number; // share of treated members with the relevant claims pathway
  attributionFactor?: number; // causal / counterfactual haircut
  doseAchievement?: number; // achieved share of the evidence-backed dose
  evidenceHorizonYears?: number;
  valuationHorizonYears?: number;
  discountRatePct?: number;
  presentValueFactor?: number;
  faderPartCreditPct?: number;
  claimsBridgeSource?: string;
  claimsTierBreakdown?: {
    tier: string;
    weight: number;
    annualClaims: number;
    annualDelta: number;
    savings: number;
  }[];
  // retention/lapse value, shown as a separate evidence line
  persistingMembers: number;
  lapseReductionPct: number; // fractional reduction in policy lapse (0..1)
  ltvPerMember: number; // member lifetime value (USD)
  retentionValue: number; // = persistingMembers * lapseReduction * ltv
  // life-book mortality margin: avoided death-claim payouts from the activity-
  // mortality gradient (Paluch 2022), attribution-haircut like the claims bridge
  mortalityValue?: number;
  mortalityDetail?: {
    baselineAnnualMortalityRate: number;
    sumAssured: number;
    relativeMortalityReduction: number; // achieved relative reduction (0..1)
    attributionFactor: number;
    highRiskRelativity: number; // mortality relativity applied when targeting
    source: string;
  };
  // share of reward face value the insurer actually funds (breakage/partner)
  rewardCostRatio?: number;
  // years persisting members' claims savings are valued over (PV-capped)
  persistedSavingsYears?: number;
  targetHighRisk?: boolean;
  targetedFraction?: number; // share of the book in the targeted tiers
  totalValue: number; // claims + productivity + retention + mortality
  rewardCost: number;
  adminCost: number;
  platformCost: number;
  totalCost: number;
  costBasis?: {
    reward: string;
    admin: string;
    platform: string;
    rewardMembers: number;
    adminMembers: number;
    platformMembers: number;
    months: number;
  };
  netValue: number;
  roi: number;
}

export interface MonteCarloResult {
  seed: number;
  iterations: number;
  // how many reward levels the MC sweeps each iteration (for the value=f(reward) curve)
  rewardLevelsSwept: number;
  // total chain scenarios evaluated this run = iterations * (1 assumed-offer context + rewardLevelsSwept)
  scenariosExplored: number;
  // HERO: behaviour change — fraction of members who meaningfully improved
  behaviorChange: Distribution; // fraction 0..1 across the full book
  behaviorChangeMembers: Distribution; // absolute member count
  grossValue: Distribution; // USD — claims + productivity + retention + mortality
  netRoi: Distribution; // USD — gross value minus reward/admin/platform costs
  netValue: Distribution; // alias for netRoi for clearer new UI code
  claimsSavings: Distribution; // USD, clinical claims savings only
  // value separation (P50)
  claimsSavingsP50: number; // clinical claims savings
  retentionValueP50: number; // lapse/retention value
  mortalityValueP50?: number; // life-book mortality margin value
  valueCreatedP50: number; // claims + productivity + retention + mortality
  rewardToSustainP50: number;
  adminCostP50: number;
  platformCostP50: number;
  totalCostP50: number;
  netValueP50: number;
  roiP50: number;
  roiP5: number;
  roiP95: number;
  downsideProbability: number;
  effectiveSampleSize?: number;
  calibrationWeight?: number;
  economicsConfigured: boolean;
  incentiveDesign?: IncentiveDesign;
  maxAllInCostP50: number;
  maxRewardPmpmP50: number;
  roiAvailable: boolean;
  hpPerUsd?: number;
  evidenceCollectionCount?: number;
  // full breakdown of the headline value figure for the click-through
  claimsBreakdown: ClaimsBreakdown;
  rewardOptimization: RewardOptimization;
  tornado: TornadoBar[];
  guardrails: GuardrailFlag[];
}

export interface GuardrailFlag {
  level: "info" | "warn" | "critical";
  message: string;
}

export interface Citation {
  key: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi: string;
  finding: string;
}

// Methodology / audit payload exposed to the UI
export interface DoseResponseParam {
  campaign: CampaignType;
  label: string;
  effectP50: number; // central fractional claims/mortality reduction
  effectCI: [number, number];
  effectUnit?: string;
  source: string;
}

export interface ModelModuleMetadata {
  moduleName: string;
  moduleVersion: string;
  assumptionSetVersion?: string;
  evidenceScope?: string;
}

export type VerificationGrade =
  | "self_reported"
  | "device_reported"
  | "source_attested"
  | "multi_signal_checked"
  | "zero_custody_verified";

export type RewardArchetype =
  | "points_status"
  | "cash_equivalent"
  | "premium_discount"
  | "device_financing"
  | "lottery"
  | "social_team_challenge"
  | "clinical_follow_up"
  | "charity_reward";

export interface RewardOption {
  id: string;
  label: string;
  archetype: RewardArchetype;
  insurerCostPmpm: number;
  memberPerceivedValuePmpm: number;
  timing: "instant" | "weekly" | "monthly" | "annual";
  requiresWearable: boolean;
  verificationRequirement: VerificationGrade;
}

export interface PopulationSegmentForAllocation {
  id: string;
  label: string;
  memberCount: number;
  mortalityRiskIndex: number;
  lapseRiskIndex: number;
  morbidityRiskIndex?: number;
  modifiabilityIndex: number;
  wearableOwnershipRate: number;
  dataSharingWillingness: number;
  rewardSensitivity: number;
  evidenceScope: string;
}

export interface CohortPriorityScore {
  cohortId: string;
  valueAtRiskScore: number;
  behaviorChangePotentialScore: number;
  incentiveFitScore: number;
  verificationConfidenceScore: number;
  economicEfficiencyScore: number;
  compositeScore: number;
  priorityBand: "target_aggressively" | "test_or_clinical_pathway" | "low_cost_engagement" | "do_not_overpay";
}

export interface CohortRewardAllocation {
  cohortId: string;
  rewardOptionId: string;
  rewardLabel?: string;
  cashValuePmpm?: number;
  deliveryMechanic?: string;
  expectedEnrolmentLift: number;
  expectedPersistenceLift: number;
  expectedSignalQualityLift: number;
  expectedCost: number;
  rationale: string;
}

export interface CohortRewardAllocationResult {
  priorityScores: CohortPriorityScore[];
  allocations: CohortRewardAllocation[];
  unallocatedCohorts: { cohortId: string; reason: string }[];
  totalExpectedCost: number;
}

export interface RewardStrategyExplanation {
  mode: "llm" | "deterministic";
  summary: string;
  rationale: string[];
  boundedVariants: {
    name: string;
    objective: RewardStrategyConfig["objective"];
    budgetPmpm?: number;
    expectedTradeoff: string;
  }[];
  caveats: string[];
}

export interface WearableSignalTier {
  signal: string;
  tier: string;
  memberCount: number;
  mortalityRelativity: number;
  verificationGrade: VerificationGrade;
  evidenceGrade: "A" | "B" | "C" | "D" | "E";
}

export interface LifeInsuranceValueResult {
  mortalitySegmentationValue: number;
  expectedClaimsReduction: number;
  acquisitionValue: number;
  morbidityValue: number;
  lapsePersistencyValue: number;
  rewardCost: number;
  netValue: number;
  grossValue: number;
  evidenceGrade: "A" | "B" | "C" | "D" | "E";
  caveats: string[];
}

export interface MethodologyReport {
  chain: string[];
  monteCarloIterations: number;
  doseResponse: DoseResponseParam[];
  calibration: CalibrationReport;
  assumptions?: AssumptionItem[];
  pendingAssumptionOverrides?: AssumptionItem[];
  selectedSegmentSet?: {
    id: string;
    name: string;
    source: string;
    rowCount: number;
  };
  selectedLifeAssumptionSet?: {
    id: string;
    name: string;
    source: string;
  };
  modelRegistryVersion?: string;
  modelModules?: ModelModuleMetadata[];
  rewardStrategy?: RewardStrategyConfig;
  rewardAllocation?: CohortRewardAllocationResult;
  rewardStrategyExplanation?: RewardStrategyExplanation;
  lifeInsuranceValue?: LifeInsuranceValueResult;
  seed?: number;
  runMode?: "llm" | "heuristic" | "mixed";
  // agent-derived segment response stats and reward-curve shape (raw, pre-calibration)
  behaviorSegments?: BehaviorSegment[];
  rewardCurveShape?: RewardCurveShape;
  // observed synthetic-RCT reward arms (raw, pre-calibration), when arms ran
  doseResponseArms?: DoseResponseArm[];
  caveat: string;
}

export interface AssumptionItem {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  source: string;
  geography: string;
  editable: boolean;
}

// Plain-English written brief generated from the run's real numbers: what the
// simulation found and what the insurer should do about it.
export interface NarrativeReport {
  // one-line headline a busy exec can read in 2 seconds
  headline: string;
  // 2-4 sentence plain-English explanation of what happened and why
  summary: string;
  // the actionable recommendation (set/hold/raise reward, proceed/pilot/hold)
  recommendation: string;
  // overall verdict drives the colour of the chip
  verdict: "do-not-proceed" | "needs-more-evidence" | "pilot-only" | "proceed-with-constraints" | "scale";
  // 2-4 short bullet drivers behind the verdict
  drivers: string[];
  // honest confidence note (where the estimate is soft)
  confidence: string;
  // the reward (USD/member/YEAR) every number in this read-out was computed at
  atRewardPerYear?: number;
  // the same reward in the canonical display unit (USD/member/MONTH)
  atRewardPmpm?: number;
}

// ---------------------------------------------------------------------------
// Growth simulation — the commercial clock, kept deliberately separate from
// the actuarial book-health ROI. Models additional buying (riders, top-ups,
// second products) and program-driven new business; never carrier switching.
// ---------------------------------------------------------------------------

export type UpsellProduct = "ci_rider" | "top_up" | "savings_plan" | "none";

export interface GrowthDecision {
  agentId: number;
  engagement: Decision; // what this member did in the wellness programme
  upsellLikelihood: number; // 0..1 chance of buying additional cover in 12mo
  upsellProduct: UpsellProduct;
  boughtUpsell: boolean; // seeded Bernoulli draw
  referralLikelihood: number; // 0..1 chance of actively recommending
  expectedReferrals: number; // people they'd realistically mention it to (0-3)
  referralsMade: number; // drawn
  reasoning: string;
  agent: MemberAgent;
  mode: "llm" | "heuristic";
  fallbackReason?: string;
}

export interface GrowthBehavior {
  sampleSize: number;
  engagedShare: number; // share of sample who engaged in the programme
  upsellRateEngaged: number; // among engaged members
  upsellRateEngagedCI: [number, number];
  upsellRateOther: number; // among everyone else (organic baseline)
  referralRate: number; // share of engaged making >=1 referral
  referralsPerEngaged: number; // mean mentions among engaged
  productMix: { product: UpsellProduct; count: number; pct: number }[];
}

export type GrowthChannelId = "upsell" | "referral" | "program_led";

export interface GrowthChannel {
  id: GrowthChannelId;
  label: string;
  policies: number; // book-scaled new policies / riders over the horizon
  annualPremium: number; // total new annual premium (USD)
  newBusinessValue: number; // policies × premium × VNB margin
  acquisitionCost: number; // total CAC for this channel
  cacPerPolicy: number;
  netValue: number;
  evidence: string; // evidence tier + source tag
}

export interface GrowthQuarter {
  quarter: number; // 1-based
  rewardCost: number;
  upsellValue: number; // net of channel CAC
  referralValue: number;
  programLedValue: number;
  newPolicies: number;
  netCash: number;
  cumulativeNetCash: number;
}

export interface GrowthAssumptionItem {
  key: string;
  label: string;
  value: string;
  source: string;
  tier: EvidenceTier;
}

export interface GrowthResult {
  bookSize: number;
  market: Market;
  horizonQuarters: number;
  rewardPmpm: number;
  enrolledShare: number;
  engagedShare: number;
  channels: GrowthChannel[];
  quarters: GrowthQuarter[];
  paybackQuarter: number | null; // first quarter cumulative net cash >= 0
  totalNewPolicies: number;
  totalNewAnnualPremium: number;
  totalRewardCost: number;
  netValueP5: number;
  netValueP50: number;
  netValueP95: number;
  downsideProbability: number; // fraction of MC draws with negative net value
  iterations: number;
  assumptions: GrowthAssumptionItem[];
  caveat: string;
}

// SSE stream event envelope
export type StreamEvent =
  | { type: "plan"; plan: ResolvedPlan; thought: string }
  | { type: "thought"; text: string }
  | { type: "mode"; mode: "llm" | "heuristic" | "mixed"; message: string }
  | { type: "population_init"; total: number; sampleSize: number; wearablePct: number }
  | { type: "agent_spawned"; agent: MemberAgent }
  | { type: "agent_decision"; decision: AgentDecision; completed: number; total: number }
  | { type: "behavior"; rates: BehaviorRates }
  | { type: "calibration"; report: CalibrationReport; rates: BehaviorRates }
  | { type: "critique"; text: string }
  | { type: "reward_optimization"; optimization: RewardOptimization }
  | { type: "montecarlo"; result: MonteCarloResult }
  | { type: "methodology"; report: MethodologyReport }
  | { type: "narrative"; report: NarrativeReport }
  | { type: "growth_decision"; decision: GrowthDecision; completed: number; total: number }
  | { type: "growth_behavior"; behavior: GrowthBehavior }
  | { type: "growth_result"; result: GrowthResult }
  | { type: "done"; runId: string }
  | { type: "error"; message: string };
