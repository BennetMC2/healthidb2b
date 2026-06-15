import type { HealthMetric, CampaignType, CampaignUseCase } from '@/types';
import { calculateActuarialROI, FLOOR_ECONOMICS, type EconomicsConfig } from '@/lib/economics';
import { getSignal } from '@shared/signals';
import { ENGINE_CLAIMS_BRIDGE, ENGINE_ECONOMICS, ENGINE_ASSUMPTION_SET_META, signalToClaimsBridgeKey } from '@shared/engineConstants';

export type ActuaryConfidence = 'high' | 'medium' | 'emerging';

export interface ActuaryInsightOutputs {
  claimsReductionPct: number;
  projectedSavingsUsd: number;
  budgetRoiMultiple: number;
  suggestedHpYield: number;
  morbidityShiftBps: number;
  paybackMonths: number;
}

export interface ActuaryInsight {
  id: string;
  /** Engine signal ID from the shared signal registry */
  signalId: string;
  signal: string;
  campaignName: string;
  title: string;
  subtitle: string;
  body: string;
  behaviourToReward: string;
  healthPointsPricing: {
    suggestedHpPerMember: number;
    maxBudgetUsd: number;
    targetWindow: string;
  };
  confidence: ActuaryConfidence;
  generatedAt: string;
  cohortSize: number;
  cohortFilter: string;
  /** Metric + type used to compute outputs from the actuarial calculator */
  metric: HealthMetric;
  campaignType: CampaignType;
  useCase: CampaignUseCase;
  sourceBreakdown: Array<{ source: string; pct: number }>;
  /** Computed from the actuarial calculator at module init — single source of truth */
  outputs: ActuaryInsightOutputs;
  evidence: {
    literature: Array<{ title: string; journal: string; year: number; doi: string; effectSize: string }>;
    portfolioContext: string;
    counterfactualUsd: number;
    confidenceBreakdown: { credibility: number; causal: number; evidence: number; conservative: number };
  };
  /** Engine claims bridge parameters for this signal (from shared engine constants) */
  engineBridge: {
    annualClaimsDeltaUSD: number;
    annualClaimsDeltaCI: [number, number];
    applicablePrevalence: number;
    attributionFactor: number;
    evidenceHorizonYears: number;
    source: string;
  };
  /** Signal definition from the shared registry */
  engineSignal: {
    evidenceTier: string;
    trustCeiling: string;
    attributionConfidence: number;
    claimsPathway: string;
    doseResponse: { effectP50: number; effectCI: [number, number] } | null;
  };
}

/** Assumption set metadata surfaced in the cockpit */
export const engineAssumptionSetMeta = ENGINE_ASSUMPTION_SET_META;

/** Derive engine bridge and signal data for an insight */
function deriveEngineData(signalId: string) {
  const signal = getSignal(signalId);
  const bridgeKey = signalToClaimsBridgeKey(signalId);
  const bridge = ENGINE_CLAIMS_BRIDGE[bridgeKey];
  return {
    engineBridge: {
      annualClaimsDeltaUSD: bridge.annualClaimsDeltaUSD,
      annualClaimsDeltaCI: bridge.annualClaimsDeltaCI,
      applicablePrevalence: bridge.applicablePrevalence,
      attributionFactor: bridge.attributionFactor,
      evidenceHorizonYears: bridge.evidenceHorizonYears,
      source: bridge.source,
    },
    engineSignal: {
      evidenceTier: signal.evidenceTier,
      trustCeiling: signal.trustCeiling,
      attributionConfidence: signal.attributionConfidence,
      claimsPathway: signal.claimsPathway,
      doseResponse: signal.doseResponse,
    },
  };
}

/** Compute insight outputs from the actuarial calculator (single source of truth).
 *  Uses applyAdjustments: false because baselines are already evidence-aligned
 *  from ENGINE_CLAIMS_BASELINE — no need for the legacy conservatism haircut. */
function computeOutputs(
  eco: EconomicsConfig,
  metric: HealthMetric,
  type: CampaignType,
  useCase: CampaignUseCase,
  cohortSize: number,
  budget: number,
): ActuaryInsightOutputs {
  const result = calculateActuarialROI(eco, {
    metric,
    type,
    useCase,
    maxParticipants: cohortSize,
    budgetCeiling: budget,
    applyAdjustments: false,
  });
  return {
    claimsReductionPct: Number((result.claimsReductionRate * 100).toFixed(1)),
    projectedSavingsUsd: Math.round(result.totalProjectedSavings),
    budgetRoiMultiple: Number(result.budgetROI.toFixed(1)),
    suggestedHpYield: result.suggestedHP,
    morbidityShiftBps: -Math.abs(result.morbidityShiftBps),
    paybackMonths: result.paybackMonths,
  };
}

