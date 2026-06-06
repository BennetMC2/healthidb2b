import type { MortalityRate } from '../types';

/**
 * Government life table mortality rates (qx) per 1,000.
 *
 * HK: Census & Statistics Department, Hong Kong Life Tables 2018-2066
 * SG: Department of Statistics, Complete Life Tables 2023
 *
 * Values are the annual probability of death per 1,000 persons
 * for each age-sex band (central age of 5-year band).
 */

export const MORTALITY_RATES: MortalityRate[] = [
  // ── Hong Kong ──
  // Male — HK has among the world's highest life expectancy (M: 83.0, F: 87.7 in 2021)
  { market: 'hong_kong', ageBand: '25-29', gender: 'male', annualMortalityPer1000: 0.30, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '30-34', gender: 'male', annualMortalityPer1000: 0.38, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '35-39', gender: 'male', annualMortalityPer1000: 0.55, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '40-44', gender: 'male', annualMortalityPer1000: 0.85, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '45-49', gender: 'male', annualMortalityPer1000: 1.40, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '50-54', gender: 'male', annualMortalityPer1000: 2.30, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '55-59', gender: 'male', annualMortalityPer1000: 3.80, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '60-64', gender: 'male', annualMortalityPer1000: 6.20, source: 'HK Life Tables 2018-2066, C&SD' },
  // Female
  { market: 'hong_kong', ageBand: '25-29', gender: 'female', annualMortalityPer1000: 0.15, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '30-34', gender: 'female', annualMortalityPer1000: 0.20, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '35-39', gender: 'female', annualMortalityPer1000: 0.30, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '40-44', gender: 'female', annualMortalityPer1000: 0.50, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '45-49', gender: 'female', annualMortalityPer1000: 0.80, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '50-54', gender: 'female', annualMortalityPer1000: 1.30, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '55-59', gender: 'female', annualMortalityPer1000: 2.10, source: 'HK Life Tables 2018-2066, C&SD' },
  { market: 'hong_kong', ageBand: '60-64', gender: 'female', annualMortalityPer1000: 3.40, source: 'HK Life Tables 2018-2066, C&SD' },

  // ── Singapore ──
  // Male — SG life expectancy M: 81.1, F: 85.9 in 2023
  { market: 'singapore', ageBand: '25-29', gender: 'male', annualMortalityPer1000: 0.35, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '30-34', gender: 'male', annualMortalityPer1000: 0.42, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '35-39', gender: 'male', annualMortalityPer1000: 0.65, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '40-44', gender: 'male', annualMortalityPer1000: 1.00, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '45-49', gender: 'male', annualMortalityPer1000: 1.65, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '50-54', gender: 'male', annualMortalityPer1000: 2.80, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '55-59', gender: 'male', annualMortalityPer1000: 4.50, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '60-64', gender: 'male', annualMortalityPer1000: 7.20, source: 'SG Complete Life Tables 2023, DOS' },
  // Female
  { market: 'singapore', ageBand: '25-29', gender: 'female', annualMortalityPer1000: 0.18, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '30-34', gender: 'female', annualMortalityPer1000: 0.25, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '35-39', gender: 'female', annualMortalityPer1000: 0.38, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '40-44', gender: 'female', annualMortalityPer1000: 0.60, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '45-49', gender: 'female', annualMortalityPer1000: 0.95, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '50-54', gender: 'female', annualMortalityPer1000: 1.55, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '55-59', gender: 'female', annualMortalityPer1000: 2.50, source: 'SG Complete Life Tables 2023, DOS' },
  { market: 'singapore', ageBand: '60-64', gender: 'female', annualMortalityPer1000: 4.00, source: 'SG Complete Life Tables 2023, DOS' },
];

export function getMortalityRate(
  market: 'hong_kong' | 'singapore',
  ageBand: string,
  gender: 'male' | 'female',
): MortalityRate | undefined {
  return MORTALITY_RATES.find(
    (m) => m.market === market && m.ageBand === ageBand && m.gender === gender,
  );
}

export function getMarketMortality(market: 'hong_kong' | 'singapore'): MortalityRate[] {
  return MORTALITY_RATES.filter((m) => m.market === market);
}
