import type { CampaignType, CampaignUseCase, HealthMetric } from '@/types';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import { useModelStore } from '@/stores/useModelStore';
import type { EconomicsConfig } from '@/lib/economicsConfig';

// ===========================================================================
// Engine-backed campaign economics (replaces the former src/utils/actuarial.ts
// parallel calculator). Per the Assumptions Studio brief, there is one source
// of truth for the economics: the server engine's assumption set, resolved per
// selected Model. The calculation is the same; its *parameters* now come from
// the active Model (see economicsConfig.ts for the data/floor + derivation).
//
// - Model 1 (Evidence Floor) reproduces the prior numbers exactly (scalar 1).
// - Model 2 (Forward) scales every savings number up via its higher claims-
//   attribution factor; switching the Model re-prices every screen.
// - The active EconomicsConfig lives in the model store, hydrated from
//   GET /api/economics when the engine is reachable, with a baked fallback.
// ===========================================================================

// Re-export the config/data layer so existing imports from '@/lib/economics'
// keep working (types, FLOOR_*, deriveEconomics, MODEL_ECONOMICS_FALLBACK).
export * from '@/lib/economicsConfig';

// React hook: the active economics config, reactive to the selected Model.
export function useEconomics(): EconomicsConfig {
  return useModelStore((s) => s.economics);
}

// ── Calculation (parameterised by the active EconomicsConfig) ────────────────

const STREAM_REALIZATION_MULTIPLIER = 1.12;
const SNAPSHOT_REALIZATION_MULTIPLIER = 0.96;
const STREAM_HP_FACTOR = 0.72;

const EVIDENCE_CONFIDENCE: Record<'high' | 'medium' | 'low', number> = { high: 0.72, medium: 0.54, low: 0.34 };
const EVIDENCE_RANGE: Record<'high' | 'medium' | 'low', [number, number]> = { high: [0.78, 1.28], medium: [0.55, 1.4], low: [0.35, 1.55] };

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

function clampConfidence(value: number): number {
  return Math.max(0.2, Math.min(0.88, value));
}

function emptyResult(): ActuarialROIResult {
  return {
    claimsReductionRate: 0, baselineCostPerMember: 0, savingsPerMember: 0, totalProjectedSavings: 0, budgetROI: 0,
    suggestedHP: 0, evidenceNote: '', evidenceLevel: 'low', savingsFraming: '', additionalNote: null, isReady: false,
    adjustmentsApplied: false, morbidityShiftBps: 0, paybackMonths: 0, vnbImpactPer1MMAPE: 0, modeledImprovementRate: 0,
    expectedVerifiedLives: 0, scenarioRangeLow: 0, scenarioRangeHigh: 0, modelConfidence: 0, scenarioHorizonMonths: 0, confidenceLabel: '',
  };
}

function scenarioValues(
  cfg: EconomicsConfig,
  metric: HealthMetric,
  type: CampaignType | '',
  useCase: CampaignUseCase | '',
  maxParticipants: number,
  applyAdjustments: boolean,
) {
  const metricConfig = cfg.metricConfig[metric];
  const useCaseConfig = useCase ? cfg.useCaseConfig[useCase] : null;
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
    metricConfig, useCaseConfig, scenarioHorizonMonths, expectedVerifiedLives, modeledImprovementRate,
    attributedImpactRate, savingsPerMember, totalProjectedSavings, scenarioRangeLow, scenarioRangeHigh, modelConfidence,
  };
}

export function calculateActuarialROI(cfg: EconomicsConfig, params: ActuarialROIParams): ActuarialROIResult {
  const { metric, type, useCase, maxParticipants, budgetCeiling, applyAdjustments = false } = params;
  if (!metric || maxParticipants <= 0) return emptyResult();

  const {
    metricConfig, useCaseConfig, scenarioHorizonMonths, expectedVerifiedLives, modeledImprovementRate,
    attributedImpactRate, savingsPerMember, totalProjectedSavings, scenarioRangeLow, scenarioRangeHigh, modelConfidence,
  } = scenarioValues(cfg, metric, type, useCase, maxParticipants, applyAdjustments);

  const budgetROI = budgetCeiling > 0 ? totalProjectedSavings / budgetCeiling : 0;
  const streamFactor = type === 'stream' ? STREAM_HP_FACTOR : 1.0;
  const suggestedHP = Math.round(Math.min(500, Math.max(25, metricConfig.suggestedHPBase * streamFactor)) / 5) * 5;
  const morbidityShiftBps = Math.round(modeledImprovementRate * 10000 * 0.35 / 5) * 5;
  const paybackMonths = totalProjectedSavings > 0 ? Math.min(36, Math.round((budgetCeiling / totalProjectedSavings) * scenarioHorizonMonths)) : 36;
  const vnbImpactPer1MMAPE = Math.round(morbidityShiftBps * 3400);

  return {
    claimsReductionRate: attributedImpactRate,
    baselineCostPerMember: metricConfig.baselineClaimCostPerMember,
    savingsPerMember, totalProjectedSavings, budgetROI, suggestedHP,
    evidenceNote: metricConfig.evidenceNote,
    evidenceLevel: metricConfig.evidenceLevel,
    savingsFraming: useCaseConfig?.savingsFraming ?? '',
    additionalNote: useCaseConfig?.additionalNote ?? null,
    isReady: true, adjustmentsApplied: applyAdjustments, morbidityShiftBps, paybackMonths, vnbImpactPer1MMAPE,
    modeledImprovementRate, expectedVerifiedLives, scenarioRangeLow, scenarioRangeHigh, modelConfidence,
    scenarioHorizonMonths, confidenceLabel: confidenceLabel(modelConfidence),
  };
}

