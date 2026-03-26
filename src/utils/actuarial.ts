import type { HealthMetric, CampaignUseCase, CampaignType } from '@/types';

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
  hba1c:              { claimsReductionRate: 0.22, baselineClaimCostPerMember: 2100, evidenceLevel: 'high',   evidenceNote: 'Strong link to diabetes-related claims cost',               inferredUseCase: 'underwriting',    suggestedHPBase: 150 },
  blood_glucose:      { claimsReductionRate: 0.14, baselineClaimCostPerMember: 1800, evidenceLevel: 'high',   evidenceNote: 'Fasting glucose predicts metabolic syndrome onset',         inferredUseCase: 'underwriting',    suggestedHPBase: 120 },
  cholesterol:        { claimsReductionRate: 0.13, baselineClaimCostPerMember: 2400, evidenceLevel: 'high',   evidenceNote: 'Lipid panels correlate with cardiovascular event risk',     inferredUseCase: 'underwriting',    suggestedHPBase: 130 },
  blood_pressure:     { claimsReductionRate: 0.11, baselineClaimCostPerMember: 2000, evidenceLevel: 'high',   evidenceNote: 'Hypertension management reduces ER & cardiac claims',       inferredUseCase: 'claims_reduction', suggestedHPBase: 120 },
  bmi:                { claimsReductionRate: 0.08, baselineClaimCostPerMember: 1600, evidenceLevel: 'medium', evidenceNote: 'BMI is a broad risk proxy; less predictive in isolation',    inferredUseCase: 'underwriting',    suggestedHPBase: 90  },
  vo2_max:            { claimsReductionRate: 0.18, baselineClaimCostPerMember: 1700, evidenceLevel: 'high',   evidenceNote: 'VO₂ max is a top predictor of all-cause mortality',        inferredUseCase: 'dynamic_premium', suggestedHPBase: 110 },
  hrv:                { claimsReductionRate: 0.15, baselineClaimCostPerMember: 1900, evidenceLevel: 'medium', evidenceNote: 'HRV reflects autonomic health; growing actuarial evidence', inferredUseCase: 'claims_reduction', suggestedHPBase: 100 },
  heart_rate_resting: { claimsReductionRate: 0.08, baselineClaimCostPerMember: 1700, evidenceLevel: 'medium', evidenceNote: 'Resting HR tracks cardiovascular fitness over time',        inferredUseCase: 'dynamic_premium', suggestedHPBase: 80  },
  respiratory_rate:   { claimsReductionRate: 0.07, baselineClaimCostPerMember: 1600, evidenceLevel: 'medium', evidenceNote: 'Respiratory rate signals early illness onset',              inferredUseCase: 'dynamic_premium', suggestedHPBase: 70  },
  spo2:               { claimsReductionRate: 0.05, baselineClaimCostPerMember: 1400, evidenceLevel: 'medium', evidenceNote: 'SpO₂ dips useful for sleep apnea screening',               inferredUseCase: 'acquisition',     suggestedHPBase: 50  },
  sleep_hours:        { claimsReductionRate: 0.07, baselineClaimCostPerMember: 1500, evidenceLevel: 'medium', evidenceNote: 'Short sleep linked to higher chronic disease claims',        inferredUseCase: 'renewal',         suggestedHPBase: 70  },
  sleep_quality:      { claimsReductionRate: 0.06, baselineClaimCostPerMember: 1500, evidenceLevel: 'medium', evidenceNote: 'Sleep quality scores complement duration data',             inferredUseCase: 'renewal',         suggestedHPBase: 65  },
  active_minutes:     { claimsReductionRate: 0.10, baselineClaimCostPerMember: 1600, evidenceLevel: 'medium', evidenceNote: 'WHO activity guidelines reduce all-cause risk ~15%',        inferredUseCase: 'acquisition',     suggestedHPBase: 65  },
  steps:              { claimsReductionRate: 0.05, baselineClaimCostPerMember: 1400, evidenceLevel: 'low',    evidenceNote: 'Step counts are directional; low clinical specificity',     inferredUseCase: 'acquisition',     suggestedHPBase: 45  },
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

// ── Calculator ─────────────────────────────────────────────────────

export interface ActuarialROIParams {
  metric: HealthMetric | '';
  type: CampaignType | '';
  useCase: CampaignUseCase | '';
  maxParticipants: number;
  budgetCeiling: number;
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
}

export function calculateActuarialROI(params: ActuarialROIParams): ActuarialROIResult {
  const { metric, type, useCase, maxParticipants, budgetCeiling } = params;

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
    };
  }

  const metricConfig = METRIC_ACTUARIAL_CONFIG[metric];
  const useCaseConfig = useCase ? USE_CASE_CONFIG[useCase] : null;

  const typeMultiplier = type === 'stream' ? STREAM_MULTIPLIER : 1.0;
  const useCaseMultiplier = useCaseConfig?.savingsMultiplier ?? 1.0;

  const savingsPerMember =
    metricConfig.baselineClaimCostPerMember *
    metricConfig.claimsReductionRate *
    typeMultiplier *
    useCaseMultiplier;

  const totalProjectedSavings = savingsPerMember * maxParticipants;
  const budgetROI = budgetCeiling > 0 ? totalProjectedSavings / budgetCeiling : 0;

  const streamFactor = type === 'stream' ? STREAM_HP_FACTOR : 1.0;
  const rawHP = metricConfig.suggestedHPBase * streamFactor;
  const suggestedHP = Math.round(Math.min(500, Math.max(25, rawHP)) / 5) * 5;

  return {
    claimsReductionRate: metricConfig.claimsReductionRate,
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
  };
}

// ── Use Case Suggestion ────────────────────────────────────────────

export function suggestUseCase(metric: HealthMetric): CampaignUseCase {
  return METRIC_ACTUARIAL_CONFIG[metric].inferredUseCase;
}
