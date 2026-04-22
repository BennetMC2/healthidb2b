import type { HealthMetric, CampaignUseCase, CampaignType } from '@/types';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';

// ── Metric Actuarial Config ────────────────────────────────────────

interface MetricActuarialConfig {
  claimsReductionRate: number;
  baselineClaimCostPerMember: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  evidenceNote: string;
  inferredUseCase: CampaignUseCase;
  suggestedHPBase: number;
}

export const METRIC_ACTUARIAL_CONFIG: Record<HealthMetric, MetricActuarialConfig> = {
  hba1c:              { claimsReductionRate: 0.22, baselineClaimCostPerMember: 580,  evidenceLevel: 'high',   evidenceNote: 'Strong link to diabetes-related claims cost',               inferredUseCase: 'underwriting',    suggestedHPBase: 150 },
  blood_glucose:      { claimsReductionRate: 0.14, baselineClaimCostPerMember: 2671, evidenceLevel: 'high',   evidenceNote: 'Fasting glucose predicts metabolic syndrome onset',         inferredUseCase: 'underwriting',    suggestedHPBase: 120 },
  cholesterol:        { claimsReductionRate: 0.13, baselineClaimCostPerMember: 696,  evidenceLevel: 'high',   evidenceNote: 'Lipid panels correlate with cardiovascular event risk',     inferredUseCase: 'underwriting',    suggestedHPBase: 130 },
  blood_pressure:     { claimsReductionRate: 0.11, baselineClaimCostPerMember: 662,  evidenceLevel: 'high',   evidenceNote: 'Hypertension management reduces ER & cardiac claims',       inferredUseCase: 'claims_reduction', suggestedHPBase: 120 },
  bmi:                { claimsReductionRate: 0.08, baselineClaimCostPerMember: 670,  evidenceLevel: 'medium', evidenceNote: 'BMI is a broad risk proxy; less predictive in isolation',    inferredUseCase: 'underwriting',    suggestedHPBase: 90  },
  vo2_max:            { claimsReductionRate: 0.18, baselineClaimCostPerMember: 1388, evidenceLevel: 'high',   evidenceNote: 'VO₂ max is a top predictor of all-cause mortality',        inferredUseCase: 'dynamic_premium', suggestedHPBase: 110 },
  hrv:                { claimsReductionRate: 0.15, baselineClaimCostPerMember: 1900, evidenceLevel: 'medium', evidenceNote: 'HRV reflects autonomic health; growing actuarial evidence', inferredUseCase: 'claims_reduction', suggestedHPBase: 100 },
  heart_rate_resting: { claimsReductionRate: 0.08, baselineClaimCostPerMember: 1700, evidenceLevel: 'medium', evidenceNote: 'Resting HR tracks cardiovascular fitness over time',        inferredUseCase: 'dynamic_premium', suggestedHPBase: 80  },
  respiratory_rate:   { claimsReductionRate: 0.07, baselineClaimCostPerMember: 1600, evidenceLevel: 'medium', evidenceNote: 'Respiratory rate signals early illness onset',              inferredUseCase: 'dynamic_premium', suggestedHPBase: 70  },
  spo2:               { claimsReductionRate: 0.05, baselineClaimCostPerMember: 1400, evidenceLevel: 'medium', evidenceNote: 'SpO₂ dips useful for sleep apnea screening',               inferredUseCase: 'acquisition',     suggestedHPBase: 50  },
  sleep_hours:        { claimsReductionRate: 0.07, baselineClaimCostPerMember: 1500, evidenceLevel: 'medium', evidenceNote: 'Short sleep linked to higher chronic disease claims',        inferredUseCase: 'renewal',         suggestedHPBase: 70  },
  sleep_quality:      { claimsReductionRate: 0.06, baselineClaimCostPerMember: 1500, evidenceLevel: 'medium', evidenceNote: 'Sleep quality scores complement duration data',             inferredUseCase: 'renewal',         suggestedHPBase: 65  },
  active_minutes:     { claimsReductionRate: 0.10, baselineClaimCostPerMember: 1600, evidenceLevel: 'medium', evidenceNote: 'WHO activity guidelines reduce all-cause risk ~15%',        inferredUseCase: 'acquisition',     suggestedHPBase: 65  },
  steps:              { claimsReductionRate: 0.05, baselineClaimCostPerMember: 778,  evidenceLevel: 'low',    evidenceNote: 'Step counts are directional; low clinical specificity',     inferredUseCase: 'acquisition',     suggestedHPBase: 45  },
  stress_score:       { claimsReductionRate: 0.07, baselineClaimCostPerMember: 1600, evidenceLevel: 'medium', evidenceNote: 'Chronic stress increases behavioral health claims',          inferredUseCase: 'claims_reduction', suggestedHPBase: 65  },
  body_composition:   { claimsReductionRate: 0.05, baselineClaimCostPerMember: 1500, evidenceLevel: 'low',    evidenceNote: 'Body fat % adds context beyond BMI alone',                 inferredUseCase: 'underwriting',    suggestedHPBase: 60  },
  hydration:          { claimsReductionRate: 0.03, baselineClaimCostPerMember: 1300, evidenceLevel: 'low',    evidenceNote: 'Hydration data is engagement-focused; limited claims link', inferredUseCase: 'renewal',         suggestedHPBase: 40  },
  body_temp_deviation:{ claimsReductionRate: 0.04, baselineClaimCostPerMember: 1400, evidenceLevel: 'low',    evidenceNote: 'Temp variation useful for illness detection, not pricing',  inferredUseCase: 'acquisition',     suggestedHPBase: 45  },
};

