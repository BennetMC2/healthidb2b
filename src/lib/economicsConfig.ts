import type { CampaignUseCase, HealthMetric } from '@/types';

// ===========================================================================
// Engine-backed economics CONFIG (data only — no React, no store imports).
// Kept as a leaf module so the model store can import the floor config without
// a circular dependency on the economics hook (which lives in economics.ts).
// ===========================================================================

export interface MetricActuarialConfig {
  baselineClaimCostPerMember: number;
  riskSignalRate: number;
  evidenceLevel: 'high' | 'medium' | 'low';
  evidenceNote: string;
  inferredUseCase: CampaignUseCase;
  suggestedHPBase: number;
  realizationFactor: number;
  expectedImprovementRate: number;
  outcomeLatencyMonths: number;
  engineMapped: boolean;
}

export interface UseCaseConfig {
  savingsFraming: string;
  realizationMultiplier: number;
  scenarioHorizonMonths: number;
  expectedVerificationRate: number;
  additionalNote: string | null;
}

export interface EconomicsConfig {
  metricConfig: Record<HealthMetric, MetricActuarialConfig>;
  useCaseConfig: Record<CampaignUseCase, UseCaseConfig>;
}

// Model-dependent inputs the server derives from the resolved assumption set.
export interface ModelEconomics {
  modelScalar: number; // realization multiplier vs. the floor (Model 1 == 1)
  claimsBaseline: { steps: number; vo2max: number; sleep: number; bp_screening: number; hba1c_screening: number };
}

// ── Floor (Model 1) claims baselines — from EVIDENCE_ASSUMPTION_SET v1. ──
const FLOOR_CLAIMS_BASELINE: ModelEconomics['claimsBaseline'] = {
  steps: 900,
  vo2max: 900,
  sleep: 880,
  bp_screening: 950,
  hba1c_screening: 1000,
};

