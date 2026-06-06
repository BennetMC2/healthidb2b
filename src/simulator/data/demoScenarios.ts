import type { Scenario } from '../types';
import { COHORT_PRESETS } from './cohortPresets';
import { REWARD_PRESETS } from './rewards';
import { DEFAULT_ASSUMPTIONS, DEFAULT_REWARD_CEILING_PCT } from '../constants';

function makeScenario(
  id: string,
  name: string,
  description: string,
  cohortPresetId: string,
  interventions: Scenario['interventions'],
  rewardPresetId: string,
): Scenario {
  const preset = COHORT_PRESETS.find((p) => p.id === cohortPresetId)!;
  const reward = REWARD_PRESETS.find((r) => r.id === rewardPresetId)!;

  return {
    id,
    name,
    description,
    market: preset.definition.market,
    productType: preset.definition.productType,
    cohortPresetId,
    cohortDefinition: preset.definition,
    interventions,
    rewardConfigId: rewardPresetId,
    rewardConfig: reward,
    timeHorizons: ['90d', '1y', '3y'],
    leverBaselines: { ...preset.baselineBehaviour },
    leverTargets: {
      activity: Math.min(1, preset.baselineBehaviour.activity + 0.18),
      sleep: Math.min(1, preset.baselineBehaviour.sleep + 0.12),
      cardiovascular: Math.min(1, preset.baselineBehaviour.cardiovascular + 0.15),
      body_composition: Math.min(1, preset.baselineBehaviour.body_composition + 0.08),
      stress: Math.min(1, preset.baselineBehaviour.stress + 0.10),
      smoking: Math.min(1, preset.baselineBehaviour.smoking + 0.05),
    },
    rewardCeilingPct: DEFAULT_REWARD_CEILING_PCT,
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    status: 'configured',
    createdAt: '2026-05-20T10:00:00Z',
  };
}

export const DEMO_SCENARIOS: Scenario[] = [
  makeScenario(
    'demo_hk_midlife',
    'HK Life — Midlife Activity Uplift',
    'Hong Kong individual life policyholders aged 40-59 with advanced wearables. Steps + VO₂max + active minutes with weekly streak rewards.',
    'hk_midlife_active',
    ['activity_uplift'],
    'weekly_streak',
  ),
  makeScenario(
    'demo_low_engagement',
    'Low-Engagement Wellness Revival',
    'APAC group life members aged 30-49 with low engagement and basic wearables. High upside from low baseline with participation-first rewards.',
    'low_engagement_revival',
    ['activity_uplift'],
    'participation_first',
  ),
  makeScenario(
    'demo_cv_risk',
    'Cardiovascular Risk Reduction',
    'Hong Kong individual life policyholders aged 50-64, high risk, with advanced wearable + clinical data. Multi-signal CV intervention with clinical follow-up rewards.',
    'cv_risk_reduction',
    ['cv_risk_reduction'],
    'clinical_followup',
  ),
  makeScenario(
    'demo_sleep',
    'Sleep & Recovery Programme',
    'Singapore health insurance members aged 35-54 with ring/watch devices. Sleep duration + HRV + stress with consistency rewards.',
    'sleep_recovery',
    ['sleep_recovery'],
    'consistency_reward',
  ),
  makeScenario(
    'demo_group_wellness',
    'Group Employee Wellness',
    'Hong Kong corporate wellness programme covering ages 25-54, mixed risk levels. Large cohort with team-based engagement rewards.',
    'group_employee_wellness',
    ['activity_uplift'],
    'team_engagement',
  ),
];