// ── Use Case Config ────────────────────────────────────────────────

interface UseCaseConfig {
  savingsFraming: string;
  savingsMultiplier: number;
  additionalNote: string | null;
}

export const USE_CASE_CONFIG: Record<CampaignUseCase, UseCaseConfig> = {
  underwriting:     { savingsFraming: 'Adverse selection avoidance',  savingsMultiplier: 1.1,  additionalNote: 'Replaces medical exam (~$150/applicant)' },
  dynamic_premium:  { savingsFraming: 'Ongoing behaviour pricing',    savingsMultiplier: 1.0,  additionalNote: 'Value accrues over policy lifetime' },
  claims_reduction: { savingsFraming: 'Claims event avoidance',       savingsMultiplier: 1.2,  additionalNote: 'Highest direct per-member savings' },
  renewal:          { savingsFraming: 'Renewal friction reduction',   savingsMultiplier: 0.9,  additionalNote: 'Includes ~$45 lapse prevention per policy' },
  acquisition:      { savingsFraming: 'Risk-adjusted acquisition',    savingsMultiplier: 0.85, additionalNote: 'Savings offset by lower CAC' },
};

// ── Constants ──────────────────────────────────────────────────────

const STREAM_MULTIPLIER = 1.75;
const STREAM_HP_FACTOR = 0.7;

const P_VERIFIED_DEFAULT = 0.25;      // 25% verification uptake (spec §4 default)
const BENEFIT_DURATION_FACTOR = 1.41; // 18-month benefit × v=0.94 discount (18/12 × 0.94)
const ALPHA_S = 0.30;                 // selection bias discount (spec §7)
const ALPHA_R = 0.15;                 // regression-to-mean (spec §7)
export const CAUSAL_ADJUSTMENT_FACTOR =
  P_VERIFIED_DEFAULT * BENEFIT_DURATION_FACTOR * (1 - ALPHA_S) * (1 - ALPHA_R);

// ── Calculator ─────────────────────────────────────────────────────

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
    };
  }

  const metricConfig = METRIC_ACTUARIAL_CONFIG[metric];
  const useCaseConfig = useCase ? USE_CASE_CONFIG[useCase] : null;

  const typeMultiplier = type === 'stream' ? STREAM_MULTIPLIER : 1.0;
  const useCaseMultiplier = useCaseConfig?.savingsMultiplier ?? 1.0;

  const causalFactor = applyAdjustments ? CAUSAL_ADJUSTMENT_FACTOR : 1.0;

  const savingsPerMember =
    metricConfig.baselineClaimCostPerMember *
    metricConfig.claimsReductionRate *
    typeMultiplier *
    useCaseMultiplier *
    causalFactor;

  const displayClaimsReductionRate = applyAdjustments
    ? metricConfig.claimsReductionRate * P_VERIFIED_DEFAULT * (1 - ALPHA_S) * (1 - ALPHA_R)
    : metricConfig.claimsReductionRate;

  const totalProjectedSavings = savingsPerMember * maxParticipants;
  const budgetROI = budgetCeiling > 0 ? totalProjectedSavings / budgetCeiling : 0;

  const streamFactor = type === 'stream' ? STREAM_HP_FACTOR : 1.0;
  const rawHP = metricConfig.suggestedHPBase * streamFactor;
  const suggestedHP = Math.round(Math.min(500, Math.max(25, rawHP)) / 5) * 5;

  const morbidityShiftBps = Math.round(metricConfig.claimsReductionRate * 80 / 5) * 5;
  const paybackMonths = totalProjectedSavings > 0
    ? Math.min(36, Math.round(budgetCeiling / (totalProjectedSavings / 12)))
    : 36;
  const vnbImpactPer1MMAPE = morbidityShiftBps * 4500;

  return {
    claimsReductionRate: displayClaimsReductionRate,
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
  };
}