export const FLOOR_METRIC_CONFIG: Record<HealthMetric, MetricActuarialConfig> = {
  hba1c:               { baselineClaimCostPerMember: FLOOR_CLAIMS_BASELINE.hba1c_screening, riskSignalRate: 0.14, evidenceLevel: 'high',   evidenceNote: 'HbA1c 1% reduction → ~2% all-cause cost reduction (CMRO 2020); prevalence-gated to poorly controlled diabetics', inferredUseCase: 'underwriting',    suggestedHPBase: 150, realizationFactor: 0.55, expectedImprovementRate: 0.22, outcomeLatencyMonths: 9, engineMapped: true },
  blood_pressure:      { baselineClaimCostPerMember: FLOOR_CLAIMS_BASELINE.bp_screening,    riskSignalRate: 0.10, evidenceLevel: 'high',   evidenceNote: 'BP control is cost-effective on 1-3yr window; larger savings on ≥5yr (CDC SMBP, Bress 2017 NEJM)',     inferredUseCase: 'claims_reduction', suggestedHPBase: 120, realizationFactor: 0.50, expectedImprovementRate: 0.15, outcomeLatencyMonths: 7, engineMapped: true },
  vo2_max:             { baselineClaimCostPerMember: FLOOR_CLAIMS_BASELINE.vo2max,          riskSignalRate: 0.13, evidenceLevel: 'high',   evidenceNote: 'VO₂ max: ~5-6% claims per MET gained (Myers 2018, Bachmann 2015); overlaps steps pathway', inferredUseCase: 'dynamic_premium', suggestedHPBase: 110, realizationFactor: 0.58, expectedImprovementRate: 0.20, outcomeLatencyMonths: 8, engineMapped: true },
  sleep_hours:         { baselineClaimCostPerMember: FLOOR_CLAIMS_BASELINE.sleep,           riskSignalRate: 0.08, evidenceLevel: 'medium', evidenceNote: 'Sleep regularity proxy mapping from insomnia excess-cost literature (Ozminkowski 2007, Wickwire 2019)', inferredUseCase: 'renewal', suggestedHPBase: 70, realizationFactor: 0.42, expectedImprovementRate: 0.12, outcomeLatencyMonths: 7, engineMapped: true },
  sleep_quality:       { baselineClaimCostPerMember: FLOOR_CLAIMS_BASELINE.sleep,           riskSignalRate: 0.07, evidenceLevel: 'medium', evidenceNote: 'Sleep quality is useful as a behavioral trend; shares sleep pathway claims basis', inferredUseCase: 'renewal', suggestedHPBase: 65, realizationFactor: 0.38, expectedImprovementRate: 0.10, outcomeLatencyMonths: 7, engineMapped: true },
  steps:               { baselineClaimCostPerMember: FLOOR_CLAIMS_BASELINE.steps,           riskSignalRate: 0.10, evidenceLevel: 'medium', evidenceNote: 'Patel 2011 Discovery book (n=304k): became-active −6% hospital costs; Sci Rep 2021 Japan panel', inferredUseCase: 'acquisition', suggestedHPBase: 45, realizationFactor: 0.42, expectedImprovementRate: 0.11, outcomeLatencyMonths: 5, engineMapped: true },
  blood_glucose:       { baselineClaimCostPerMember: 1050, riskSignalRate: 0.12, evidenceLevel: 'high',   evidenceNote: 'Fasting glucose is a strong metabolic risk discriminator; shares hba1c pathway economics',       inferredUseCase: 'underwriting',    suggestedHPBase: 120, realizationFactor: 0.52, expectedImprovementRate: 0.18, outcomeLatencyMonths: 8, engineMapped: false },
  cholesterol:         { baselineClaimCostPerMember: 950,  riskSignalRate: 0.10, evidenceLevel: 'high',   evidenceNote: 'Lipid panels remain a strong cardiovascular underwriting signal', inferredUseCase: 'underwriting',    suggestedHPBase: 130, realizationFactor: 0.50, expectedImprovementRate: 0.15, outcomeLatencyMonths: 10, engineMapped: false },
  bmi:                 { baselineClaimCostPerMember: 920,  riskSignalRate: 0.06, evidenceLevel: 'medium', evidenceNote: 'BMI is broad and directionally useful, but blunt in isolation',   inferredUseCase: 'underwriting',    suggestedHPBase: 90,  realizationFactor: 0.38, expectedImprovementRate: 0.08, outcomeLatencyMonths: 11, engineMapped: false },
  hrv:                 { baselineClaimCostPerMember: 900,  riskSignalRate: 0.10, evidenceLevel: 'medium', evidenceNote: 'HRV is promising but still more emerging than settled actuarial input', inferredUseCase: 'claims_reduction', suggestedHPBase: 100, realizationFactor: 0.52, expectedImprovementRate: 0.16, outcomeLatencyMonths: 6, engineMapped: false },
  heart_rate_resting:  { baselineClaimCostPerMember: 900,  riskSignalRate: 0.08, evidenceLevel: 'medium', evidenceNote: 'Resting heart rate is a good longitudinal fitness proxy',         inferredUseCase: 'dynamic_premium', suggestedHPBase: 80,  realizationFactor: 0.44, expectedImprovementRate: 0.11, outcomeLatencyMonths: 6, engineMapped: false },
  respiratory_rate:    { baselineClaimCostPerMember: 880,  riskSignalRate: 0.05, evidenceLevel: 'medium', evidenceNote: 'Respiratory rate is useful but not yet a mainstream pricing input', inferredUseCase: 'dynamic_premium', suggestedHPBase: 70,  realizationFactor: 0.34, expectedImprovementRate: 0.06, outcomeLatencyMonths: 6, engineMapped: false },
  spo2:                { baselineClaimCostPerMember: 880,  riskSignalRate: 0.04, evidenceLevel: 'medium', evidenceNote: 'SpO₂ is useful as a screening gate more than a long-run outcome driver', inferredUseCase: 'acquisition', suggestedHPBase: 50, realizationFactor: 0.30, expectedImprovementRate: 0.04, outcomeLatencyMonths: 4, engineMapped: false },
  active_minutes:      { baselineClaimCostPerMember: 900,  riskSignalRate: 0.09, evidenceLevel: 'medium', evidenceNote: 'Activity adherence overlaps steps pathway; credible but indirect for claims impact', inferredUseCase: 'acquisition', suggestedHPBase: 65, realizationFactor: 0.42, expectedImprovementRate: 0.11, outcomeLatencyMonths: 6, engineMapped: false },
  stress_score:        { baselineClaimCostPerMember: 880,  riskSignalRate: 0.05, evidenceLevel: 'medium', evidenceNote: 'Stress scores may support intervention targeting more than direct pricing', inferredUseCase: 'claims_reduction', suggestedHPBase: 65, realizationFactor: 0.36, expectedImprovementRate: 0.08, outcomeLatencyMonths: 6, engineMapped: false },
  body_composition:    { baselineClaimCostPerMember: 920,  riskSignalRate: 0.04, evidenceLevel: 'low',    evidenceNote: 'Body composition adds context, but usually needs supporting signals', inferredUseCase: 'underwriting', suggestedHPBase: 60, realizationFactor: 0.24, expectedImprovementRate: 0.05, outcomeLatencyMonths: 10, engineMapped: false },
  hydration:           { baselineClaimCostPerMember: 880,  riskSignalRate: 0.03, evidenceLevel: 'low',    evidenceNote: 'Hydration is mainly an engagement signal at this stage', inferredUseCase: 'renewal', suggestedHPBase: 40, realizationFactor: 0.18, expectedImprovementRate: 0.03, outcomeLatencyMonths: 4, engineMapped: false },
  body_temp_deviation: { baselineClaimCostPerMember: 880,  riskSignalRate: 0.03, evidenceLevel: 'low',    evidenceNote: 'Temperature variation is operationally interesting but commercially immature', inferredUseCase: 'acquisition', suggestedHPBase: 45, realizationFactor: 0.20, expectedImprovementRate: 0.04, outcomeLatencyMonths: 4, engineMapped: false },
};

