import type { CampaignType, CampaignUseCase, HealthMetric } from '@/types';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';

interface MetricActuarialConfig {
  baselineClaimCostPerMember: number;
  riskSignalRate: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  evidenceNote: string;
  inferredUseCase: CampaignUseCase;
  suggestedHPBase: number;
  realizationFactor: number;
  expectedImprovementRate: number;
  outcomeLatencyMonths: number;
}

export const METRIC_ACTUARIAL_CONFIG: Record<HealthMetric, MetricActuarialConfig> = {
  hba1c:               { baselineClaimCostPerMember: 580,  riskSignalRate: 0.22, evidenceLevel: 'high',   evidenceNote: 'Strong literature link to metabolic and diabetes-related cost', inferredUseCase: 'underwriting',    suggestedHPBase: 150, realizationFactor: 0.67, expectedImprovementRate: 0.23, outcomeLatencyMonths: 9 },
  blood_glucose:       { baselineClaimCostPerMember: 2671, riskSignalRate: 0.14, evidenceLevel: 'high',   evidenceNote: 'Fasting glucose is a strong metabolic risk discriminator',       inferredUseCase: 'underwriting',    suggestedHPBase: 120, realizationFactor: 0.58, expectedImprovementRate: 0.16, outcomeLatencyMonths: 8 },
  cholesterol:         { baselineClaimCostPerMember: 696,  riskSignalRate: 0.13, evidenceLevel: 'high',   evidenceNote: 'Lipid panels remain a strong cardiovascular underwriting signal', inferredUseCase: 'underwriting',    suggestedHPBase: 130, realizationFactor: 0.56, expectedImprovementRate: 0.15, outcomeLatencyMonths: 10 },
  blood_pressure:      { baselineClaimCostPerMember: 662,  riskSignalRate: 0.11, evidenceLevel: 'high',   evidenceNote: 'Blood pressure improvement has mature intervention evidence',     inferredUseCase: 'claims_reduction', suggestedHPBase: 120, realizationFactor: 0.63, expectedImprovementRate: 0.14, outcomeLatencyMonths: 7 },
  bmi:                 { baselineClaimCostPerMember: 670,  riskSignalRate: 0.08, evidenceLevel: 'medium', evidenceNote: 'BMI is broad and directionally useful, but blunt in isolation',   inferredUseCase: 'underwriting',    suggestedHPBase: 90,  realizationFactor: 0.43, expectedImprovementRate: 0.09, outcomeLatencyMonths: 11 },
  vo2_max:             { baselineClaimCostPerMember: 1388, riskSignalRate: 0.18, evidenceLevel: 'high',   evidenceNote: 'VO₂ max is one of the strongest fitness-linked mortality signals', inferredUseCase: 'dynamic_premium', suggestedHPBase: 110, realizationFactor: 0.61, expectedImprovementRate: 0.17, outcomeLatencyMonths: 8 },
  hrv:                 { baselineClaimCostPerMember: 1900, riskSignalRate: 0.15, evidenceLevel: 'medium', evidenceNote: 'HRV is promising but still more emerging than settled actuarial input', inferredUseCase: 'claims_reduction', suggestedHPBase: 100, realizationFactor: 0.46, expectedImprovementRate: 0.13, outcomeLatencyMonths: 6 },
  heart_rate_resting:  { baselineClaimCostPerMember: 1700, riskSignalRate: 0.08, evidenceLevel: 'medium', evidenceNote: 'Resting heart rate is a good longitudinal fitness proxy',         inferredUseCase: 'dynamic_premium', suggestedHPBase: 80,  realizationFactor: 0.41, expectedImprovementRate: 0.08, outcomeLatencyMonths: 6 },
  respiratory_rate:    { baselineClaimCostPerMember: 1600, riskSignalRate: 0.07, evidenceLevel: 'medium', evidenceNote: 'Respiratory rate is useful but not yet a mainstream pricing input', inferredUseCase: 'dynamic_premium', suggestedHPBase: 70,  realizationFactor: 0.38, expectedImprovementRate: 0.07, outcomeLatencyMonths: 6 },
  spo2:                { baselineClaimCostPerMember: 1400, riskSignalRate: 0.05, evidenceLevel: 'medium', evidenceNote: 'SpO₂ is useful as a screening gate more than a long-run outcome driver', inferredUseCase: 'acquisition', suggestedHPBase: 50, realizationFactor: 0.34, expectedImprovementRate: 0.05, outcomeLatencyMonths: 4 },
  sleep_hours:         { baselineClaimCostPerMember: 1500, riskSignalRate: 0.07, evidenceLevel: 'medium', evidenceNote: 'Sleep duration is commercially relevant but causality is noisy', inferredUseCase: 'renewal', suggestedHPBase: 70, realizationFactor: 0.36, expectedImprovementRate: 0.08, outcomeLatencyMonths: 7 },
  sleep_quality:       { baselineClaimCostPerMember: 1500, riskSignalRate: 0.06, evidenceLevel: 'medium', evidenceNote: 'Sleep quality is useful as a behavioral trend and engagement input', inferredUseCase: 'renewal', suggestedHPBase: 65, realizationFactor: 0.33, expectedImprovementRate: 0.07, outcomeLatencyMonths: 7 },
  active_minutes:      { baselineClaimCostPerMember: 1600, riskSignalRate: 0.10, evidenceLevel: 'medium', evidenceNote: 'Activity adherence is credible but still indirect for claims impact', inferredUseCase: 'acquisition', suggestedHPBase: 65, realizationFactor: 0.42, expectedImprovementRate: 0.11, outcomeLatencyMonths: 6 },
  steps:               { baselineClaimCostPerMember: 778,  riskSignalRate: 0.05, evidenceLevel: 'low',    evidenceNote: 'Step counts are easy to explain but weak as a standalone claims signal', inferredUseCase: 'acquisition', suggestedHPBase: 45, realizationFactor: 0.26, expectedImprovementRate: 0.05, outcomeLatencyMonths: 5 },
  stress_score:        { baselineClaimCostPerMember: 1600, riskSignalRate: 0.07, evidenceLevel: 'medium', evidenceNote: 'Stress scores may support intervention targeting more than direct pricing', inferredUseCase: 'claims_reduction', suggestedHPBase: 65, realizationFactor: 0.37, expectedImprovementRate: 0.08, outcomeLatencyMonths: 6 },
  body_composition:    { baselineClaimCostPerMember: 1500, riskSignalRate: 0.05, evidenceLevel: 'low',    evidenceNote: 'Body composition adds context, but usually needs supporting signals', inferredUseCase: 'underwriting', suggestedHPBase: 60, realizationFactor: 0.24, expectedImprovementRate: 0.05, outcomeLatencyMonths: 10 },
  hydration:           { baselineClaimCostPerMember: 1300, riskSignalRate: 0.03, evidenceLevel: 'low',    evidenceNote: 'Hydration is mainly an engagement signal at this stage', inferredUseCase: 'renewal', suggestedHPBase: 40, realizationFactor: 0.18, expectedImprovementRate: 0.03, outcomeLatencyMonths: 4 },
  body_temp_deviation: { baselineClaimCostPerMember: 1400, riskSignalRate: 0.04, evidenceLevel: 'low',    evidenceNote: 'Temperature variation is operationally interesting but commercially immature', inferredUseCase: 'acquisition', suggestedHPBase: 45, realizationFactor: 0.2, expectedImprovementRate: 0.04, outcomeLatencyMonths: 4 },
};

