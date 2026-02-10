import type {
  VerificationReceipt,
  ProofType,
  VerificationStatus,
  DataSource,
} from '@/types';
import {
  seededRandom,
  randomInt,
  randomItem,
  randomItems,
  normalDistribution,
  generateId,
  generateHash,
  weightedIndex,
  randomDate,
} from './seed';
import { campaigns } from './campaigns';
import { identities } from './identities';

// ── Configuration ───────────────────────────────────────────────────

const VERIFICATION_COUNT = 500;
const SEED = 7331;

/** Proof type weights: zk_snark most common, bulletproof least */
const PROOF_TYPES: ProofType[] = ['zk_snark', 'zk_stark', 'bulletproof'];
const PROOF_TYPE_WEIGHTS = [0.55, 0.30, 0.15];

/** Status weights: ~85% verified, ~5% pending, ~8% failed, ~2% expired */
const STATUSES: VerificationStatus[] = ['verified', 'pending', 'failed', 'expired'];
const STATUS_WEIGHTS = [0.85, 0.05, 0.08, 0.02];

const AGGREGATION_TYPES: ('mean' | 'max' | 'min' | 'sum' | 'latest')[] = [
  'mean', 'max', 'min', 'sum', 'latest',
];

const ALL_DATA_SOURCES: DataSource[] = [
  'apple_health', 'fitbit', 'garmin', 'oura', 'whoop', 'google_fit', 'samsung_health', 'lab_results',
];

// ── Generator ───────────────────────────────────────────────────────

function generateVerifications(): VerificationReceipt[] {
  const rng = seededRandom(SEED);
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Only reference campaigns that are not drafts (active, completed, paused have verifications)
  const activeCampaigns = campaigns.filter((c) => c.status !== 'draft');

  const result: VerificationReceipt[] = [];

  for (let i = 0; i < VERIFICATION_COUNT; i++) {
    const campaign = randomItem(rng, activeCampaigns);
    const identity = randomItem(rng, identities);

    const proofType = PROOF_TYPES[weightedIndex(rng, PROOF_TYPE_WEIGHTS)];
    const status = STATUSES[weightedIndex(rng, STATUS_WEIGHTS)];

    // Proof generation time: normally distributed around 300ms, clamped [50, 2000]
    let proofGenerationMs = Math.round(normalDistribution(rng, 300, 120));
    proofGenerationMs = Math.max(50, Math.min(2000, proofGenerationMs));

    // Timestamp within the last 6 months
    const timestamp = randomDate(rng, sixMonthsAgo, now);

    // Verified-at only if status is 'verified'
    const verifiedAt = status === 'verified'
      ? new Date(new Date(timestamp).getTime() + proofGenerationMs + randomInt(rng, 500, 5000)).toISOString()
      : null;

    // Data sources: pick from the identity's connected sources when possible
    const sourcesPool = identity.connectedSources.length > 0
      ? identity.connectedSources
      : ALL_DATA_SOURCES;
    const sourceCount = randomInt(rng, 1, Math.min(3, sourcesPool.length));
    const dataSources = randomItems(rng, sourcesPool, sourceCount);

    result.push({
      id: generateId(rng, 'vrf'),
      campaignId: campaign.id,
      identityId: identity.id,
      proofType,
      proofHash: generateHash(rng),
      status,
      metric: campaign.challenge.metric,
      dataSources,
      timestamp,
      verifiedAt,
      proofGenerationMs,
      metadata: {
        aggregationType: randomItem(rng, AGGREGATION_TYPES),
        timeWindowHours: randomItem(rng, [1, 6, 12, 24, 48, 168]),
        dataPointCount: randomInt(rng, 10, 5000),
      },
    });
  }

  return result;
}

export const verifications: VerificationReceipt[] = generateVerifications();
