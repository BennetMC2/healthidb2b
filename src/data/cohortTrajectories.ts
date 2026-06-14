// ── Cohort & Campaign Trajectory Data ────────────────────────────────
// Generates synthetic 12-week health-score trajectories for each risk
// cohort and each active/completed campaign.  Treatment vs holdout lines
// let the demo show attributable behaviour change.

import { seededRandom, normalDistribution } from './seed';
import { campaigns } from './campaigns';
import { IDENTITY_COUNT } from './simulation';

const TRAJECTORY_SEED = 77701;
const WEEKS = 12;
const CAMPAIGN_START_WEEK = 2; // first 2 weeks are baseline

// ── Types ────────────────────────────────────────────────────────────

export interface TrajectoryPoint {
  week: number;
  date: string;
  treatmentHealth: number;
  holdoutHealth: number;
}

export interface TrajectoryData {
  /** Cohort or campaign name used as lookup key */
  name: string;
  points: TrajectoryPoint[];
  baselineHealth: number;
  latestTreatmentHealth: number;
  latestHoldoutHealth: number;
  /** Treatment minus holdout at latest week */
  deltaVsHoldout: number;
  /** 95 % confidence interval for the delta */
  confidenceInterval: [number, number];
  pValue: number;
  treatmentN: number;
  holdoutN: number;
  holdoutPct: number;
  status: 'projected' | 'verified';
  campaignStartWeek: number;
  /** Lead signal name for display */
  leadSignal?: string;
}

// ── Per-cohort configuration ─────────────────────────────────────────

interface CohortConfig {
  baseHealth: number;
  /** Total treatment improvement over 12 weeks */
  improvement: number;
  /** Holdout natural drift (can be slightly negative) */
  holdoutDrift: number;
  status: 'projected' | 'verified';
  holdoutPct: number;
  treatmentN: number;
  leadSignal: string;
}

// ── Cohort allocation fractions of total population (IDENTITY_COUNT) ──
// Sum to ~0.86 — remaining 14% are not assigned to a specific treatment cohort.
const COHORT_ALLOCATION: Record<string, number> = {
  'Pre-Diabetic Watchlist': 0.093,
  'Cardiac Risk Pool': 0.128,
  'Chronic Care Management': 0.103,
  'Senior Wellness': 0.137,
  'Mental Health Monitoring': 0.095,
  'Maternity Track': 0.086,
  'Low-Risk Millennial': 0.120,
  'Active Lifestyle': 0.094,
};

const COHORT_CFG: Record<string, CohortConfig> = {
  'Pre-Diabetic Watchlist': {
    baseHealth: 56.8,
    improvement: 4.6,
    holdoutDrift: 0.3,
    status: 'verified',
    holdoutPct: 15,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Pre-Diabetic Watchlist']),
    leadSignal: 'Blood Glucose',
  },
  'Cardiac Risk Pool': {
    baseHealth: 48.2,
    improvement: 5.9,
    holdoutDrift: -0.5,
    status: 'verified',
    holdoutPct: 15,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Cardiac Risk Pool']),
    leadSignal: 'VO2 Max',
  },
  'Chronic Care Management': {
    baseHealth: 52.4,
    improvement: 3.3,
    holdoutDrift: 0.1,
    status: 'projected',
    holdoutPct: 12,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Chronic Care Management']),
    leadSignal: 'Blood Pressure',
  },
  'Senior Wellness': {
    baseHealth: 58.6,
    improvement: 2.6,
    holdoutDrift: -0.3,
    status: 'projected',
    holdoutPct: 12,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Senior Wellness']),
    leadSignal: 'Resting HR',
  },
  'Mental Health Monitoring': {
    baseHealth: 55.1,
    improvement: 3.0,
    holdoutDrift: 0.0,
    status: 'projected',
    holdoutPct: 10,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Mental Health Monitoring']),
    leadSignal: 'HRV / Stress',
  },
  'Maternity Track': {
    baseHealth: 62.3,
    improvement: 2.1,
    holdoutDrift: 0.4,
    status: 'projected',
    holdoutPct: 10,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Maternity Track']),
    leadSignal: 'Sleep Quality',
  },
  'Low-Risk Millennial': {
    baseHealth: 71.4,
    improvement: 1.4,
    holdoutDrift: 0.2,
    status: 'projected',
    holdoutPct: 10,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Low-Risk Millennial']),
    leadSignal: 'Active Minutes',
  },
  'Active Lifestyle': {
    baseHealth: 78.6,
    improvement: 0.9,
    holdoutDrift: 0.1,
    status: 'projected',
    holdoutPct: 10,
    treatmentN: Math.round(IDENTITY_COUNT * COHORT_ALLOCATION['Active Lifestyle']),
    leadSignal: 'VO2 Max',
  },
};

// ── Signal label lookup for campaigns ────────────────────────────────

const METRIC_SIGNAL_LABELS: Record<string, string> = {
  vo2_max: 'VO2 Max',
  hrv: 'HRV',
  sleep_hours: 'Sleep',
  sleep_quality: 'Sleep Quality',
  heart_rate_resting: 'Resting HR',
  active_minutes: 'Active Minutes',
  blood_pressure: 'Blood Pressure',
  blood_glucose: 'Blood Glucose',
  stress_score: 'Stress Score',
  spo2: 'SpO2',
  hba1c: 'HbA1c',
  cholesterol: 'Cholesterol',
  respiratory_rate: 'Respiratory Rate',
  bmi: 'BMI',
  body_composition: 'Body Composition',
  hydration: 'Hydration',
  body_temp_deviation: 'Body Temp',
  steps: 'Steps',
};