interface UseCaseConfig {
  savingsFraming: string;
  realizationMultiplier: number;
  scenarioHorizonMonths: number;
  expectedVerificationRate: number;
  additionalNote: string | null;
}

export const USE_CASE_CONFIG: Record<CampaignUseCase, UseCaseConfig> = {
  underwriting:     { savingsFraming: 'Exam avoidance and faster risk selection', realizationMultiplier: 0.96, scenarioHorizonMonths: 12, expectedVerificationRate: 0.31, additionalNote: 'Best for cycle-time and acquisition friction, not long-tail claims proof.' },
  dynamic_premium:  { savingsFraming: 'Behavior-linked renewal and pricing discipline', realizationMultiplier: 0.92, scenarioHorizonMonths: 18, expectedVerificationRate: 0.27, additionalNote: 'Value compounds if longitudinal signals stay stable over time.' },
  claims_reduction: { savingsFraming: 'Avoidable claims event reduction', realizationMultiplier: 1.08, scenarioHorizonMonths: 18, expectedVerificationRate: 0.29, additionalNote: 'Most strategic upside, but also the highest proof burden.' },
  renewal:          { savingsFraming: 'Retention and renewal operating efficiency', realizationMultiplier: 0.84, scenarioHorizonMonths: 12, expectedVerificationRate: 0.24, additionalNote: 'Often strongest as a friction-reduction and engagement motion.' },
  acquisition:      { savingsFraming: 'Risk-adjusted acquisition and pre-qualification', realizationMultiplier: 0.78, scenarioHorizonMonths: 9, expectedVerificationRate: 0.22, additionalNote: 'Easiest commercial wedge because integration and proof burden are lower.' },
};

