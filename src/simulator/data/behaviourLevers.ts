import type { BehaviourLever } from '../types';

export const BEHAVIOUR_LEVERS: BehaviourLever[] = [
  {
    id: 'activity',
    label: 'Activity',
    description: 'Physical activity volume and intensity — steps, active minutes, and exercise frequency.',
    metrics: ['steps', 'active_minutes', 'vo2_max'],
    baselineRange: [0.2, 0.8],
    unit: 'normalised 0-1',
    improvementCeiling: 0.35,
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Sleep duration, quality, and consistency — total hours, sleep stages, and regularity.',
    metrics: ['sleep_hours', 'sleep_quality'],
    baselineRange: [0.3, 0.7],
    unit: 'normalised 0-1',
    improvementCeiling: 0.25,
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    description: 'Cardiovascular health markers — resting HR, HRV, blood pressure, and cholesterol.',
    metrics: ['heart_rate_resting', 'hrv', 'blood_pressure', 'cholesterol'],
    baselineRange: [0.25, 0.75],
    unit: 'normalised 0-1',
    improvementCeiling: 0.30,
  },
  {
    id: 'body_composition',
    label: 'Body Composition',
    description: 'Body composition and metabolic health — BMI, body fat %, glucose, HbA1c.',
    metrics: ['bmi', 'body_composition', 'blood_glucose', 'hba1c'],
    baselineRange: [0.3, 0.7],
    unit: 'normalised 0-1',
    improvementCeiling: 0.20,
  },
  {
    id: 'stress',
    label: 'Stress',
    description: 'Stress and recovery — composite stress score, HRV trends, and recovery metrics.',
    metrics: ['stress_score', 'hrv'],
    baselineRange: [0.3, 0.7],
    unit: 'normalised 0-1',
    improvementCeiling: 0.22,
  },
  {
    id: 'smoking',
    label: 'Smoking',
    description: 'Smoking cessation and reduction — proxy signal from respiratory and activity patterns.',
    metrics: ['respiratory_rate', 'spo2', 'vo2_max'],
    baselineRange: [0.6, 1.0],
    unit: 'normalised 0-1 (1 = non-smoker)',
    improvementCeiling: 0.15,
  },
];

export function getLeverById(id: string) {
  return BEHAVIOUR_LEVERS.find((l) => l.id === id);
}
