// ── Data barrel file ────────────────────────────────────────────────
// Re-exports all mock data generators for convenient access.

export {
  seededRandom,
  randomInt,
  randomFloat,
  randomItem,
  randomItems,
  normalDistribution,
  generateHash,
  generateId,
  weightedIndex,
  randomDate,
} from './seed';

export { partners } from './partners';

export { identities } from './identities';

export { campaigns, campaignTemplates } from './campaigns';

export { verifications } from './verifications';

export {
  treasuryState,
  treasuryTransactions,
  treasurySnapshots,
} from './treasury';

export {
  complianceRecords,
  dataProcessingSummaries,
} from './compliance';
