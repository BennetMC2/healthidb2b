import type {
  AgentDecision,
  AssumptionItem,
  BehaviorRates,
  CalibrationReport,
  CampaignType,
  ClaimsBreakdown,
  Distribution,
  GuardrailFlag,
  IncentiveDesign,
  Market,
  MemberAgent,
  MonteCarloResult,
  NarrativeReport,
  PopulationSegmentForAllocation,
  ResolvedPlan,
  RewardOption,
  RewardOptimization,
  RewardRoiPoint,
  TornadoBar,
  VerificationGrade,
  WearableSignalTier,
  CohortRewardAllocationResult,
  LifeInsuranceValueResult,
} from "@shared/schema";

export type EvidenceGrade = "A" | "B" | "C" | "D" | "E";
export type EvidenceScope = "global" | "regional" | "country" | "product" | "client" | "illustrative";

export interface ModelModule {
  moduleName: string;
  moduleVersion: string;
}

export interface ModuleRunMetadata {
  moduleName: string;
  moduleVersion: string;
  assumptionSetVersion?: string;
  evidenceScope?: EvidenceScope;
}

export interface ScenarioResolveInput {
  goal: string;
  sampleSize: number;
}

export interface ScenarioResolver extends ModelModule {
  resolve(input: ScenarioResolveInput): Promise<ResolvedPlan>;
}

export interface PopulationInput {
  market: Market;
  sampleSize: number;
  seed: number;
  globalPersonaLibraryVersion?: string;
  assumptionSetVersion?: string;
}

export interface RepresentativenessDiagnostic {
  metric: string;
  expected: number | string;
  observed: number | string;
  severity: "info" | "warn" | "critical";
}

export interface PopulationResult {
  members: MemberAgent[];
  diagnostics: RepresentativenessDiagnostic[];
  metadata: ModuleRunMetadata;
}

export interface PopulationProvider extends ModelModule {
  generate(input: PopulationInput): PopulationResult;
}

export interface BehaviourDecisionInput {
  plan: ResolvedPlan;
  members: MemberAgent[];
}

export interface BehaviourDecisionResult {
  decisions: AgentDecision[];
  rates: BehaviorRates;
  metadata: ModuleRunMetadata;
}

export interface BehaviourDecisionEngine extends ModelModule {
  decide(input: BehaviourDecisionInput): Promise<BehaviourDecisionResult>;
}

export interface CalibrationInput {
  raw: BehaviorRates;
  campaign: CampaignType;
  market?: Market;
  assumptionSetVersion?: string;
}

export interface CalibrationResult {
  calibrated: BehaviorRates;
  report: CalibrationReport;
  metadata: ModuleRunMetadata;
}

export interface CalibrationModel extends ModelModule {
  calibrate(input: CalibrationInput): CalibrationResult;
}

export interface AssumptionRequest {
  campaign: CampaignType;
  market: Market;
  productType?: string;
  assumptionSetVersion?: string;
}

export interface AssumptionSet {
  assumptions: AssumptionItem[];
  version: string;
  evidenceGrade: EvidenceGrade;
}

export interface AssumptionProvider extends ModelModule {
  load(input: AssumptionRequest): AssumptionSet;
}

export interface RewardResponseInput {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
}

export interface RewardResponseResult {
  floor: number;
  cap: number;
  k: number;
  responseCurve: RewardOptimization["responseCurve"];
  metadata: ModuleRunMetadata;
}

export interface RewardResponseModel extends ModelModule {
  estimate(input: RewardResponseInput): RewardResponseResult;
}

export interface CohortRewardAllocationInput {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  cohorts: PopulationSegmentForAllocation[];
  rewardOptions: RewardOption[];
  budgetPmpm?: number;
  objective: "max_net_value" | "max_mortality_impact" | "max_persistency" | "balanced";
}

export interface CohortRewardAllocator extends ModelModule {
  allocate(input: CohortRewardAllocationInput): CohortRewardAllocationResult;
}

export interface ClaimsBridgeInput {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  claimsBaseline: number;
}

export interface ClaimsBridgeResult {
  claimsBreakdown: ClaimsBreakdown;
  evidenceGrade: EvidenceGrade;
  caveats: string[];
  metadata: ModuleRunMetadata;
}

export interface ClaimsBridgeModel extends ModelModule {
  estimate(input: ClaimsBridgeInput): ClaimsBridgeResult;
}

export interface LifeInsuranceValueInput {
  bookSize: number;
  sumAssured?: number;
  annualPremium?: number;
  horizonYears: number;
  signalTiers: WearableSignalTier[];
  rewardAllocation?: CohortRewardAllocationResult;
  mortalityImprovementAssumption: [number, number, number];
  lapseImprovementAssumption: [number, number, number];
  assumptionSetVersion?: string;
}

export interface LifeInsuranceValueModel extends ModelModule {
  estimate(input: LifeInsuranceValueInput): LifeInsuranceValueResult;
}

export interface FinancialModelInput {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  iterations?: number;
  seedOverride?: number;
  incentiveDesign?: IncentiveDesign;
}

export interface FinancialModelResult {
  result: MonteCarloResult;
  metadata: ModuleRunMetadata;
}

export interface FinancialModel extends ModelModule {
  calculate(input: FinancialModelInput): FinancialModelResult;
}

export interface UncertaintyModelInput {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  grossValue: Distribution;
  netValue: Distribution;
}

export interface UncertaintyModelResult {
  tornado: TornadoBar[];
  guardrails: GuardrailFlag[];
  metadata: ModuleRunMetadata;
}

export interface VerdictInput {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  finance: MonteCarloResult;
}

export interface VerdictModel extends ModelModule {
  recommend(input: VerdictInput): Promise<NarrativeReport> | NarrativeReport;
}

export interface BacktestObservation {
  originalRunId: string;
  observedPeriodStart: string;
  observedPeriodEnd: string;
  observedPopulation: number;
  observedEnrolmentRate?: number;
  observedPersistenceRate?: number;
  observedStepLift?: number;
  observedRewardCost?: number;
  observedAdminCost?: number;
  observedClaimsPmpm?: number;
  observedRetentionRate?: number;
  dataQuality: EvidenceGrade;
  sourceNotes: string;
}

export interface BacktestResidual {
  metric: string;
  predicted: number;
  observed: number;
  residual: number;
}

export interface BacktestResult {
  residuals: BacktestResidual[];
  validationStatus: "insufficient_data" | "failed" | "mixed" | "passed";
  recommendedUpdates: string[];
  metadata: ModuleRunMetadata;
}

export interface BacktestModel extends ModelModule {
  compare(observation: BacktestObservation): Promise<BacktestResult> | BacktestResult;
}

export type RewardCurvePointWithOutput = RewardRoiPoint;