const STREAM_REALIZATION_MULTIPLIER = 1.12;
const SNAPSHOT_REALIZATION_MULTIPLIER = 0.96;
const STREAM_HP_FACTOR = 0.72;

const EVIDENCE_CONFIDENCE: Record<'high' | 'medium' | 'low', number> = {
  high: 0.72,
  medium: 0.54,
  low: 0.34,
};

const EVIDENCE_RANGE: Record<'high' | 'medium' | 'low', [number, number]> = {
  high: [0.78, 1.28],
  medium: [0.55, 1.4],
  low: [0.35, 1.55],
};

export interface ActuarialROIParams {
  metric: HealthMetric | '';
  type: CampaignType | '';
  useCase: CampaignUseCase | '';
  maxParticipants: number;
  budgetCeiling: number;
  applyAdjustments?: boolean;
}

export interface ActuarialROIResult {
  claimsReductionRate: number;
  baselineCostPerMember: number;
  savingsPerMember: number;
  totalProjectedSavings: number;
  budgetROI: number;
  suggestedHP: number;
  evidenceNote: string;
  evidenceLevel: 'high' | 'medium' | 'low';
  savingsFraming: string;
  additionalNote: string | null;
  isReady: boolean;
  adjustmentsApplied: boolean;
  morbidityShiftBps: number;
  paybackMonths: number;
  vnbImpactPer1MMAPE: number;
  modeledImprovementRate: number;
  expectedVerifiedLives: number;
  scenarioRangeLow: number;
  scenarioRangeHigh: number;
  modelConfidence: number;
  scenarioHorizonMonths: number;
  confidenceLabel: string;
}

function confidenceLabel(value: number): string {
  if (value >= 0.68) return 'higher confidence';
  if (value >= 0.48) return 'directional confidence';
  return 'exploratory confidence';
}

