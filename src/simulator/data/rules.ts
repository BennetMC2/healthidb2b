import type { InterventionId, BehaviourLeverId } from '../types';

/**
 * Cohort × Signal → Intervention rules mapping.
 * Defines which interventions are recommended for each cohort preset,
 * and which levers they should prioritise.
 */

export interface CohortInterventionRule {
  cohortPresetId: string;
  interventionId: InterventionId;
  priority: number; // 1 = primary, 2 = secondary, 3 = tertiary
  targetLevers: BehaviourLeverId[];
  expectedLeverMovement: Record<BehaviourLeverId, number>;
  rewardPresetId: string;
  rationale: string;
}

export const COHORT_INTERVENTION_RULES: CohortInterventionRule[] = [
  // HK Midlife Activity Uplift
  {
    cohortPresetId: 'hk_midlife_active',
    interventionId: 'activity_uplift',
    priority: 1,
    targetLevers: ['activity', 'cardiovascular'],
    expectedLeverMovement: {
      activity: 0.18, sleep: 0.05, cardiovascular: 0.12, body_composition: 0.06, stress: 0.08, smoking: 0.02,
    },
    rewardPresetId: 'weekly_streak',
    rationale: 'Midlife cohort with moderate baseline. Weekly streak reward + steps/VO₂max targeting yields best ROI.',
  },
  // Low-Engagement Wellness Revival
  {
    cohortPresetId: 'low_engagement_revival',
    interventionId: 'activity_uplift',
    priority: 1,
    targetLevers: ['activity'],
    expectedLeverMovement: {
      activity: 0.22, sleep: 0.04, cardiovascular: 0.08, body_composition: 0.05, stress: 0.06, smoking: 0.01,
    },
    rewardPresetId: 'participation_first',
    rationale: 'Low baseline = high upside. Participation-first rewards lower barriers to entry.',
  },
  // CV Risk Reduction
  {
    cohortPresetId: 'cv_risk_reduction',
    interventionId: 'cv_risk_reduction',
    priority: 1,
    targetLevers: ['cardiovascular', 'activity', 'body_composition'],
    expectedLeverMovement: {
      activity: 0.14, sleep: 0.06, cardiovascular: 0.22, body_composition: 0.10, stress: 0.08, smoking: 0.04,
    },
    rewardPresetId: 'clinical_followup',
    rationale: 'High-risk cohort benefits from clinical + wearable combined intervention. Higher reward budget justified by larger claims impact.',
  },
  // Sleep & Recovery
  {
    cohortPresetId: 'sleep_recovery',
    interventionId: 'sleep_recovery',
    priority: 1,
    targetLevers: ['sleep', 'stress'],
    expectedLeverMovement: {
      activity: 0.04, sleep: 0.20, cardiovascular: 0.06, body_composition: 0.03, stress: 0.15, smoking: 0.01,
    },
    rewardPresetId: 'consistency_reward',
    rationale: 'Sleep-focused cohort. Consistency-based rewards aligned with sleep regularity goals.',
  },
  // Group Employee Wellness
  {
    cohortPresetId: 'group_employee_wellness',
    interventionId: 'activity_uplift',
    priority: 1,
    targetLevers: ['activity'],
    expectedLeverMovement: {
      activity: 0.15, sleep: 0.05, cardiovascular: 0.08, body_composition: 0.04, stress: 0.06, smoking: 0.02,
    },
    rewardPresetId: 'team_engagement',
    rationale: 'Large mixed cohort. Team-based engagement rewards leverage social accountability.',
  },
];

export function getRulesForCohort(cohortPresetId: string) {
  return COHORT_INTERVENTION_RULES.filter((r) => r.cohortPresetId === cohortPresetId);
}

export function getRuleForCohortIntervention(cohortPresetId: string, interventionId: InterventionId) {
  return COHORT_INTERVENTION_RULES.find(
    (r) => r.cohortPresetId === cohortPresetId && r.interventionId === interventionId,
  );
}
