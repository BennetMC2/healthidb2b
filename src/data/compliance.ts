import type {
  ComplianceRecord,
  ComplianceEventType,
  DataProcessingSummary,
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
import { partners } from './partners';
import { campaigns } from './campaigns';

// ── Configuration ───────────────────────────────────────────────────

const COMPLIANCE_COUNT = 200;
const SEED = 5555;

const EVENT_TYPES: ComplianceEventType[] = [
  'verification_requested',
  'proof_generated',
  'proof_verified',
  'proof_failed',
  'data_processed',
  'audit_query',
];

/** Weighted towards verification_requested and proof_generated/verified */
const EVENT_WEIGHTS = [0.25, 0.25, 0.22, 0.08, 0.15, 0.05];

const USER_AGENTS = [
  'HealthID-SDK/2.1.0 (Node.js/20.11)',
  'HealthID-SDK/2.0.4 (Node.js/18.19)',
  'HealthID-SDK/2.1.0 (Python/3.12)',
  'HealthID-SDK/1.9.2 (Go/1.22)',
  'HealthID-API/2.1.0 (cURL/8.5)',
  'HealthID-Dashboard/1.0.0 (Chrome/121)',
  'HealthID-Dashboard/1.0.0 (Firefox/122)',
];

const DETAIL_TEMPLATES: Record<ComplianceEventType, string[]> = {
  verification_requested: [
    'Verification request initiated for campaign cohort',
    'Batch verification request submitted via API',
    'Single identity verification requested',
    'Re-verification requested for expired proof',
  ],
  proof_generated: [
    'ZK proof generated successfully',
    'Proof circuit compiled and executed',
    'Proof generated with aggregated data points',
    'Proof generated from connected data source',
  ],
  proof_verified: [
    'Proof verification passed all checks',
    'On-chain proof verification confirmed',
    'Proof validated against campaign criteria',
    'Multi-source proof cross-verified',
  ],
  proof_failed: [
    'Proof verification failed: insufficient data points',
    'Proof validation error: criteria not met',
    'Proof generation timeout exceeded',
    'Proof rejected: data source unavailable',
  ],
  data_processed: [
    'Batch data processing completed',
    'Data aggregation pipeline executed',
    'Anonymised data summary generated',
    'Data source sync and processing completed',
  ],
  audit_query: [
    'Compliance audit query executed',
    'Audit log export requested',
    'Regulatory compliance check performed',
    'Data retention policy audit completed',
  ],
};

// ── Compliance Records ──────────────────────────────────────────────

function generateComplianceRecords(): ComplianceRecord[] {
  const rng = seededRandom(SEED);
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const partnerIds = partners.map((p) => p.id);
  const campaignIds = campaigns.map((c) => c.id);

  const result: ComplianceRecord[] = [];

  for (let i = 0; i < COMPLIANCE_COUNT; i++) {
    const eventType = EVENT_TYPES[weightedIndex(rng, EVENT_WEIGHTS)];
    const partnerId = randomItem(rng, partnerIds);

    // Most events are tied to campaigns, audit queries sometimes are not
    const hasCampaign = eventType !== 'audit_query' || rng() > 0.4;
    const campaignId = hasCampaign ? randomItem(rng, campaignIds) : null;

    // Proof hash only for proof-related events
    const hasProof = ['proof_generated', 'proof_verified', 'proof_failed'].includes(eventType);
    const proofHash = hasProof ? generateHash(rng) : null;

    result.push({
      id: generateId(rng, 'cpl'),
      eventType,
      timestamp: randomDate(rng, sixMonthsAgo, now),
      partnerId,
      campaignId,
      proofHash,
      piiAccessed: false as const,
      ipHash: generateHash(rng).slice(0, 18), // Shortened hash for IP
      userAgent: randomItem(rng, USER_AGENTS),
      details: randomItem(rng, DETAIL_TEMPLATES[eventType]),
    });
  }

  // Sort by timestamp
  result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return result;
}

export const complianceRecords: ComplianceRecord[] = generateComplianceRecords();

// ── Data Processing Summaries (monthly for 6 months) ────────────────

const ALL_DATA_SOURCES: DataSource[] = [
  'apple_health', 'fitbit', 'garmin', 'oura', 'whoop', 'google_fit', 'samsung_health', 'lab_results',
];

function generateDataProcessingSummaries(): DataProcessingSummary[] {
  const rng = seededRandom(SEED + 200);
  const now = new Date();
  const result: DataProcessingSummary[] = [];

  for (let m = 5; m >= 0; m--) {
    const periodDate = new Date(now);
    periodDate.setMonth(periodDate.getMonth() - m);
    const year = periodDate.getFullYear();
    const month = String(periodDate.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;

    // Volumes grow over time (earlier months are smaller)
    const scale = 1 + (5 - m) * 0.15;
    const recordsProcessed = Math.round(randomInt(rng, 8000, 15000) * scale);
    const proofsGenerated = Math.round(recordsProcessed * (0.6 + rng() * 0.2));
    const proofsVerified = Math.round(proofsGenerated * (0.82 + rng() * 0.10));
    const proofsFailed = Math.round(proofsGenerated * (0.04 + rng() * 0.06));

    let avgMs = Math.round(normalDistribution(rng, 310, 50));
    avgMs = Math.max(150, Math.min(600, avgMs));

    // Pick 5-8 data sources accessed that month
    const sourceCount = randomInt(rng, 5, 8);
    const dataSourcesAccessed = randomItems(rng, ALL_DATA_SOURCES, sourceCount);

    result.push({
      period,
      recordsProcessed,
      proofsGenerated,
      proofsVerified,
      proofsFailed,
      avgProofGenerationMs: avgMs,
      dataSourcesAccessed,
      piiAccessEvents: 0 as const,
    });
  }

  return result;
}

export const dataProcessingSummaries: DataProcessingSummary[] = generateDataProcessingSummaries();
