import type { ReputationTier, DataSource, CampaignType, CampaignStatus, CampaignUseCase, ProofType, HealthMetric, ChallengeOperator } from '@/types';

export const REPUTATION_TIER_ORDER: ReputationTier[] = [
  'high', 'medium', 'low',
];

export const REPUTATION_TIER_LABELS: Record<ReputationTier, string> = {
  high: 'High Trust',
  medium: 'Medium Trust',
  low: 'Low Trust',
};

export const REPUTATION_TIER_COLORS: Record<ReputationTier, string> = {
  high: '#1D7A5E',
  medium: '#B8860B',
  low: '#8896AB',
};

export const TRUST_TIER_DESCRIPTIONS: Record<ReputationTier, string> = {
  high: 'Clinical Proofs (Blood Panels, Doctor Screenings)',
  medium: 'Verified Hardware Data (Apple Watch, Oura)',
  low: 'Self-Reported Logs',
};

export const RISK_COHORTS = [
  'Pre-Diabetic Watchlist',
  'Low-Risk Millennial',
  'Chronic Care Management',
  'Active Lifestyle',
  'Senior Wellness',
  'Mental Health Monitoring',
  'Cardiac Risk Pool',
  'Maternity Track',
];

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  apple_health: 'Apple Health',
  fitbit: 'Fitbit',
  garmin: 'Garmin',
  oura: 'Oura',
  whoop: 'WHOOP',
  google_fit: 'Google Fit',
  samsung_health: 'Samsung Health',
  lab_results: 'Lab Results',
};

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  snapshot: 'Snapshot',
  stream: 'Stream',
};

export const USE_CASE_LABELS: Record<CampaignUseCase, string> = {
  underwriting: 'Underwriting',
  dynamic_premium: 'Dynamic Premium',
  claims_reduction: 'Claims Reduction',
  renewal: 'Renewal',
  acquisition: 'Acquisition',
};

export const CAMPAIGN_USE_CASE_ORDER: CampaignUseCase[] = [
  'underwriting', 'dynamic_premium', 'claims_reduction', 'renewal', 'acquisition',
];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
};

export const PROOF_TYPE_LABELS: Record<ProofType, string> = {
  zk_snark: 'ZK-SNARK',
  zk_stark: 'ZK-STARK',
  bulletproof: 'Bulletproof',
};

export const HEALTH_METRIC_LABELS: Record<HealthMetric, string> = {
  steps: 'Daily Steps',
  sleep_hours: 'Time Asleep',
  sleep_quality: 'Sleep Score',
  heart_rate_resting: 'Resting Heart Rate',
  hrv: 'Heart Rate Variability',
  active_minutes: 'Active Minutes',
  stress_score: 'Stress Score',
  hydration: 'Hydration',
  body_composition: 'Body Composition',
  blood_glucose: 'Fasting Glucose',
  bmi: 'BMI',
  blood_pressure: 'Systolic BP',
  cholesterol: 'Total Cholesterol',
  hba1c: 'HbA1c',
  vo2_max: 'Cardio Fitness (VO₂ Max)',
  spo2: 'Blood Oxygen (SpO₂)',
  respiratory_rate: 'Breathing Rate',
  body_temp_deviation: 'Wrist Temp Variation',
};

export const HEALTH_METRIC_UNITS: Record<HealthMetric, string> = {
  steps: 'steps',
  sleep_hours: 'hrs',
  sleep_quality: 'score',
  heart_rate_resting: 'bpm',
  hrv: 'ms',
  active_minutes: 'min',
  stress_score: 'score',
  hydration: 'ml',
  body_composition: '%',
  blood_glucose: 'mg/dL',
  bmi: 'kg/m²',
  blood_pressure: 'mmHg',
  cholesterol: 'mg/dL',
  hba1c: '%',
  vo2_max: 'mL/kg/min',
  spo2: '%',
  respiratory_rate: 'br/min',
  body_temp_deviation: '°C',
};

export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export const REGIONS = ['Singapore', 'Hong Kong', 'Japan', 'South Korea', 'Thailand', 'Malaysia', 'Indonesia', 'India', 'Australia', 'North America', 'Europe'];

// ── Metric Category System ──────────────────────────────────────────

export type MetricCategory = 'cardiac' | 'sleep' | 'respiratory' | 'activity' | 'body' | 'clinical';

export const METRIC_CATEGORIES: Record<MetricCategory, { label: string; icon: string }> = {
  cardiac:     { label: 'Cardiac',      icon: 'Heart' },
  sleep:       { label: 'Sleep',        icon: 'Moon' },
  respiratory: { label: 'Respiratory',  icon: 'Wind' },
  activity:    { label: 'Activity',     icon: 'Flame' },
  body:        { label: 'Body',         icon: 'Scale' },
  clinical:    { label: 'Clinical',     icon: 'FlaskConical' },
};

export const METRIC_CATEGORY_MAP: Record<HealthMetric, MetricCategory> = {
  heart_rate_resting: 'cardiac',
  hrv:                'cardiac',
  vo2_max:            'cardiac',
  sleep_hours:        'sleep',
  sleep_quality:      'sleep',
  respiratory_rate:   'respiratory',
  spo2:               'respiratory',
  steps:              'activity',
  active_minutes:     'activity',
  stress_score:       'activity',
  bmi:                'body',
  body_composition:   'body',
  body_temp_deviation:'body',
  hydration:          'body',
  blood_glucose:      'clinical',
  cholesterol:        'clinical',
  hba1c:              'clinical',
  blood_pressure:     'clinical',
};

export const HIGH_SIGNAL_METRICS: ReadonlySet<HealthMetric> = new Set(['hrv', 'vo2_max']);

export const METRIC_CATEGORY_ORDER: MetricCategory[] = ['cardiac', 'sleep', 'respiratory', 'activity', 'body', 'clinical'];

export const METRIC_CATEGORY_LABELS: Record<MetricCategory, string> = {
  cardiac:     'Cardiac',
  sleep:       'Sleep',
  respiratory: 'Respiratory',
  activity:    'Activity',
  body:        'Body & Wellness',
  clinical:    'Clinical / Lab',
};

export function getMetricsGroupedByCategory(): { category: MetricCategory; label: string; metrics: { key: HealthMetric; label: string }[] }[] {
  return METRIC_CATEGORY_ORDER.map((category) => {
    const metrics = (Object.entries(METRIC_CATEGORY_MAP) as [HealthMetric, MetricCategory][])
      .filter(([, cat]) => cat === category)
      .map(([key]) => ({ key, label: HEALTH_METRIC_LABELS[key] }))
      .sort((a, b) => {
        // High-signal metrics first
        const aHigh = HIGH_SIGNAL_METRICS.has(a.key) ? 0 : 1;
        const bHigh = HIGH_SIGNAL_METRICS.has(b.key) ? 0 : 1;
        return aHigh - bHigh;
      });
    return { category, label: METRIC_CATEGORY_LABELS[category], metrics };
  });
}

export function formatOperator(op: ChallengeOperator | string): string {
  switch (op) {
    case 'gte': return '≥';
    case 'lte': return '≤';
    case 'eq':  return '=';
    case 'between': return 'between';
    default: return op;
  }
}
