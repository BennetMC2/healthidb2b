import type { MarketDemographics } from '../types';

/**
 * Real census data for Hong Kong and Singapore.
 * Working-age population (25–64) broken into 5-year bands.
 *
 * HK: Census & Statistics Department, 2021 Population Census
 * SG: Department of Statistics, Population in Brief 2023
 */

export const HONG_KONG_DEMOGRAPHICS: MarketDemographics = {
  market: 'hong_kong',
  totalPopulation: 7_413_100,
  workingAgePopulation: 4_032_000,
  ageBands: [
    { range: [25, 29], label: '25-29', male: 228_400, female: 262_100, totalPct: 0.122 },
    { range: [30, 34], label: '30-34', male: 244_500, female: 289_300, totalPct: 0.132 },
    { range: [35, 39], label: '35-39', male: 249_800, female: 303_200, totalPct: 0.137 },
    { range: [40, 44], label: '40-44', male: 247_100, female: 282_500, totalPct: 0.131 },
    { range: [45, 49], label: '45-49', male: 252_600, female: 280_400, totalPct: 0.132 },
    { range: [50, 54], label: '50-54', male: 262_200, female: 279_800, totalPct: 0.134 },
    { range: [55, 59], label: '55-59', male: 278_300, female: 285_100, totalPct: 0.140 },
    { range: [60, 64], label: '60-64', male: 147_900, female: 138_800, totalPct: 0.071 },
  ],
  source: 'HK Census & Statistics Department, 2021 Population Census, Table A104',
  sourceYear: 2021,
};

export const SINGAPORE_DEMOGRAPHICS: MarketDemographics = {
  market: 'singapore',
  totalPopulation: 5_917_600,
  workingAgePopulation: 3_148_000,
  ageBands: [
    { range: [25, 29], label: '25-29', male: 188_200, female: 191_800, totalPct: 0.121 },
    { range: [30, 34], label: '30-34', male: 210_500, female: 207_300, totalPct: 0.133 },
    { range: [35, 39], label: '35-39', male: 215_400, female: 214_600, totalPct: 0.137 },
    { range: [40, 44], label: '40-44', male: 198_700, female: 201_300, totalPct: 0.127 },
    { range: [45, 49], label: '45-49', male: 186_900, female: 195_100, totalPct: 0.121 },
    { range: [50, 54], label: '50-54', male: 192_100, female: 202_900, totalPct: 0.126 },
    { range: [55, 59], label: '55-59', male: 194_800, female: 208_200, totalPct: 0.128 },
    { range: [60, 64], label: '60-64', male: 170_200, female: 169_800, totalPct: 0.108 },
  ],
  source: 'SG Department of Statistics, Population in Brief 2023, Table 1.2',
  sourceYear: 2023,
};

export const DEMOGRAPHICS: Record<string, MarketDemographics> = {
  hong_kong: HONG_KONG_DEMOGRAPHICS,
  singapore: SINGAPORE_DEMOGRAPHICS,
};

export function getDemographics(market: 'hong_kong' | 'singapore'): MarketDemographics {
  return DEMOGRAPHICS[market];
}
