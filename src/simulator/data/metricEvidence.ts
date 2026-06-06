import type { HealthMetric } from '@/types';
import { METRIC_ACTUARIAL_CONFIG } from '@/utils/actuarial';

// ── Types ────────────────────────────────────────────────────────────

export interface ValueRange {
  low: number;
  high: number;
}

export type MetricCategory = 'cardiac' | 'sleep' | 'respiratory' | 'activity' | 'clinical';
export type RequiredSignal = 'phone' | 'wearable' | 'app' | 'clinical';

export interface MetricEvidenceChain {
  metric: HealthMetric;
  label: string;
  category: MetricCategory;
  requiredSignal: RequiredSignal;

  /** % of insured population at risk for this metric */
  populationAtRiskPct: ValueRange;
  /** Human-readable risk definition */
  riskDefinition: string;
  populationSource: string;

  /** Behaviour shift from campaign intervention */
  behaviourShift: { label: string; value: ValueRange; unit: string };
  /** Biomarker shift from sustained behaviour change */
  markerShift: { label: string; value: ValueRange; unit: string };
  /** % of participants who show improvement */
  improvedSharePct: ValueRange;
  /** % of improvers who sustain at 6+ months */
  sustainedRatePct: ValueRange;
  interventionSources: string[];

  /** Dose-response: mortality risk reduction for improvers */
  mortalityRiskReduction: ValueRange;
  /** Dose-response: morbidity risk reduction for improvers */
  morbidityRiskReduction: ValueRange;
  doseResponseSource: string;
  doseResponseSampleSize: number;

  /** From METRIC_ACTUARIAL_CONFIG — baseline annual claim cost per at-risk member */
  baselineClaimCost: number;
  /** Realization factor (0-1) for converting modeled to real savings */
  realizationFactor: number;
  /** Expected improvement rate from the actuarial model */
  expectedImprovementRate: number;
  /** Months before outcomes appear */
  outcomeLatencyMonths: number;
  /** Evidence quality */
  evidenceLevel: 'high' | 'medium' | 'low';
}

// ── Evidence Chains ──────────────────────────────────────────────────

function actConfig(metric: HealthMetric) {
  return METRIC_ACTUARIAL_CONFIG[metric];
}

