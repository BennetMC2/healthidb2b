import type { HealthIdentity, ReputationTier, DataSource } from '@/types';
import { AGE_RANGES, REGIONS } from '@/utils/constants';
import {
  seededRandom,
  randomInt,
  normalDistribution,
  generateId,
  weightedIndex,
  randomDate,
} from './seed';

// ── Configuration ───────────────────────────────────────────────────

const IDENTITY_COUNT = 5000;
const SEED = 42;

/** Power-law-ish weights: bronze 40%, silver 30%, gold 18%, platinum 9%, diamond 3% */
const REPUTATION_TIERS: ReputationTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const REPUTATION_WEIGHTS = [0.40, 0.30, 0.18, 0.09, 0.03];

/** Data sources ordered by popularity (Apple Health most common, lab_results least). */
const DATA_SOURCES: DataSource[] = [
  'apple_health',
  'google_fit',
  'fitbit',
  'samsung_health',
  'garmin',
  'oura',
  'whoop',
  'lab_results',
];
const DATA_SOURCE_WEIGHTS = [0.30, 0.18, 0.16, 0.12, 0.09, 0.07, 0.05, 0.03];

/** Gender distribution: male ~48%, female ~48%, other ~4% */
const GENDERS: ('male' | 'female' | 'other')[] = ['male', 'female', 'other'];
const GENDER_WEIGHTS = [0.48, 0.48, 0.04];

/** Age range weights — roughly realistic working-age bell curve */
const AGE_RANGE_WEIGHTS = [0.12, 0.26, 0.24, 0.20, 0.12, 0.06]; // 18-24 through 65+

/** Region weights — weighted to North America / Europe */
const REGION_WEIGHTS = [0.38, 0.28, 0.18, 0.10, 0.06];

/** Verification count ranges by reputation tier (bronze -> diamond) */
const VERIFICATION_RANGES: [number, number][] = [
  [0, 8],     // bronze
  [3, 20],    // silver
  [10, 50],   // gold
  [25, 120],  // platinum
  [60, 300],  // diamond
];

// ── Generator ───────────────────────────────────────────────────────

function pickWeightedSources(rng: () => number, count: number): DataSource[] {
  const picked: DataSource[] = [];
  const available = [...DATA_SOURCES];
  const weights = [...DATA_SOURCE_WEIGHTS];

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = weightedIndex(rng, weights);
    picked.push(available[idx]);
    available.splice(idx, 1);
    weights.splice(idx, 1);
  }
  return picked;
}

function generateIdentities(): HealthIdentity[] {
  const rng = seededRandom(SEED);
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 12);

  const result: HealthIdentity[] = [];

  for (let i = 0; i < IDENTITY_COUNT; i++) {
    // Reputation tier (power-law)
    const tierIndex = weightedIndex(rng, REPUTATION_WEIGHTS);
    const reputationTier = REPUTATION_TIERS[tierIndex];

    // Health score: normal distribution centered ~65, stddev ~15, clamped [20, 98]
    let healthScore = Math.round(normalDistribution(rng, 65, 15));
    healthScore = Math.max(20, Math.min(98, healthScore));

    // Connected data sources: 1-4, weighted by popularity
    const sourceCount = randomInt(rng, 1, 4);
    const connectedSources = pickWeightedSources(rng, sourceCount);

    // Demographics
    const gender = GENDERS[weightedIndex(rng, GENDER_WEIGHTS)];
    const ageRange = AGE_RANGES[weightedIndex(rng, AGE_RANGE_WEIGHTS)];
    const region = REGIONS[weightedIndex(rng, REGION_WEIGHTS)];

    // Verification count: correlated with reputation tier
    const [vMin, vMax] = VERIFICATION_RANGES[tierIndex];
    const verificationCount = randomInt(rng, vMin, vMax);

    // Enrolled campaigns: 0-5
    const enrolledCampaigns = randomInt(rng, 0, 5);

    // Dates
    const createdAt = randomDate(rng, sixMonthsAgo, now);
    const lastVerified =
      verificationCount > 0
        ? randomDate(rng, new Date(createdAt), now)
        : null;

    result.push({
      id: generateId(rng, 'hid'),
      anonymizedId: generateId(rng, 'anon'),
      healthScore,
      reputationTier,
      connectedSources,
      demographics: {
        ageRange,
        gender,
        region,
      },
      verificationCount,
      lastVerified,
      enrolledCampaigns,
      createdAt,
    });
  }

  return result;
}

export const identities: HealthIdentity[] = generateIdentities();
