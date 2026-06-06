import type { BehaviouralArchetype } from '../types';

/**
 * 6 behavioural archetypes with evidence-backed distributions.
 *
 * These replace the old uniform participation rate assumption.
 * Each archetype has its own step change, persistence, and decay curve,
 * calibrated from RCT data (Patel 2016/2019) and real-world programmes
 * (Discovery Vitality engagement tiers, RAND Workplace Wellness).
 *
 * Cohort shares sum to ~100% (within rounding).
 * Default shares are the central estimates.
 */

export const ARCHETYPES: BehaviouralArchetype[] = [
  {
    id: 'non_starters',
    name: 'Non-starters',
    description: 'Never download the app or enrol in the programme. No behaviour change.',
    cohortShareRange: [0.40, 0.50],
    defaultCohortShare: 0.45,
    stepChangeRange: [0, 0],
    stepChangeMean: 0,
    stepChangeSD: 0,
    persistenceAt12Mo: 0,
    persistenceAt36Mo: 0,
    ageSkew: 'older',
    decayCurve: 'none',
    sources: [
      'RCT non-enrollment rates (Patel 2016: 45% non-participation)',
      'Discovery Vitality: ~30% "inactive" tier never engage',
      'RAND 2013: 40-60% non-participation across employer programmes',
    ],
  },
  {
    id: 'early_dropouts',
    name: 'Early dropouts',
    description: 'Try the programme for 2–8 weeks, then disengage. Initial step increase decays to near zero.',
    cohortShareRange: [0.15, 0.20],
    defaultCohortShare: 0.17,
    stepChangeRange: [400, 800],
    stepChangeMean: 600,
    stepChangeSD: 300,
    persistenceAt12Mo: 0,
    persistenceAt36Mo: 0,
    ageSkew: 'neutral',
    decayCurve: 'fast',
    sources: [
      'Patel 2016: 55% of initial participants dropped below baseline by month 3',
      'Patel 2019: competition arm engagement halved within 12 weeks',
      'Finkelstein 2016: effects vanished within 6 months post-incentive',
    ],
  },
  {
    id: 'sporadic_engagers',
    name: 'Sporadic engagers',
    description: 'Participate intermittently, 2–3 days per week. Moderate but inconsistent step increase.',
    cohortShareRange: [0.10, 0.15],
    defaultCohortShare: 0.13,
    stepChangeRange: [500, 900],
    stepChangeMean: 700,
    stepChangeSD: 300,
    persistenceAt12Mo: 0.40,
    persistenceAt36Mo: 0.20,
    ageSkew: 'neutral',
    decayCurve: 'gradual',
    sources: [
      'Discovery Vitality: "moderately active" tier (35% of engaged members)',
      'Patel 2019: middle quartile maintained 2-3 day/week engagement',
    ],
  },
  {
    id: 'steady_movers',
    name: 'Steady movers',
    description: 'Consistent moderate effort. Sustain a meaningful step increase of 1,200–1,800 steps/day.',
    cohortShareRange: [0.10, 0.15],
    defaultCohortShare: 0.12,
    stepChangeRange: [1200, 1800],
    stepChangeMean: 1500,
    stepChangeSD: 400,
    persistenceAt12Mo: 0.75,
    persistenceAt36Mo: 0.50,
    ageSkew: 'neutral',
    decayCurve: 'slow',
    sources: [
      'Patel 2016: top quartile sustained +2,400 steps (we use a conservative 1,500)',
      'Discovery Vitality: "active" tier (25% of engaged, ~13% of total)',
    ],
  },
  {
    id: 'super_engagers',
    name: 'Super-engagers',
    description: 'Fully committed lifestyle change. Dramatic step increase of 2,500–4,000 steps/day sustained long-term.',
    cohortShareRange: [0.03, 0.05],
    defaultCohortShare: 0.04,
    stepChangeRange: [2500, 4000],
    stepChangeMean: 3000,
    stepChangeSD: 800,
    persistenceAt12Mo: 0.90,
    persistenceAt36Mo: 0.70,
    ageSkew: 'younger',
    decayCurve: 'slow',
    sources: [
      'Discovery Vitality: "highly active" tier (10% of engaged, ~5% of total)',
      'Patel 2016: top decile maintained +3,000 steps at 6 months',
    ],
  },
  {
    id: 'already_active',
    name: 'Already active',
    description: 'Already walking >8,000 steps/day. Little room to gain from the programme (ceiling effect).',
    cohortShareRange: [0.08, 0.12],
    defaultCohortShare: 0.09,
    stepChangeRange: [200, 500],
    stepChangeMean: 350,
    stepChangeSD: 200,
    persistenceAt12Mo: 0.80,
    persistenceAt36Mo: 0.65,
    ageSkew: 'younger',
    decayCurve: 'slow',
    sources: [
      'HK BRFSS 2020: ~27-48% meet activity guidelines (varies by age)',
      'Tudor-Locke 2011: ≥10,000 steps/day = "active" classification',
      'Ceiling effect documented in Finkelstein 2016 high-baseline subgroup',
    ],
  },
];