function scenarioValues(
  metric: HealthMetric,
  type: CampaignType | '',
  useCase: CampaignUseCase | '',
  maxParticipants: number,
  applyAdjustments: boolean,
) {
  const metricConfig = METRIC_ACTUARIAL_CONFIG[metric];
  const useCaseConfig = useCase ? USE_CASE_CONFIG[useCase] : null;
  const streamMultiplier = type === 'stream' ? STREAM_REALIZATION_MULTIPLIER : SNAPSHOT_REALIZATION_MULTIPLIER;
  const participantCount = Math.max(0, maxParticipants);
  const scenarioHorizonMonths = useCaseConfig?.scenarioHorizonMonths ?? 12;
  const verificationRateBase = useCaseConfig?.expectedVerificationRate ?? 0.24;
  const evidenceMultiplier = EVIDENCE_CONFIDENCE[metricConfig.evidenceLevel];
  const adjustedVerificationRate = Math.min(
    0.58,
    verificationRateBase * (type === 'stream' ? 1.1 : 1) * (applyAdjustments ? 0.86 : 1) * (0.92 + evidenceMultiplier * 0.16),
  );
  const expectedVerifiedLives = Math.round(participantCount * adjustedVerificationRate);
  const modeledImprovementRate =
    metricConfig.expectedImprovementRate *
    metricConfig.realizationFactor *
    streamMultiplier *
    (useCaseConfig?.realizationMultiplier ?? 1) *
    (applyAdjustments ? 0.78 : 1);
  const attributedImpactRate = metricConfig.riskSignalRate * metricConfig.realizationFactor * (applyAdjustments ? 0.72 : 1);
  const savingsPerVerifiedMember =
    metricConfig.baselineClaimCostPerMember *
    modeledImprovementRate *
    Math.max(scenarioHorizonMonths - metricConfig.outcomeLatencyMonths, 3) /
    12;
  const savingsPerMember = savingsPerVerifiedMember * adjustedVerificationRate;
  const totalProjectedSavings = savingsPerMember * participantCount;
  const [lowFactor, highFactor] = EVIDENCE_RANGE[metricConfig.evidenceLevel];
  const scenarioRangeLow = totalProjectedSavings * lowFactor * (applyAdjustments ? 0.9 : 1);
  const scenarioRangeHigh = totalProjectedSavings * highFactor;
  const modelConfidence = clampConfidence(
    EVIDENCE_CONFIDENCE[metricConfig.evidenceLevel] *
      (type === 'stream' ? 1.05 : 0.97) *
      (useCase === 'claims_reduction' ? 0.9 : 1),
  );

  return {
    metricConfig,
    useCaseConfig,
    scenarioHorizonMonths,
    expectedVerifiedLives,
    modeledImprovementRate,
    attributedImpactRate,
    savingsPerMember,
    totalProjectedSavings,
    scenarioRangeLow,
    scenarioRangeHigh,
    modelConfidence,
  };
}

function clampConfidence(value: number): number {
  return Math.max(0.2, Math.min(0.88, value));
}

