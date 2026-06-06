import type { Market, ProductType, DeviceClass, EngagementTier, BaselineRisk, BehaviourLeverId, InterventionId, TimeHorizon, StudyDesign, RewardType, RewardOutcomeTarget, ScenarioStatus } from './types';

export const MARKET_LABELS: Record<Market, string> = {
  hong_kong: 'Hong Kong',
  singapore: 'Singapore',
  apac_generic: 'APAC Generic',
  global: 'Global',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  individual_life: 'Individual Life',
  group_life: 'Group Life',
  health: 'Health',
  corporate_wellness: 'Corporate Wellness',
};

export const DEVICE_CLASS_LABELS: Record<DeviceClass, string> = {
  advanced_wearable: 'Advanced Wearable',
  basic_wearable: 'Basic Wearable',
  ring: 'Ring / Watch',
  clinical: 'Clinical Devices',
  mixed: 'Mixed',
};

export const ENGAGEMENT_TIER_LABELS: Record<EngagementTier, string> = {
  high: 'High Engagement',
  medium: 'Medium Engagement',
  low: 'Low Engagement',
};

export const BASELINE_RISK_LABELS: Record<BaselineRisk, string> = {
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
};

export const BEHAVIOUR_LEVER_LABELS: Record<BehaviourLeverId, string> = {
  activity: 'Activity',
  sleep: 'Sleep',
  cardiovascular: 'Cardiovascular',
  body_composition: 'Body Composition',
  stress: 'Stress',
  smoking: 'Smoking',
};

export const INTERVENTION_LABELS: Record<InterventionId, string> = {
  activity_uplift: 'Activity Uplift',
  sleep_recovery: 'Sleep & Recovery',
  cv_risk_reduction: 'CV Risk Reduction',
};

export const TIME_HORIZON_LABELS: Record<TimeHorizon, string> = {
  '90d': '90 Days',
  '1y': '1 Year',
  '3y': '3 Years',
  '5y': '5 Years',
};

export const TIME_HORIZON_MONTHS: Record<TimeHorizon, number> = {
  '90d': 3,
  '1y': 12,
  '3y': 36,
  '5y': 60,
};

export const STUDY_DESIGN_LABELS: Record<StudyDesign, string> = {
  rct: 'Randomised Controlled Trial',
  meta_analysis: 'Meta-Analysis',
  cohort_study: 'Cohort Study',
  industry_review: 'Industry Review',
};

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  cash: 'Cash',
  loyalty: 'Loyalty Points',
  health_aspirational: 'Health Aspirational',
  status: 'Status / Tier',
};

export const REWARD_OUTCOME_LABELS: Record<RewardOutcomeTarget, string> = {
  ltv: 'Lifetime Value',
  retention: 'Retention',
  claims: 'Claims Reduction',
  cross_sell: 'Cross-Sell',
};

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  draft: 'Draft',
  configured: 'Configured',
  completed: 'Completed',
};

export const MODEL_VERSION = 'ABM-v1.0';

export const DEFAULT_ASSUMPTIONS = {
  discountRate: 0.08,
  dropoutRate: 0.25,
  verificationRate: 0.31,
  claimsInflation: 0.04,
  realizationFactor: 0.65,
} as const;

export const DEFAULT_REWARD_CEILING_PCT = 0.70;

export const LEVER_COLORS: Record<BehaviourLeverId, string> = {
  activity: '#22c55e',
  sleep: '#8b5cf6',
  cardiovascular: '#ef4444',
  body_composition: '#f59e0b',
  stress: '#06b6d4',
  smoking: '#6b7280',
};