export function getArchetype(id: string): BehaviouralArchetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

/** Return archetype shares, applying optional user overrides. Normalises to sum to 1.0. */
export function getArchetypeShares(overrides?: Record<string, number>): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const a of ARCHETYPES) {
    raw[a.id] = overrides?.[a.id] ?? a.defaultCohortShare;
  }
  const total = Object.values(raw).reduce((s, v) => s + v, 0);
  const normalised: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    normalised[k] = v / total;
  }
  return normalised;
}

/**
 * Per-metric archetype adjustments.
 *
 * Different campaign metrics attract different engagement profiles.
 * Sleep campaigns have slightly more non-starters; VO₂ Max campaigns
 * attract more super-engagers (self-selecting fitness enthusiasts).
 *
 * Returns multipliers keyed by archetype ID, applied to default shares
 * before re-normalisation.
 */
type MetricKey = string;

const METRIC_ARCHETYPE_MULTIPLIERS: Record<MetricKey, Record<string, number>> = {
  vo2_max: {
    non_starters: 0.90, early_dropouts: 0.85, sporadic_engagers: 0.95,
    steady_movers: 1.15, super_engagers: 1.40, already_active: 1.20,
  },
  hrv: {
    non_starters: 0.95, early_dropouts: 0.90, sporadic_engagers: 1.00,
    steady_movers: 1.10, super_engagers: 1.20, already_active: 1.05,
  },
  sleep_hours: {
    non_starters: 1.08, early_dropouts: 1.05, sporadic_engagers: 1.02,
    steady_movers: 0.92, super_engagers: 0.85, already_active: 0.95,
  },
  sleep_quality: {
    non_starters: 1.06, early_dropouts: 1.04, sporadic_engagers: 1.02,
    steady_movers: 0.94, super_engagers: 0.88, already_active: 0.96,
  },
  heart_rate_resting: {
    non_starters: 0.95, early_dropouts: 0.92, sporadic_engagers: 1.00,
    steady_movers: 1.10, super_engagers: 1.25, already_active: 1.10,
  },
  active_minutes: {
    non_starters: 0.92, early_dropouts: 0.95, sporadic_engagers: 1.05,
    steady_movers: 1.10, super_engagers: 1.15, already_active: 1.05,
  },
  hba1c: {
    non_starters: 1.10, early_dropouts: 1.05, sporadic_engagers: 0.95,
    steady_movers: 0.90, super_engagers: 0.80, already_active: 0.85,
  },
  blood_pressure: {
    non_starters: 1.05, early_dropouts: 1.02, sporadic_engagers: 1.00,
    steady_movers: 0.95, super_engagers: 0.85, already_active: 0.90,
  },
  spo2: {
    non_starters: 1.05, early_dropouts: 1.00, sporadic_engagers: 1.00,
    steady_movers: 0.95, super_engagers: 0.90, already_active: 0.95,
  },
  steps: {
    non_starters: 1.00, early_dropouts: 1.00, sporadic_engagers: 1.00,
    steady_movers: 1.00, super_engagers: 1.00, already_active: 1.00,
  },
};

/**
 * Get archetype shares adapted for a specific metric.
 * Applies metric-specific multipliers then re-normalises.
 */
export function getMetricAdaptedArchetypes(
  metric: string,
  overrides?: Record<string, number>,
): Record<string, number> {
  const base = getArchetypeShares(overrides);
  const multipliers = METRIC_ARCHETYPE_MULTIPLIERS[metric];
  if (!multipliers) return base;

  const adjusted: Record<string, number> = {};
  for (const [id, share] of Object.entries(base)) {
    adjusted[id] = share * (multipliers[id] ?? 1.0);
  }
  const total = Object.values(adjusted).reduce((s, v) => s + v, 0);
  for (const id of Object.keys(adjusted)) {
    adjusted[id] /= total;
  }
  return adjusted;
}