export function calculateActuarialROI(params: ActuarialROIParams): ActuarialROIResult {
  const { metric, type, useCase, maxParticipants, budgetCeiling, applyAdjustments = false } = params;

  if (!metric || maxParticipants <= 0) {
    return {
      claimsReductionRate: 0,
      baselineCostPerMember: 0,
      savingsPerMember: 0,
      totalProjectedSavings: 0,
      budgetROI: 0,
      suggestedHP: 0,
      evidenceNote: '',
      evidenceLevel: 'low',
      savingsFraming: '',
      additionalNote: null,
      isReady: false,
      adjustmentsApplied: false,
      morbidityShiftBps: 0,
      paybackMonths: 0,
      vnbImpactPer1MMAPE: 0,
      modeledImprovementRate: 0,
      expectedVerifiedLives: 0,
      scenarioRangeLow: 0,
      scenarioRangeHigh: 0,
      modelConfidence: 0,
      scenarioHorizonMonths: 0,
      confidenceLabel: '',
    };
  }

  const {
    metricConfig,
    useCaseConfig,
    scenarioHorizonMonths,
    expectedVerifiedLives,
    modeledImprovementRate,
    attributedImpactRate,
    savingsPerMember,
    totalProjectedSavings,
    scenarioRangeLow,
    scenarioRangeHigh,
    modelConfidence,
  } = scenarioValues(metric, type, useCase, maxParticipants, applyAdjustments);

  const budgetROI = budgetCeiling > 0 ? totalProjectedSavings / budgetCeiling : 0;
  const streamFactor = type === 'stream' ? STREAM_HP_FACTOR : 1.0;
  const suggestedHP = Math.round(Math.min(500, Math.max(25, metricConfig.suggestedHPBase * streamFactor)) / 5) * 5;
  const morbidityShiftBps = Math.round(modeledImprovementRate * 10000 * 0.35 / 5) * 5;
  const paybackMonths = totalProjectedSavings > 0 ? Math.min(36, Math.round((budgetCeiling / totalProjectedSavings) * scenarioHorizonMonths)) : 36;
  const vnbImpactPer1MMAPE = Math.round(morbidityShiftBps * 3400);

  return {
    claimsReductionRate: attributedImpactRate,
    baselineCostPerMember: metricConfig.baselineClaimCostPerMember,
    savingsPerMember,
    totalProjectedSavings,
    budgetROI,
    suggestedHP,
    evidenceNote: metricConfig.evidenceNote,
    evidenceLevel: metricConfig.evidenceLevel,
    savingsFraming: useCaseConfig?.savingsFraming ?? '',
    additionalNote: useCaseConfig?.additionalNote ?? null,
    isReady: true,
    adjustmentsApplied: applyAdjustments,
    morbidityShiftBps,
    paybackMonths,
    vnbImpactPer1MMAPE,
    modeledImprovementRate,
    expectedVerifiedLives,
    scenarioRangeLow,
    scenarioRangeHigh,
    modelConfidence,
    scenarioHorizonMonths,
    confidenceLabel: confidenceLabel(modelConfidence),
  };
}

export interface MetricComparison {
  metric: HealthMetric;
  label: string;
  savingsPerMember: number;
  isSelected: boolean;
}

export function getMetricComparisons(
  useCase: CampaignUseCase | '',
  type: CampaignType | '',
  selectedMetric: HealthMetric | '',
  count = 5,
): MetricComparison[] {
  const all = (Object.keys(METRIC_ACTUARIAL_CONFIG) as HealthMetric[]).map((metric) => {
    const result = calculateActuarialROI({
      metric,
      type,
      useCase,
      maxParticipants: 1000,
      budgetCeiling: 1,
      applyAdjustments: true,
    });
    return {
      metric,
      label: HEALTH_METRIC_LABELS[metric],
      savingsPerMember: result.savingsPerMember,
      isSelected: metric === selectedMetric,
    };
  });

  all.sort((a, b) => b.savingsPerMember - a.savingsPerMember);
  const top = all.slice(0, count);
  if (selectedMetric && !top.some((item) => item.isSelected)) {
    const selected = all.find((item) => item.isSelected);
    if (selected) top[count - 1] = selected;
  }
  return top;
}

export function suggestUseCase(metric: HealthMetric): CampaignUseCase {
  return METRIC_ACTUARIAL_CONFIG[metric].inferredUseCase;
}

export interface MultiMetricROIResult extends ActuarialROIResult {
  metrics: HealthMetric[];
}