export interface MetricComparison {
  metric: HealthMetric;
  label: string;
  savingsPerMember: number;
  isSelected: boolean;
}

export function getMetricComparisons(
  cfg: EconomicsConfig,
  useCase: CampaignUseCase | '',
  type: CampaignType | '',
  selectedMetric: HealthMetric | '',
  count = 5,
): MetricComparison[] {
  const all = (Object.keys(cfg.metricConfig) as HealthMetric[]).map((metric) => {
    const result = calculateActuarialROI(cfg, { metric, type, useCase, maxParticipants: 1000, budgetCeiling: 1, applyAdjustments: true });
    return { metric, label: HEALTH_METRIC_LABELS[metric], savingsPerMember: result.savingsPerMember, isSelected: metric === selectedMetric };
  });
  all.sort((a, b) => b.savingsPerMember - a.savingsPerMember);
  const top = all.slice(0, count);
  if (selectedMetric && !top.some((item) => item.isSelected)) {
    const selected = all.find((item) => item.isSelected);
    if (selected) top[count - 1] = selected;
  }
  return top;
}

export interface LossRatioDeltaResult {
  baselineLossRatio: number;
  projectedLossRatio: number;
  deltaPercent: number;
  costPerCompliantMember: number;
  complianceLiftTimeSeries: { month: number; observed: number | null; predicted: number | null }[];
  annualizedSavings: number;
  confidence: number;
}

export function calculateLossRatioDelta(
  cfg: EconomicsConfig,
  params: {
    metric: HealthMetric;
    useCase: CampaignUseCase;
    type: CampaignType;
    enrolled: number;
    verified: number;
    budgetSpent: number;
    budgetCeiling: number;
    campaignAgeMonths: number;
  },
): LossRatioDeltaResult {
  const { metric, useCase, type, enrolled, verified, budgetSpent, budgetCeiling, campaignAgeMonths } = params;
  const metricConfig = cfg.metricConfig[metric];
  const useCaseConfig = cfg.useCaseConfig[useCase];

  const baselineLossRatio = 0.62 + metricConfig.riskSignalRate * 0.15;
  const streamMultiplier = type === 'stream' ? STREAM_REALIZATION_MULTIPLIER : SNAPSHOT_REALIZATION_MULTIPLIER;
  const effectiveImprovement = metricConfig.expectedImprovementRate * metricConfig.realizationFactor * streamMultiplier * useCaseConfig.realizationMultiplier;
  const deltaPercent = -(effectiveImprovement * 100);
  const projectedLossRatio = baselineLossRatio + deltaPercent / 100;
  const costPerCompliantMember = verified > 0 ? budgetSpent / verified : budgetCeiling / Math.max(enrolled * 0.25, 1);

  const observedMonths = Math.min(campaignAgeMonths, 12);
  const timeSeries: LossRatioDeltaResult['complianceLiftTimeSeries'] = [];
  const latencyMonths = metricConfig.outcomeLatencyMonths;
  const maxLift = effectiveImprovement;
  for (let m = 1; m <= 12; m++) {
    if (m <= observedMonths) {
      const t = m - latencyMonths * 0.5;
      const lift = maxLift / (1 + Math.exp(-0.8 * t));
      timeSeries.push({ month: m, observed: Number((lift * 100).toFixed(2)), predicted: null });
    } else {
      const lastObserved = timeSeries.length > 0 ? (timeSeries[timeSeries.length - 1].observed ?? 0) : 0;
      const slope = lastObserved / Math.max(observedMonths, 1);
      const predicted = Math.min(maxLift * 100, lastObserved + slope * (m - observedMonths));
      timeSeries.push({ month: m, observed: null, predicted: Number(predicted.toFixed(2)) });
    }
  }
  const annualizedSavings = enrolled * metricConfig.baselineClaimCostPerMember * effectiveImprovement;
  const confidence = EVIDENCE_CONFIDENCE[metricConfig.evidenceLevel] * (type === 'stream' ? 1.05 : 0.97);

  return {
    baselineLossRatio: Number(baselineLossRatio.toFixed(4)),
    projectedLossRatio: Number(projectedLossRatio.toFixed(4)),
    deltaPercent: Number(deltaPercent.toFixed(2)),
    costPerCompliantMember: Math.round(costPerCompliantMember),
    complianceLiftTimeSeries: timeSeries,
    annualizedSavings: Math.round(annualizedSavings),
    confidence: Number(Math.min(0.88, Math.max(0.2, confidence)).toFixed(2)),
  };
}