// ── Metric Comparison ─────────────────────────────────────────────

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
  const useCaseConfig = useCase ? USE_CASE_CONFIG[useCase] : null;
  const typeMultiplier = type === 'stream' ? STREAM_MULTIPLIER : 1.0;
  const useCaseMultiplier = useCaseConfig?.savingsMultiplier ?? 1.0;

  const all: MetricComparison[] = (Object.keys(METRIC_ACTUARIAL_CONFIG) as HealthMetric[]).map((m) => {
    const cfg = METRIC_ACTUARIAL_CONFIG[m];
    return {
      metric: m,
      label: HEALTH_METRIC_LABELS[m],
      savingsPerMember: cfg.baselineClaimCostPerMember * cfg.claimsReductionRate * typeMultiplier * useCaseMultiplier,
      isSelected: m === selectedMetric,
    };
  });

  all.sort((a, b) => b.savingsPerMember - a.savingsPerMember);

  // Always include the selected metric in the top N
  const top = all.slice(0, count);
  if (selectedMetric && !top.some((m) => m.isSelected)) {
    const selected = all.find((m) => m.isSelected);
    if (selected) top[count - 1] = selected;
  }

  return top;
}

// ── Use Case Suggestion ────────────────────────────────────────────

export function suggestUseCase(metric: HealthMetric): CampaignUseCase {
  return METRIC_ACTUARIAL_CONFIG[metric].inferredUseCase;
}

// ── Multi-Metric ROI ───────────────────────────────────────────────

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
  const validMetrics = metrics.filter((m) => m in METRIC_ACTUARIAL_CONFIG);

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
      metrics: validMetrics,
    };
  }

  // Combined claims reduction: 1 - product(1 - ri), dampened for 2+ metrics
  let combinedRate = 1 - validMetrics.reduce(
    (acc, m) => acc * (1 - METRIC_ACTUARIAL_CONFIG[m].claimsReductionRate),
    1,
  );
  if (validMetrics.length >= 2) combinedRate *= 0.75;

  const avgBaselineCost =
    validMetrics.reduce((sum, m) => sum + METRIC_ACTUARIAL_CONFIG[m].baselineClaimCostPerMember, 0) /
    validMetrics.length;

  const useCaseConfig = useCase ? USE_CASE_CONFIG[useCase] : null;
  const typeMultiplier = type === 'stream' ? STREAM_MULTIPLIER : 1.0;
  const useCaseMultiplier = useCaseConfig?.savingsMultiplier ?? 1.0;

  const savingsPerMember = avgBaselineCost * combinedRate * typeMultiplier * useCaseMultiplier;
  const totalProjectedSavings = savingsPerMember * participants;
  const budgetROI = budget > 0 ? totalProjectedSavings / budget : 0;

  const streamFactor = type === 'stream' ? STREAM_HP_FACTOR : 1.0;
  const rawAvgHP =
    validMetrics.reduce((sum, m) => {
      const raw = METRIC_ACTUARIAL_CONFIG[m].suggestedHPBase * streamFactor;
      return sum + Math.round(Math.min(500, Math.max(25, raw)) / 5) * 5;
    }, 0) / validMetrics.length;
  const suggestedHP = Math.round(rawAvgHP / 5) * 5;

  const evidenceLevels = validMetrics.map((m) => METRIC_ACTUARIAL_CONFIG[m].evidenceLevel);
  const evidenceLevel: 'high' | 'medium' | 'low' = evidenceLevels.includes('high')
    ? 'high'
    : evidenceLevels.includes('medium')
    ? 'medium'
    : 'low';

  const morbidityShiftBps = Math.round(combinedRate * 80 / 5) * 5;
  const paybackMonths = totalProjectedSavings > 0
    ? Math.min(36, Math.round(budget / (totalProjectedSavings / 12)))
    : 36;
  const vnbImpactPer1MMAPE = morbidityShiftBps * 4500;

  return {
    claimsReductionRate: combinedRate,
    baselineCostPerMember: avgBaselineCost,
    savingsPerMember,
    totalProjectedSavings,
    budgetROI,
    suggestedHP,
    evidenceNote: `Combined ${validMetrics.length}-metric model`,
    evidenceLevel,
    savingsFraming: useCaseConfig?.savingsFraming ?? '',
    additionalNote: useCaseConfig?.additionalNote ?? null,
    isReady: true,
    adjustmentsApplied: false,
    morbidityShiftBps,
    paybackMonths,
    vnbImpactPer1MMAPE,
    metrics: validMetrics,
  };
}