export const FLOOR_USE_CASE_CONFIG: Record<CampaignUseCase, UseCaseConfig> = {
  underwriting:     { savingsFraming: 'Proof completion and faster risk selection', realizationMultiplier: 0.96, scenarioHorizonMonths: 12, expectedVerificationRate: 0.31, additionalNote: 'Best for cycle-time, review avoidance, and clean proof receipts.' },
  dynamic_premium:  { savingsFraming: 'Behavior-linked renewal and pricing discipline', realizationMultiplier: 0.92, scenarioHorizonMonths: 18, expectedVerificationRate: 0.27, additionalNote: 'Value compounds if longitudinal signals stay stable over time.' },
  claims_reduction: { savingsFraming: 'Healthy-life value uplift from modifiable risk', realizationMultiplier: 1.08, scenarioHorizonMonths: 18, expectedVerificationRate: 0.29, additionalNote: 'Most strategic upside, but also the highest proof burden.' },
  renewal:          { savingsFraming: 'Retention and renewal operating efficiency', realizationMultiplier: 0.84, scenarioHorizonMonths: 12, expectedVerificationRate: 0.24, additionalNote: 'Often strongest as a friction-reduction and engagement motion.' },
  acquisition:      { savingsFraming: 'Risk-adjusted acquisition and consented onboarding', realizationMultiplier: 0.78, scenarioHorizonMonths: 9, expectedVerificationRate: 0.22, additionalNote: 'Easiest commercial wedge because integration and proof burden are lower.' },
};

export const FLOOR_ECONOMICS: EconomicsConfig = {
  metricConfig: FLOOR_METRIC_CONFIG,
  useCaseConfig: FLOOR_USE_CASE_CONFIG,
};

// Baked per-model overrides so the static demo shows model-switch effects even
// without the engine API. GET /api/economics is authoritative when reachable.
// Model 1 == 1.0 (floor); Model 2 lifts realization via its higher claims-
// attribution factor (0.45 vs 0.30 → ~1.5×).
export const MODEL_ECONOMICS_FALLBACK: Record<string, ModelEconomics> = {
  'model-1-evidence-floor': { modelScalar: 1, claimsBaseline: FLOOR_CLAIMS_BASELINE },
  'model-2-forward-upside': { modelScalar: 0.45 / 0.3, claimsBaseline: FLOOR_CLAIMS_BASELINE },
  'model-3-ai-sandbox': { modelScalar: 1, claimsBaseline: FLOOR_CLAIMS_BASELINE },
};

// Build the active EconomicsConfig for a Model from its derived inputs. The
// model scalar lifts realised improvement (clamped), which is what makes a
// Forward model re-price upward.
export function deriveEconomics(model: ModelEconomics): EconomicsConfig {
  const metricConfig = Object.fromEntries(
    (Object.keys(FLOOR_METRIC_CONFIG) as HealthMetric[]).map((key) => {
      const base = FLOOR_METRIC_CONFIG[key];
      return [
        key,
        { ...base, realizationFactor: Math.min(0.95, base.realizationFactor * model.modelScalar) },
      ];
    }),
  ) as Record<HealthMetric, MetricActuarialConfig>;
  return { metricConfig, useCaseConfig: FLOOR_USE_CASE_CONFIG };
}