export function suggestUseCase(cfg: EconomicsConfig, metric: HealthMetric): CampaignUseCase {
  return cfg.metricConfig[metric].inferredUseCase;
}

export interface MultiMetricROIResult extends ActuarialROIResult {
  metrics: HealthMetric[];
}

export function calculateMultiMetricROI(
  cfg: EconomicsConfig,
  metrics: HealthMetric[],
  useCase: CampaignUseCase | '',
  type: CampaignType | '',
  participants: number,
  budget: number,
): MultiMetricROIResult {
  const validMetrics = metrics.filter((metric) => metric in cfg.metricConfig);
  if (!validMetrics.length || participants <= 0) {
    return { ...emptyResult(), metrics: validMetrics };
  }
  const metricResults = validMetrics.map((metric) =>
    calculateActuarialROI(cfg, { metric, type, useCase, maxParticipants: participants, budgetCeiling: budget, applyAdjustments: true }),
  );
  const weightedSavingsPerMember = metricResults.reduce((sum, r) => sum + r.savingsPerMember, 0) / metricResults.length;
  const overlapDiscount = validMetrics.length === 1 ? 1 : Math.max(0.58, 1 - (validMetrics.length - 1) * 0.16);
  const savingsPerMember = weightedSavingsPerMember * overlapDiscount;
  const totalProjectedSavings = savingsPerMember * participants;
  const budgetROI = budget > 0 ? totalProjectedSavings / budget : 0;
  const averageImpactRate = metricResults.reduce((sum, r) => sum + r.claimsReductionRate, 0) / metricResults.length;
  const averageBaselineCost = metricResults.reduce((sum, r) => sum + r.baselineCostPerMember, 0) / metricResults.length;
  const avgHP = metricResults.reduce((sum, r) => sum + r.suggestedHP, 0) / metricResults.length;
  const modelConfidence = clampConfidence(metricResults.reduce((sum, r) => sum + r.modelConfidence, 0) / metricResults.length * overlapDiscount);
  const scenarioRangeLow = metricResults.reduce((sum, r) => sum + r.scenarioRangeLow, 0) / metricResults.length * overlapDiscount;
  const scenarioRangeHigh = metricResults.reduce((sum, r) => sum + r.scenarioRangeHigh, 0) / metricResults.length * overlapDiscount;
  const horizon = Math.round(metricResults.reduce((sum, r) => sum + r.scenarioHorizonMonths, 0) / metricResults.length);
  const evidenceLevel: 'high' | 'medium' | 'low' =
    metricResults.some((r) => r.evidenceLevel === 'high') ? 'high'
      : metricResults.some((r) => r.evidenceLevel === 'medium') ? 'medium' : 'low';
  const expectedVerifiedLives = Math.round(metricResults.reduce((sum, r) => sum + r.expectedVerifiedLives, 0) / metricResults.length);

  return {
    claimsReductionRate: averageImpactRate,
    baselineCostPerMember: averageBaselineCost,
    savingsPerMember, totalProjectedSavings, budgetROI,
    suggestedHP: Math.round(avgHP / 5) * 5,
    evidenceNote: `Combined ${validMetrics.length}-metric scenario with overlap discount`,
    evidenceLevel,
    savingsFraming: cfg.useCaseConfig[useCase || 'claims_reduction'].savingsFraming,
    additionalNote: 'Combined scenarios should be treated as directional because of interaction and overlap effects.',
    isReady: true, adjustmentsApplied: true,
    morbidityShiftBps: Math.round(averageImpactRate * 10000 * 0.3 / 5) * 5,
    paybackMonths: totalProjectedSavings > 0 ? Math.min(36, Math.round((budget / totalProjectedSavings) * horizon)) : 36,
    vnbImpactPer1MMAPE: Math.round(averageImpactRate * 10000 * 1200),
    modeledImprovementRate: metricResults.reduce((sum, r) => sum + r.modeledImprovementRate, 0) / metricResults.length * overlapDiscount,
    expectedVerifiedLives, scenarioRangeLow, scenarioRangeHigh, modelConfidence,
    scenarioHorizonMonths: horizon, confidenceLabel: confidenceLabel(modelConfidence),
    metrics: validMetrics,
  };
}
