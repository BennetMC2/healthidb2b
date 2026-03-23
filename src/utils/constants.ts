import type { ReputationTier, DataSource, CampaignType, CampaignStatus, CampaignUseCase, ProofType, HealthMetric } from '@/types';

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
  sleep_hours: 'Sleep Hours',
  sleep_quality: 'Sleep Quality',
  heart_rate_resting: 'Resting Heart Rate',
  hrv: 'Heart Rate Variability',
  active_minutes: 'Active Minutes',
  stress_score: 'Stress Score',
  hydration: 'Hydration',
  body_composition: 'Body Composition',
  blood_glucose: 'Blood Glucose',
  bmi: 'BMI',
  blood_pressure: 'Blood Pressure',
  cholesterol: 'Cholesterol',
  hba1c: 'HbA1c',
  vo2_max: 'VO2 Max',
  spo2: 'Blood Oxygen (SpO2)',
  respiratory_rate: 'Respiratory Rate',
  body_temp_deviation: 'Temp Deviation',
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
