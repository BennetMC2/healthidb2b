import type { HealthMetric, CampaignUseCase } from '@/types';
import type { MetricCategory, RequiredSignal } from './metricEvidence';

// ── Types ────────────────────────────────────────────────────────────

export interface SimulatorCampaign {
  id: string;
  name: string;
  description: string;
  metric: HealthMetric;
  category: MetricCategory;
  useCase: CampaignUseCase;
  requiredSignal: RequiredSignal;
  /** Short value pitch for the campaign grid */
  valuePitch: string;
  /** Icon name hint (used by UI) */
  iconHint: string;
}

// ── Campaign Templates ───────────────────────────────────────────────

export const CAMPAIGN_TEMPLATES: SimulatorCampaign[] = [
  {
    id: 'cardio_fitness',
    name: 'Cardio Fitness Activation',
    description: 'Improve VO₂ Max through structured Zone 2 training with wearable feedback.',
    metric: 'vo2_max',
    category: 'cardiac',
    useCase: 'claims_reduction',
    requiredSignal: 'wearable',
    valuePitch: 'Strongest mortality signal. Mandsager 2018: low-to-moderate fitness HR 0.50.',
    iconHint: 'heart-pulse',
  },
  {
    id: 'hrv_recovery',
    name: 'HRV Recovery',
    description: 'Build autonomic resilience through recovery-focused training and stress management.',
    metric: 'hrv',
    category: 'cardiac',
    useCase: 'claims_reduction',
    requiredSignal: 'wearable',
    valuePitch: 'Universal mortality predictor. Early CV detection via wearable.',
    iconHint: 'activity',
  },
  {
    id: 'sleep_regularity',
    name: 'Sleep Regularity',
    description: 'Establish consistent sleep schedules through behavioural nudges and tracking.',
    metric: 'sleep_hours',
    category: 'sleep',
    useCase: 'claims_reduction',
    requiredSignal: 'wearable',
    valuePitch: 'Short sleep RR 1.12. Cappuccio 2010: n=1.4M.',
    iconHint: 'moon',
  },
  {
    id: 'resting_hr',
    name: 'Resting HR Improvement',
    description: 'Lower resting heart rate through progressive aerobic conditioning.',
    metric: 'heart_rate_resting',
    category: 'cardiac',
    useCase: 'claims_reduction',
    requiredSignal: 'wearable',
    valuePitch: 'Each +10 bpm → 9% higher mortality. Cardiometabolic proxy.',
    iconHint: 'heart',
  },
  {
    id: 'active_minutes',
    name: 'Active Minutes Challenge',
    description: 'Drive WHO-guideline compliance through gamified weekly activity targets.',
    metric: 'active_minutes',
    category: 'activity',
    useCase: 'acquisition',
    requiredSignal: 'phone',
    valuePitch: 'Lowest barrier. Phone-only signal. WHO guideline compliance.',
    iconHint: 'zap',
  },
  {
    id: 'hba1c_screening',
    name: 'HbA1c Screening',
    description: 'Pre-diabetes and diabetes screening with proof-of-result incentives.',
    metric: 'hba1c',
    category: 'clinical',
    useCase: 'underwriting',
    requiredSignal: 'clinical',
    valuePitch: 'Strongest metabolic signal. DPP: 58% T2D reduction.',
    iconHint: 'test-tube',
  },
  {
    id: 'blood_pressure',
    name: 'Blood Pressure Monitoring',
    description: 'Hypertension management through regular monitoring and lifestyle intervention.',
    metric: 'blood_pressure',
    category: 'clinical',
    useCase: 'claims_reduction',
    requiredSignal: 'clinical',
    valuePitch: 'Mature intervention evidence. SPRINT: 25% lower CV events.',
    iconHint: 'gauge',
  },
  {
    id: 'spo2_screening',
    name: 'SpO₂ Screening',
    description: 'Respiratory risk detection through wearable oxygen saturation monitoring.',
    metric: 'spo2',
    category: 'respiratory',
    useCase: 'acquisition',
    requiredSignal: 'wearable',
    valuePitch: 'Low-barrier screening. Cleaner underwriting flow.',
    iconHint: 'wind',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

export function getCampaignTemplate(id: string): SimulatorCampaign | undefined {
  return CAMPAIGN_TEMPLATES.find((c) => c.id === id);
}

export function getCampaignsByCategory(category: MetricCategory): SimulatorCampaign[] {
  return CAMPAIGN_TEMPLATES.filter((c) => c.category === category);
}

export function getCampaignsBySignal(signal: RequiredSignal): SimulatorCampaign[] {
  return CAMPAIGN_TEMPLATES.filter((c) => c.requiredSignal === signal);
}