export function calculateMultiMetricROI(
  metrics: HealthMetric[],
  useCase: CampaignUseCase | '',
  type: CampaignType | '',
  participants: number,
  budget: number,
): MultiMetricROIResult {
  const validMetrics = metrics.filter((metric) => metric in METRIC_ACTUARIAL_CONFIG);
  if (!validMetrics.length || participants <= 0) {
    return {
      claimsReductionRate: 0,
      baselineCostPerMember: 0,
      savingsPerMember: 0,
      totalProjectedSavings: 0,
      budgetROI: 0,
      suggestedHP: 0,
      evidenceNote: '',
      evidenceLevel: 'low',
      savingsFraming: '',
      additionalNote: null,
      isReady: false,
      adjustmentsApplied: false,
      morbidityShiftBps: 0,
      paybackMonths: 0,
      vnbImpactPer1MMAPE: 0,
      modeledImprovementRate: 0,
      expectedVerifiedLives: 0,
      scenarioRangeLow: 0,
      scenarioRangeHigh: 0,
      modelConfidence: 0,
      scenarioHorizonMonths: 0,
      confidenceLabel: '',
      metrics: validMetrics,
    };
  }

  const metricResults = validMetrics.map((metric) =>
    calculateActuarialROI({
      metric,
      type,
      useCase,
      maxParticipants: participants,
      budgetCeiling: budget,
      applyAdjustments: true,
    }),
  );
  const weightedSavingsPerMember = metricResults.reduce((sum, result) => sum + result.savingsPerMember, 0) / metricResults.length;
  const overlapDiscount = validMetrics.length === 1 ? 1 : Math.max(0.58, 1 - (validMetrics.length - 1) * 0.16);
  const savingsPerMember = weightedSavingsPerMember * overlapDiscount;
  const totalProjectedSavings = savingsPerMember * participants;
  const budgetROI = budget > 0 ? totalProjectedSavings / budget : 0;
  const averageImpactRate = metricResults.reduce((sum, result) => sum + result.claimsReductionRate, 0) / metricResults.length;
  const averageBaselineCost = metricResults.reduce((sum, result) => sum + result.baselineCostPerMember, 0) / metricResults.length;
  const avgHP = metricResults.reduce((sum, result) => sum + result.suggestedHP, 0) / metricResults.length;
  const modelConfidence = clampConfidence(metricResults.reduce((sum, result) => sum + result.modelConfidence, 0) / metricResults.length * overlapDiscount);
  const scenarioRangeLow = metricResults.reduce((sum, result) => sum + result.scenarioRangeLow, 0) / metricResults.length * overlapDiscount;
  const scenarioRangeHigh = metricResults.reduce((sum, result) => sum + result.scenarioRangeHigh, 0) / metricResults.length * overlapDiscount;
  const horizon = Math.round(metricResults.reduce((sum, result) => sum + result.scenarioHorizonMonths, 0) / metricResults.length);
  const evidenceLevel: 'high' | 'medium' | 'low' =
    metricResults.some((result) => result.evidenceLevel === 'high')
      ? 'high'
      : metricResults.some((result) => result.evidenceLevel === 'medium')
        ? 'medium'
        : 'low';
  const expectedVerifiedLives = Math.round(metricResults.reduce((sum, result) => sum + result.expectedVerifiedLives, 0) / metricResults.length);

  return {
    claimsReductionRate: averageImpactRate,
    baselineCostPerMember: averageBaselineCost,
    savingsPerMember,
    totalProjectedSavings,
    budgetROI,
    suggestedHP: Math.round(avgHP / 5) * 5,
    evidenceNote: `Combined ${validMetrics.length}-metric scenario with overlap discount`,
    evidenceLevel,
    savingsFraming: USE_CASE_CONFIG[useCase || 'claims_reduction'].savingsFraming,
    additionalNote: 'Combined scenarios should be treated as directional because of interaction and overlap effects.',
    isReady: true,
    adjustmentsApplied: true,
    morbidityShiftBps: Math.round(averageImpactRate * 10000 * 0.3 / 5) * 5,
    paybackMonths: totalProjectedSavings > 0 ? Math.min(36, Math.round((budget / totalProjectedSavings) * horizon)) : 36,
    vnbImpactPer1MMAPE: Math.round(averageImpactRate * 10000 * 1200),
    modeledImprovementRate: metricResults.reduce((sum, result) => sum + result.modeledImprovementRate, 0) / metricResults.length * overlapDiscount,
    expectedVerifiedLives,
    scenarioRangeLow,
    scenarioRangeHigh,
    modelConfidence,
    scenarioHorizonMonths: horizon,
    confidenceLabel: confidenceLabel(modelConfidence),
    metrics: validMetrics,
  };
}