export const METRIC_EVIDENCE: MetricEvidenceChain[] = [
  // ── VO2 Max ──
  {
    metric: 'vo2_max',
    label: 'VO₂ Max (Cardiorespiratory Fitness)',
    category: 'cardiac',
    requiredSignal: 'wearable',
    populationAtRiskPct: { low: 0.30, high: 0.45 },
    riskDefinition: 'VO₂ Max < 35 mL/kg/min (low fitness)',
    populationSource: 'Mandsager K et al. 2018, JAMA Network Open. n=122,007',
    behaviourShift: { label: 'Zone 2 sessions/week', value: { low: 1.5, high: 2.8 }, unit: 'sessions/wk' },
    markerShift: { label: 'VO₂ Max improvement', value: { low: 1.2, high: 2.4 }, unit: 'mL/kg/min' },
    improvedSharePct: { low: 0.30, high: 0.42 },
    sustainedRatePct: { low: 0.55, high: 0.72 },
    interventionSources: [
      'AHA Scientific Statement: CRF as vital sign',
      'BehaviorShiftEvidence: +2.1 sessions/wk, +1.8 mL/kg/min trend',
    ],
    mortalityRiskReduction: { low: 0.15, high: 0.35 },
    morbidityRiskReduction: { low: 0.10, high: 0.25 },
    doseResponseSource: 'Mandsager K et al. 2018, JAMA Network Open. n=122,007. Low-to-moderate fitness HR 0.50.',
    doseResponseSampleSize: 122_007,
    baselineClaimCost: actConfig('vo2_max').baselineClaimCostPerMember,
    realizationFactor: actConfig('vo2_max').realizationFactor,
    expectedImprovementRate: actConfig('vo2_max').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('vo2_max').outcomeLatencyMonths,
    evidenceLevel: actConfig('vo2_max').evidenceLevel,
  },

  // ── HRV ──
  {
    metric: 'hrv',
    label: 'Heart Rate Variability',
    category: 'cardiac',
    requiredSignal: 'wearable',
    populationAtRiskPct: { low: 0.20, high: 0.35 },
    riskDefinition: 'SDNN < 50 ms or RMSSD < 20 ms (low HRV)',
    populationSource: 'Hilton MF et al. 2022, Neuroscience & Biobehavioral Reviews. n=38,008',
    behaviourShift: { label: 'Recovery days in range', value: { low: 14, high: 24 }, unit: 'days' },
    markerShift: { label: 'HRV median increase', value: { low: 5.0, high: 10.2 }, unit: 'ms' },
    improvedSharePct: { low: 0.26, high: 0.38 },
    sustainedRatePct: { low: 0.50, high: 0.68 },
    interventionSources: [
      'BehaviorShiftEvidence: +19 days in range, +7.6 ms median',
      'Internal verified trend logic for autonomic recovery',
    ],
    mortalityRiskReduction: { low: 0.08, high: 0.20 },
    morbidityRiskReduction: { low: 0.06, high: 0.15 },
    doseResponseSource: 'Hilton MF et al. 2022, Neuroscience & Biobehavioral Reviews. n=38,008. Lower HRV = universal mortality predictor.',
    doseResponseSampleSize: 38_008,
    baselineClaimCost: actConfig('hrv').baselineClaimCostPerMember,
    realizationFactor: actConfig('hrv').realizationFactor,
    expectedImprovementRate: actConfig('hrv').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('hrv').outcomeLatencyMonths,
    evidenceLevel: actConfig('hrv').evidenceLevel,
  },

  // ── Sleep Hours ──
  {
    metric: 'sleep_hours',
    label: 'Sleep Regularity',
    category: 'sleep',
    requiredSignal: 'wearable',
    populationAtRiskPct: { low: 0.35, high: 0.50 },
    riskDefinition: 'Habitual sleep < 6h or > 9h (U-shaped risk)',
    populationSource: 'Cappuccio FP et al. 2010, Sleep. n=1,382,999',
    behaviourShift: { label: 'Consistent sleep nights/week', value: { low: 3.2, high: 5.8 }, unit: 'nights/wk' },
    markerShift: { label: 'Sleep duration increase', value: { low: 32, high: 68 }, unit: 'min/night' },
    improvedSharePct: { low: 0.33, high: 0.45 },
    sustainedRatePct: { low: 0.52, high: 0.70 },
    interventionSources: [
      'BehaviorShiftEvidence: +4.6 nights/wk consistent, +52 min/night',
      'Cappuccio 2010 meta-analysis: short sleep RR 1.12',
    ],
    mortalityRiskReduction: { low: 0.06, high: 0.14 },
    morbidityRiskReduction: { low: 0.08, high: 0.18 },
    doseResponseSource: 'Cappuccio FP et al. 2010, Sleep. n=1,382,999. Short sleep RR 1.12; long sleep RR 1.30.',
    doseResponseSampleSize: 1_382_999,
    baselineClaimCost: actConfig('sleep_hours').baselineClaimCostPerMember,
    realizationFactor: actConfig('sleep_hours').realizationFactor,
    expectedImprovementRate: actConfig('sleep_hours').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('sleep_hours').outcomeLatencyMonths,
    evidenceLevel: actConfig('sleep_hours').evidenceLevel,
  },

  // ── Resting Heart Rate ──
  {
    metric: 'heart_rate_resting',
    label: 'Resting Heart Rate',
    category: 'cardiac',
    requiredSignal: 'wearable',
    populationAtRiskPct: { low: 0.15, high: 0.28 },
    riskDefinition: 'Resting HR > 80 bpm (elevated cardiac load)',
    populationSource: 'Zhang D et al. 2016, CMAJ. Meta-analysis of resting HR and mortality.',
    behaviourShift: { label: 'Recovery adherence days', value: { low: 16, high: 30 }, unit: 'days' },
    markerShift: { label: 'Resting HR reduction', value: { low: 2.0, high: 4.8 }, unit: 'bpm' },
    improvedSharePct: { low: 0.28, high: 0.38 },
    sustainedRatePct: { low: 0.55, high: 0.72 },
    interventionSources: [
      'BehaviorShiftEvidence: +23 recovery days, -3.4 bpm median',
      'Zhang 2016 meta-analysis: each +10 bpm RHR → 9% higher mortality',
    ],
    mortalityRiskReduction: { low: 0.05, high: 0.12 },
    morbidityRiskReduction: { low: 0.04, high: 0.10 },
    doseResponseSource: 'Zhang D et al. 2016, CMAJ. Each 10 bpm increase in RHR → 9% higher all-cause mortality.',
    doseResponseSampleSize: 502_000,
    baselineClaimCost: actConfig('heart_rate_resting').baselineClaimCostPerMember,
    realizationFactor: actConfig('heart_rate_resting').realizationFactor,
    expectedImprovementRate: actConfig('heart_rate_resting').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('heart_rate_resting').outcomeLatencyMonths,
    evidenceLevel: actConfig('heart_rate_resting').evidenceLevel,
  },

  // ── Active Minutes ──
  {
    metric: 'active_minutes',
    label: 'Active Minutes',
    category: 'activity',
    requiredSignal: 'phone',
    populationAtRiskPct: { low: 0.35, high: 0.62 },
    riskDefinition: '< 150 min/week moderate activity (below WHO guideline)',
    populationSource: 'HK BRFSS 2020 (61% insufficient); SG NPHS 2022 (36%)',
    behaviourShift: { label: 'Weekly active minutes gained', value: { low: 42, high: 86 }, unit: 'min/wk' },
    markerShift: { label: 'Activity trajectory improvement', value: { low: 12, high: 24 }, unit: '% meeting WHO' },
    improvedSharePct: { low: 0.35, high: 0.48 },
    sustainedRatePct: { low: 0.48, high: 0.65 },
    interventionSources: [
      'BehaviorShiftEvidence: +64 min/wk, +18% meeting WHO baseline',
      'BMJ physical activity trajectory study (2019)',
    ],
    mortalityRiskReduction: { low: 0.10, high: 0.22 },
    morbidityRiskReduction: { low: 0.12, high: 0.28 },
    doseResponseSource: 'Lear SA et al. 2017, Lancet (PURE Study). n=130,843. Meeting WHO guidelines → 20% CVD reduction.',
    doseResponseSampleSize: 130_843,
    baselineClaimCost: actConfig('active_minutes').baselineClaimCostPerMember,
    realizationFactor: actConfig('active_minutes').realizationFactor,
    expectedImprovementRate: actConfig('active_minutes').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('active_minutes').outcomeLatencyMonths,
    evidenceLevel: actConfig('active_minutes').evidenceLevel,
  },

  // ── HbA1c ──
  {
    metric: 'hba1c',
    label: 'HbA1c Screening',
    category: 'clinical',
    requiredSignal: 'clinical',
    populationAtRiskPct: { low: 0.12, high: 0.22 },
    riskDefinition: 'HbA1c ≥ 5.7% (pre-diabetes) or ≥ 6.5% (diabetes)',
    populationSource: 'IDF Diabetes Atlas 2021; SG National Health Survey 2019',
    behaviourShift: { label: 'Screening completion rate', value: { low: 0.45, high: 0.68 }, unit: '% completed' },
    markerShift: { label: 'HbA1c improvement', value: { low: 0.2, high: 0.5 }, unit: '% points' },
    improvedSharePct: { low: 0.20, high: 0.30 },
    sustainedRatePct: { low: 0.60, high: 0.78 },
    interventionSources: [
      'IDF Diabetes Atlas 2021',
      'Diabetes Prevention Programme: lifestyle intervention reduces T2D incidence by 58%',
    ],
    mortalityRiskReduction: { low: 0.08, high: 0.18 },
    morbidityRiskReduction: { low: 0.15, high: 0.30 },
    doseResponseSource: 'Diabetes Prevention Programme. n=3,234. Lifestyle intervention → 58% T2D incidence reduction.',
    doseResponseSampleSize: 3_234,
    baselineClaimCost: actConfig('hba1c').baselineClaimCostPerMember,
    realizationFactor: actConfig('hba1c').realizationFactor,
    expectedImprovementRate: actConfig('hba1c').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('hba1c').outcomeLatencyMonths,
    evidenceLevel: actConfig('hba1c').evidenceLevel,
  },

  // ── Blood Pressure ──
  {
    metric: 'blood_pressure',
    label: 'Blood Pressure Monitoring',
    category: 'clinical',
    requiredSignal: 'clinical',
    populationAtRiskPct: { low: 0.25, high: 0.38 },
    riskDefinition: 'SBP ≥ 130 mmHg or DBP ≥ 80 mmHg (Stage 1+ hypertension)',
    populationSource: 'WHO Global Health Observatory; HK Population Health Survey 2020',
    behaviourShift: { label: 'Monitoring compliance', value: { low: 0.40, high: 0.62 }, unit: '% compliant' },
    markerShift: { label: 'Systolic BP reduction', value: { low: 3.0, high: 8.0 }, unit: 'mmHg' },
    improvedSharePct: { low: 0.28, high: 0.40 },
    sustainedRatePct: { low: 0.58, high: 0.75 },
    interventionSources: [
      'SPRINT trial: intensive BP control → 25% lower CV events',
      'WHO CVD risk management guidelines',
    ],
    mortalityRiskReduction: { low: 0.10, high: 0.25 },
    morbidityRiskReduction: { low: 0.15, high: 0.30 },
    doseResponseSource: 'SPRINT Research Group 2015, NEJM. n=9,361. Intensive BP control → 25% lower CV events.',
    doseResponseSampleSize: 9_361,
    baselineClaimCost: actConfig('blood_pressure').baselineClaimCostPerMember,
    realizationFactor: actConfig('blood_pressure').realizationFactor,
    expectedImprovementRate: actConfig('blood_pressure').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('blood_pressure').outcomeLatencyMonths,
    evidenceLevel: actConfig('blood_pressure').evidenceLevel,
  },

  // ── SpO2 ──
  {
    metric: 'spo2',
    label: 'SpO₂ Screening',
    category: 'respiratory',
    requiredSignal: 'wearable',
    populationAtRiskPct: { low: 0.05, high: 0.12 },
    riskDefinition: 'Resting SpO₂ < 95% (possible respiratory or sleep disorder)',
    populationSource: 'Operational evidence from wearable screening cohorts',
    behaviourShift: { label: 'Screening completeness', value: { low: 0.22, high: 0.35 }, unit: '% completed check' },
    markerShift: { label: 'Proof-ready rate', value: { low: 0.15, high: 0.28 }, unit: '% proof-ready' },
    improvedSharePct: { low: 0.22, high: 0.34 },
    sustainedRatePct: { low: 0.45, high: 0.62 },
    interventionSources: [
      'BehaviorShiftEvidence: +28% completed check, +21% proof-ready',
      'Operational quality framework for underwriting workflow',
    ],
    mortalityRiskReduction: { low: 0.03, high: 0.08 },
    morbidityRiskReduction: { low: 0.04, high: 0.10 },
    doseResponseSource: 'Operational evidence; respiratory risk screening meta-review. Directional only.',
    doseResponseSampleSize: 15_000,
    baselineClaimCost: actConfig('spo2').baselineClaimCostPerMember,
    realizationFactor: actConfig('spo2').realizationFactor,
    expectedImprovementRate: actConfig('spo2').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('spo2').outcomeLatencyMonths,
    evidenceLevel: actConfig('spo2').evidenceLevel,
  },

  // ── Steps (kept for completeness) ──
  {
    metric: 'steps',
    label: 'Daily Steps',
    category: 'activity',
    requiredSignal: 'phone',
    populationAtRiskPct: { low: 0.35, high: 0.62 },
    riskDefinition: '< 5,000 steps/day (sedentary classification)',
    populationSource: 'Tudor-Locke & Bassett 2004; HK BRFSS 2020',
    behaviourShift: { label: 'Daily step increase', value: { low: 800, high: 2000 }, unit: 'steps/day' },
    markerShift: { label: 'Steps sustained at 12 mo', value: { low: 500, high: 1500 }, unit: 'steps/day' },
    improvedSharePct: { low: 0.30, high: 0.45 },
    sustainedRatePct: { low: 0.40, high: 0.60 },
    interventionSources: [
      'Patel MS et al. 2016: +1,600 steps/day with loss-framed incentives',
      'Discovery Vitality 13-year longitudinal: +1,200 steps avg',
    ],
    mortalityRiskReduction: { low: 0.10, high: 0.30 },
    morbidityRiskReduction: { low: 0.08, high: 0.22 },
    doseResponseSource: 'Paluch AE et al. 2022, Lancet Public Health. n=47,488. Non-linear dose-response.',
    doseResponseSampleSize: 47_488,
    baselineClaimCost: actConfig('steps').baselineClaimCostPerMember,
    realizationFactor: actConfig('steps').realizationFactor,
    expectedImprovementRate: actConfig('steps').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('steps').outcomeLatencyMonths,
    evidenceLevel: actConfig('steps').evidenceLevel,
  },

  // ── Sleep Quality ──
  {
    metric: 'sleep_quality',
    label: 'Sleep Quality',
    category: 'sleep',
    requiredSignal: 'wearable',
    populationAtRiskPct: { low: 0.30, high: 0.45 },
    riskDefinition: 'PSQI > 5 (poor subjective sleep quality)',
    populationSource: 'Buysse DJ et al. 1989; global sleep quality surveys',
    behaviourShift: { label: 'Sleep quality score gain', value: { low: 7, high: 15 }, unit: 'quality points' },
    markerShift: { label: 'Stable nights per week', value: { low: 2.5, high: 5.0 }, unit: 'nights/wk' },
    improvedSharePct: { low: 0.30, high: 0.42 },
    sustainedRatePct: { low: 0.50, high: 0.68 },
    interventionSources: [
      'BehaviorShiftEvidence: +11 quality points, +3.8 stable nights/wk',
      'Sleep and cardiovascular outcomes review',
    ],
    mortalityRiskReduction: { low: 0.04, high: 0.12 },
    morbidityRiskReduction: { low: 0.06, high: 0.16 },
    doseResponseSource: 'Itani O et al. 2017, Sleep Medicine. n=5,134,036. Sleep quality and cardiometabolic outcomes.',
    doseResponseSampleSize: 5_134_036,
    baselineClaimCost: actConfig('sleep_quality').baselineClaimCostPerMember,
    realizationFactor: actConfig('sleep_quality').realizationFactor,
    expectedImprovementRate: actConfig('sleep_quality').expectedImprovementRate,
    outcomeLatencyMonths: actConfig('sleep_quality').outcomeLatencyMonths,
    evidenceLevel: actConfig('sleep_quality').evidenceLevel,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

export function getMetricEvidence(metric: HealthMetric): MetricEvidenceChain | undefined {
  return METRIC_EVIDENCE.find((e) => e.metric === metric);
}

export function getEvidenceByCategory(category: MetricCategory): MetricEvidenceChain[] {
  return METRIC_EVIDENCE.filter((e) => e.category === category);
}

export function getEvidenceBySignal(signal: RequiredSignal): MetricEvidenceChain[] {
  return METRIC_EVIDENCE.filter((e) => e.requiredSignal === signal);
}