// Build the insight set for a given Model's economics. Re-priced on model switch
// via buildActuaryInsights(eco); the static `actuaryInsights` export below uses
// the Model-1 floor so non-reactive consumers keep their current numbers.
export function buildActuaryInsights(eco: EconomicsConfig): ActuaryInsight[] {
  return [
  {
    id: 'ins_vo2_activation',
    signalId: 'vo2max',
    signal: 'VO2 Max',
    campaignName: 'Cardio Fitness Activation',
    title: 'Move low-cardio-fitness members toward a healthier risk trajectory',
    subtitle: '3,847 addressable members show low or declining VO2 Max signals, but are still active enough to respond to a structured intervention.',
    body: 'Reward consistent Zone 2 activity and a positive VO2 Max trend over eight weeks. The goal is a small verified improvement in cardio fitness across a large cohort, priced below the expected book-value gain.',
    behaviourToReward: '8 weeks of verified Zone 2 activity consistency plus a positive VO2 Max trend.',
    healthPointsPricing: {
      suggestedHpPerMember: 650,
      maxBudgetUsd: 58000,
      targetWindow: '8 weeks',
    },
    confidence: 'high',
    generatedAt: '2026-05-12T09:14:00+08:00',
    cohortSize: 3847,
    cohortFilter: 'vo2_max_percentile <= 35 AND activity_consistency >= moderate AND age_band BETWEEN 30-55',
    metric: 'vo2_max',
    campaignType: 'stream',
    useCase: 'claims_reduction',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 42 },
      { source: 'Garmin', pct: 28 },
      { source: 'Lab partners', pct: 19 },
      { source: 'Other', pct: 11 },
    ],
    outputs: computeOutputs(eco, 'vo2_max', 'stream', 'claims_reduction', 3847, 58000),
    evidence: {
      literature: [
        {
          title: 'Association of Cardiorespiratory Fitness With Long-term Mortality Among Adults Undergoing Exercise Treadmill Testing',
          journal: 'JAMA Network Open',
          year: 2018,
          doi: '10.1001/jamanetworkopen.2018.3605',
          effectSize: 'Highest fitness associated with substantially lower mortality risk.',
        },
        {
          title: 'Device-measured physical activity and cardiometabolic health',
          journal: 'Nature Medicine',
          year: 2023,
          doi: '10.1038/s41591-023-02373-4',
          effectSize: 'Higher-intensity activity associated with reduced cardiometabolic risk.',
        },
      ],
      portfolioContext: 'This cohort has enough activity baseline to be influenceable, but current VO2 Max trend suggests avoidable cardio-metabolic deterioration.',
      counterfactualUsd: 3100000,
      confidenceBreakdown: { credibility: 92, causal: 78, evidence: 88, conservative: 84 },
    },
    ...deriveEngineData('vo2max'),
  },
  {
    id: 'ins_hrv_recovery',
    signalId: 'hrv',
    signal: 'HRV',
    campaignName: 'HRV Recovery',
    title: 'Intervene before recovery drift becomes claims risk',
    subtitle: '1,204 members show sustained HRV decline paired with rising training stress and inconsistent recovery windows.',
    body: 'Reward recovery behaviours that can be verified without raw data custody: sleep regularity, lighter movement days, and stabilised resting heart rate. The aim is to stop a manageable drift before it becomes a more expensive risk pattern.',
    behaviourToReward: '21 verified recovery days across sleep consistency, lighter activity, and stabilised resting heart rate.',
    healthPointsPricing: {
      suggestedHpPerMember: 520,
      maxBudgetUsd: 36000,
      targetWindow: '60 days',
    },
    confidence: 'medium',
    generatedAt: '2026-05-12T08:51:00+08:00',
    cohortSize: 1204,
    cohortFilter: 'hrv_trend = declining AND recovery_score_delta_45d <= -12 AND activity_status = active',
    metric: 'hrv',
    campaignType: 'stream',
    useCase: 'claims_reduction',
    sourceBreakdown: [
      { source: 'WHOOP', pct: 34 },
      { source: 'Oura', pct: 30 },
      { source: 'Apple Health', pct: 25 },
      { source: 'Other', pct: 11 },
    ],
    outputs: computeOutputs(eco, 'hrv', 'stream', 'claims_reduction', 1204, 36000),
    evidence: {
      literature: [
        {
          title: 'Sleep duration and cardiometabolic risk: a systematic review',
          journal: 'The Lancet Regional Health',
          year: 2023,
          doi: '10.1016/j.lanwpc.2023.100734',
          effectSize: 'Persistent sleep insufficiency associated with elevated cardiometabolic risk.',
        },
      ],
      portfolioContext: 'HRV drift is appearing before claims activity. This is a good candidate for an early intervention campaign rather than retrospective underwriting action.',
      counterfactualUsd: 940000,
      confidenceBreakdown: { credibility: 76, causal: 62, evidence: 71, conservative: 80 },
    },
    ...deriveEngineData('hrv'),
  },
  {
    id: 'ins_sleep_regularly',
    signalId: 'sleep_regularity',
    signal: 'Sleep',
    campaignName: 'Sleep Regularity',
    title: 'Stabilise sleep debt in members drifting toward higher risk',
    subtitle: '2,186 members show persistent sleep debt or irregular sleep timing across the last 45 days.',
    body: 'Reward consistent sleep windows and improved sleep sufficiency, not one-off long sleeps. The commercial case is modest individual improvement at scale: better engagement, better metabolic-risk proxy, and stronger renewal quality.',
    behaviourToReward: '30 nights with verified sleep regularity and at least 6.5 hours average sleep duration.',
    healthPointsPricing: {
      suggestedHpPerMember: 480,
      maxBudgetUsd: 42000,
      targetWindow: '45 days',
    },
    confidence: 'medium',
    generatedAt: '2026-05-12T08:30:00+08:00',
    cohortSize: 2186,
    cohortFilter: 'sleep_debt_45d >= 12h OR sleep_timing_variance >= 90m',
    metric: 'sleep_hours',
    campaignType: 'stream',
    useCase: 'claims_reduction',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 39 },
      { source: 'Oura', pct: 27 },
      { source: 'WHOOP', pct: 21 },
      { source: 'Other', pct: 13 },
    ],
    outputs: computeOutputs(eco, 'sleep_hours', 'stream', 'claims_reduction', 2186, 42000),
    evidence: {
      literature: [
        {
          title: 'Sleep duration and cardiometabolic risk: a systematic review',
          journal: 'The Lancet Regional Health',
          year: 2023,
          doi: '10.1016/j.lanwpc.2023.100734',
          effectSize: 'Persistent sleep insufficiency associated with elevated cardiometabolic risk.',
        },
      ],
      portfolioContext: 'Sleep regularity is the broadest addressable campaign in the current book, but needs careful Health Points pricing to avoid over-rewarding low-value behaviour.',
      counterfactualUsd: 760000,
      confidenceBreakdown: { credibility: 78, causal: 64, evidence: 74, conservative: 81 },
    },
    ...deriveEngineData('sleep_regularity'),
  },
  {
    id: 'ins_resting_hr_improvement',
    signalId: 'resting_hr',
    signal: 'Resting HR',
    campaignName: 'Resting Heart Rate Improvement',
    title: 'Reduce elevated resting heart rate with a targeted activity campaign',
    subtitle: '946 members show elevated or worsening resting heart rate, with enough device coverage to verify improvement.',
    body: 'Reward sustained activity consistency and resting heart rate reduction over 90 days. This is a narrower campaign, but the signal is easy to understand, easy to verify, and commercially useful for cardio-metabolic risk improvement.',
    behaviourToReward: '12 active weeks with verified activity consistency and a 3 bpm resting heart rate improvement.',
    healthPointsPricing: {
      suggestedHpPerMember: 600,
      maxBudgetUsd: 31000,
      targetWindow: '90 days',
    },
    confidence: 'emerging',
    generatedAt: '2026-05-12T08:17:00+08:00',
    cohortSize: 946,
    cohortFilter: 'resting_hr_percentile >= 70 AND resting_hr_trend_60d = worsening AND device_coverage >= 70',
    metric: 'heart_rate_resting',
    campaignType: 'stream',
    useCase: 'claims_reduction',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 44 },
      { source: 'Garmin', pct: 24 },
      { source: 'Fitbit', pct: 20 },
      { source: 'Other', pct: 12 },
    ],
    outputs: computeOutputs(eco, 'heart_rate_resting', 'stream', 'claims_reduction', 946, 31000),
    evidence: {
      literature: [
        {
          title: 'Resting heart rate and cardiovascular outcomes in population cohorts',
          journal: 'European Heart Journal',
          year: 2022,
          doi: '10.1093/eurheartj/ehac021',
          effectSize: 'Higher resting heart rate associated with elevated cardiovascular risk.',
        },
      ],
      portfolioContext: 'This campaign is narrower than sleep or VO2 Max, but it creates a clean proof story for partners evaluating outcome-linked rewards.',
      counterfactualUsd: 390000,
      confidenceBreakdown: { credibility: 67, causal: 56, evidence: 62, conservative: 77 },
    },
    ...deriveEngineData('resting_hr'),
  },
  ];
}

/** Static Model-1 (Evidence Floor) insight set for non-reactive consumers. */
export const actuaryInsights: ActuaryInsight[] = buildActuaryInsights(FLOOR_ECONOMICS);
