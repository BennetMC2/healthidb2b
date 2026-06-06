import type { InterventionConfig, ClinicalRule } from '../types';

export const INTERVENTIONS: InterventionConfig[] = [
  {
    id: 'activity_uplift',
    name: 'Activity Uplift',
    description: 'Increase physical activity through step targets, active minute goals, and VO₂max improvement. Uses gamification and progressive challenges to drive sustained behaviour change.',
    targetBehaviour: 'Increase daily physical activity and cardiorespiratory fitness',
    primarySignals: ['steps', 'active_minutes', 'vo2_max'],
    eligibleCohorts: ['hk_midlife_active', 'low_engagement_revival', 'group_employee_wellness'],
    expectedChangeRange: [0.08, 0.25],
    levers: ['activity', 'cardiovascular'],
    linkedEvidenceIds: ['banach_2023', 'mandsager_2018', 'ekelund_2020', 'patel_2019', 'glisic_2026'],
  },
  {
    id: 'sleep_recovery',
    name: 'Sleep & Recovery',
    description: 'Improve sleep duration, quality, and consistency through behavioural nudges, sleep hygiene education, and consistency-based rewards.',
    targetBehaviour: 'Optimise sleep duration (7-8h) and improve sleep quality scores',
    primarySignals: ['sleep_hours', 'sleep_quality', 'hrv', 'stress_score'],
    eligibleCohorts: ['sleep_recovery', 'hk_midlife_active', 'group_employee_wellness'],
    expectedChangeRange: [0.05, 0.18],
    levers: ['sleep', 'stress'],
    linkedEvidenceIds: ['cappuccio_2010', 'munich_re_klarity_2025', 'hilton_2022'],
  },
  {
    id: 'cv_risk_reduction',
    name: 'CV Risk Reduction',
    description: 'Reduce cardiovascular risk through combined activity, clinical monitoring, and lifestyle modification. Targets multiple CV signals with clinical follow-up rewards.',
    targetBehaviour: 'Reduce modifiable cardiovascular risk factors through multi-signal intervention',
    primarySignals: ['heart_rate_resting', 'hrv', 'blood_pressure', 'active_minutes', 'cholesterol'],
    eligibleCohorts: ['cv_risk_reduction', 'hk_midlife_active'],
    expectedChangeRange: [0.10, 0.30],
    levers: ['cardiovascular', 'activity', 'body_composition'],
    linkedEvidenceIds: ['mandsager_2018', 'hilton_2022', 'discovery_vitality', 'ekelund_2020'],
  },
];

export const CLINICAL_RULES: ClinicalRule[] = [
  // Activity Uplift rules
  { signalId: 'steps', interventionId: 'activity_uplift', effectSize: 0.15, effectSizeRange: [0.10, 0.20], evidenceId: 'banach_2023', description: '15% all-cause mortality reduction per +1,000 steps/day (Banach 2023)' },
  { signalId: 'active_minutes', interventionId: 'activity_uplift', effectSize: 0.11, effectSizeRange: [0.07, 0.16], evidenceId: 'ekelund_2020', description: '52% mortality reduction at highest vs lowest activity (Ekelund 2020)' },
  { signalId: 'vo2_max', interventionId: 'activity_uplift', effectSize: 0.17, effectSizeRange: [0.12, 0.25], evidenceId: 'mandsager_2018', description: '80% mortality reduction elite vs low fitness (Mandsager 2018)' },
  // Sleep & Recovery rules
  { signalId: 'sleep_hours', interventionId: 'sleep_recovery', effectSize: 0.08, effectSizeRange: [0.05, 0.12], evidenceId: 'cappuccio_2010', description: '12% excess mortality from short sleep (Cappuccio 2010)' },
  { signalId: 'sleep_quality', interventionId: 'sleep_recovery', effectSize: 0.07, effectSizeRange: [0.04, 0.10], evidenceId: 'munich_re_klarity_2025', description: 'Sleep quality linked to mortality via Munich Re UK Biobank analysis' },
  { signalId: 'hrv', interventionId: 'sleep_recovery', effectSize: 0.13, effectSizeRange: [0.08, 0.18], evidenceId: 'hilton_2022', description: 'Lower HRV = significant mortality predictor (Hilton 2022)' },
  { signalId: 'stress_score', interventionId: 'sleep_recovery', effectSize: 0.08, effectSizeRange: [0.04, 0.12], evidenceId: 'hilton_2022', description: 'Stress reduction via HRV improvement pathway' },
  // CV Risk Reduction rules
  { signalId: 'heart_rate_resting', interventionId: 'cv_risk_reduction', effectSize: 0.08, effectSizeRange: [0.05, 0.12], evidenceId: 'mandsager_2018', description: 'Resting HR improvement as fitness proxy' },
  { signalId: 'hrv', interventionId: 'cv_risk_reduction', effectSize: 0.13, effectSizeRange: [0.08, 0.18], evidenceId: 'hilton_2022', description: 'HRV improvement → CV risk reduction (Hilton 2022)' },
  { signalId: 'blood_pressure', interventionId: 'cv_risk_reduction', effectSize: 0.14, effectSizeRange: [0.09, 0.19], evidenceId: 'discovery_vitality', description: 'BP reduction through lifestyle modification' },
  { signalId: 'active_minutes', interventionId: 'cv_risk_reduction', effectSize: 0.11, effectSizeRange: [0.07, 0.16], evidenceId: 'ekelund_2020', description: 'Activity → CV mortality reduction (Ekelund 2020)' },
  { signalId: 'cholesterol', interventionId: 'cv_risk_reduction', effectSize: 0.15, effectSizeRange: [0.10, 0.20], evidenceId: 'discovery_vitality', description: 'Cholesterol improvement via combined lifestyle intervention' },
];

export function getInterventionById(id: string) {
  return INTERVENTIONS.find((i) => i.id === id);
}

export function getRulesForIntervention(interventionId: string) {
  return CLINICAL_RULES.filter((r) => r.interventionId === interventionId);
}

export function getRulesForSignal(signalId: string) {
  return CLINICAL_RULES.filter((r) => r.signalId === signalId);
}
