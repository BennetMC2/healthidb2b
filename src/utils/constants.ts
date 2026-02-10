import type { ReputationTier, DataSource, CampaignType, CampaignStatus, ProofType, HealthMetric } from '@/types';

export const REPUTATION_TIER_ORDER: ReputationTier[] = [
  'diamond', 'platinum', 'gold', 'silver', 'bronze',
];

export const REPUTATION_TIER_LABELS: Record<ReputationTier, string> = {
  diamond: 'Diamond',
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const REPUTATION_TIER_COLORS: Record<ReputationTier, string> = {
  diamond: '#7c6bc4',
  platinum: '#5a6acf',
  gold: '#c4920a',
  silver: '#7a7e8f',
  bronze: '#a06828',
};

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
};

export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
