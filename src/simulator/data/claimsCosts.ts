import type { ClaimsCostData } from '../types';

/**
 * Insurance claims cost data for HK and SG.
 *
 * HK: Insurance Authority Annual Report 2023
 *   - Individual life: avg premium ~$3,800 USD, claims ratio ~48%
 *   - Average sum assured ~$125,000 USD (individual ordinary)
 *   - Health: avg annual claim cost ~$1,800 USD per insured
 *   - Hospitalization: ~$560 USD/day (private ward average, Hospital Authority 2023)
 *
 * SG: Life Insurance Association Annual Report 2023 + MAS statistics
 *   - Individual life: avg premium ~$3,200 USD, claims ratio ~52%
 *   - Average sum assured ~$110,000 USD
 *   - Health: avg annual claim cost ~$1,500 USD per insured (MediShield Life + riders)
 *   - Hospitalization: ~$620 USD/day (private hospital average, MOH 2023)
 */

export const CLAIMS_COSTS: Record<string, ClaimsCostData> = {
  hong_kong: {
    market: 'hong_kong',
    avgAnnualPremium: 3800,
    claimsRatio: 0.48,
    avgSumAssured: 125_000,
    avgAnnualClaimCostHealth: 1800,
    hospitalizationCostPerDay: 560,
    source: 'HK Insurance Authority Annual Report 2023; Hospital Authority fee schedule 2023',
  },
  singapore: {
    market: 'singapore',
    avgAnnualPremium: 3200,
    claimsRatio: 0.52,
    avgSumAssured: 110_000,
    avgAnnualClaimCostHealth: 1500,
    hospitalizationCostPerDay: 620,
    source: 'SG Life Insurance Association Annual Report 2023; MOH hospital bill statistics 2023',
  },
};

export function getClaimsCosts(market: 'hong_kong' | 'singapore'): ClaimsCostData {
  return CLAIMS_COSTS[market];
}