// ── Builder ──────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function buildTrajectory(
  rng: () => number,
  name: string,
  cfg: CohortConfig,
): TrajectoryData {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - WEEKS * 7);

  const points: TrajectoryPoint[] = [];
  let treatmentHealth = cfg.baseHealth;
  let holdoutHealth = cfg.baseHealth;

  for (let w = 0; w <= WEEKS; w++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(weekDate.getDate() + w * 7);

    if (w <= CAMPAIGN_START_WEEK) {
      // Baseline period — both groups at roughly the same level
      const noise = normalDistribution(rng, 0, 0.25);
      treatmentHealth = cfg.baseHealth + noise;
      holdoutHealth = cfg.baseHealth + normalDistribution(rng, 0, 0.25);
    } else {
      // Intervention period — treatment improves, holdout drifts
      const weeksIntoIntervention = w - CAMPAIGN_START_WEEK;
      const totalInterventionWeeks = WEEKS - CAMPAIGN_START_WEEK;
      // Sigmoid-shaped improvement (slow start, accelerates, then plateaus)
      const progress = 1 / (1 + Math.exp(-0.5 * (weeksIntoIntervention - totalInterventionWeeks * 0.45)));
      const tNoise = normalDistribution(rng, 0, 0.35);
      const hNoise = normalDistribution(rng, 0, 0.3);

      treatmentHealth = cfg.baseHealth + cfg.improvement * progress + tNoise;
      holdoutHealth = cfg.baseHealth + (cfg.holdoutDrift * weeksIntoIntervention / totalInterventionWeeks) + hNoise;
    }

    points.push({
      week: w,
      date: weekDate.toISOString().slice(0, 10),
      treatmentHealth: Number(clamp(treatmentHealth, 20, 98).toFixed(1)),
      holdoutHealth: Number(clamp(holdoutHealth, 20, 98).toFixed(1)),
    });
  }

  const latest = points[points.length - 1];
  const delta = Number((latest.treatmentHealth - latest.holdoutHealth).toFixed(1));
  const holdoutN = Math.round(cfg.treatmentN * (cfg.holdoutPct / 100));

  // Compute p-value — smaller for verified, larger for projected
  const se = (cfg.improvement * 0.4) / Math.sqrt(cfg.treatmentN);
  const tStat = Math.abs(delta) / Math.max(se, 0.01);
  const rawP = Math.exp(-0.5 * tStat * tStat);
  const pValue = cfg.status === 'verified'
    ? Number(clamp(rawP * 0.3, 0.001, 0.04).toFixed(3))
    : Number(clamp(rawP * 2.5, 0.02, 0.22).toFixed(3));

  const ciHalf = Number((se * 1.96).toFixed(1));

  return {
    name,
    points,
    baselineHealth: cfg.baseHealth,
    latestTreatmentHealth: latest.treatmentHealth,
    latestHoldoutHealth: latest.holdoutHealth,
    deltaVsHoldout: delta,
    confidenceInterval: [
      Number((delta - ciHalf).toFixed(1)),
      Number((delta + ciHalf).toFixed(1)),
    ],
    pValue,
    treatmentN: cfg.treatmentN,
    holdoutN,
    holdoutPct: cfg.holdoutPct,
    status: cfg.status,
    campaignStartWeek: CAMPAIGN_START_WEEK,
    leadSignal: cfg.leadSignal,
  };
}

// ── Generate all trajectories ────────────────────────────────────────

function buildAllTrajectories() {
  const rng = seededRandom(TRAJECTORY_SEED);
  const cohortTrajectories: Record<string, TrajectoryData> = {};
  const campaignTrajectories: Record<string, TrajectoryData> = {};

  // 1) Cohort-level trajectories
  for (const [name, cfg] of Object.entries(COHORT_CFG)) {
    cohortTrajectories[name] = buildTrajectory(rng, name, cfg);
  }

  // 2) Campaign-level trajectories (active + completed only)
  campaigns.forEach((campaign, index) => {
    if (campaign.status === 'draft' || campaign.status === 'paused') return;

    // Derive a config from the campaign's properties
    const enrolled = campaign.funnel.enrolled;
    const verified = campaign.funnel.verified;
    const verificationRate = verified / Math.max(enrolled, 1);

    // Base health from the targeting (lower health score range = lower base)
    const targetMin = campaign.targeting.healthScoreMin ?? 30;
    const targetMax = campaign.targeting.healthScoreMax ?? 80;
    const baseHealth = (targetMin + targetMax) / 2 + normalDistribution(rng, 0, 3);

    // Improvement scales with verification rate and campaign age
    const startDate = new Date(campaign.startDate);
    const ageWeeks = Math.max(4, Math.round((Date.now() - startDate.getTime()) / (7 * 86400000)));
    const improvementBase = verificationRate * 6 + 1;
    const improvement = clamp(improvementBase + normalDistribution(rng, 0, 0.8), 0.5, 7);

    // The first 2 completed campaigns (index-wise) get "verified" status
    const isVerified = campaign.status === 'completed' || index < 2;

    const cfg: CohortConfig = {
      baseHealth: clamp(baseHealth, 35, 75),
      improvement,
      holdoutDrift: normalDistribution(rng, 0, 0.3),
      status: isVerified ? 'verified' : 'projected',
      holdoutPct: 15,
      treatmentN: enrolled,
      leadSignal: METRIC_SIGNAL_LABELS[campaign.challenge.metric] ?? campaign.challenge.metric,
    };

    campaignTrajectories[campaign.id] = buildTrajectory(rng, campaign.name, cfg);
  });

  return { cohortTrajectories, campaignTrajectories };
}

const { cohortTrajectories, campaignTrajectories } = buildAllTrajectories();

export { cohortTrajectories, campaignTrajectories };
