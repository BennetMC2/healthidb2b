import type { PopulationCohort, CohortCell, Market, SignalCoverage } from '../types';
import type { RequiredSignal } from '../data/metricEvidence';
import { getDemographics } from '../data/demographics';
import { getActivityBaseline } from '../data/activityBaselines';
import { getMortalityRate } from '../data/mortalityTables';
import { ARCHETYPES, getArchetypeShares } from '../data/archetypes';
import { getSignalPenetrationBand } from '../data/signalPenetration';

/**
 * Step 1: Build a population cohort from real census data.
 *
 * Distributes cohortSize across age-sex bands proportionally to census data,
 * assigns baseline step counts from health surveys, mortality rates from
 * government life tables, signal coverage from real penetration data,
 * and distributes each cell across behavioural archetypes.
 *
 * Signal coverage is NOT user-configurable — it comes from real-world
 * penetration data per market and age band.
 */

/** Age-based archetype skew multipliers */
function getAgeSkewMultiplier(ageBand: string, ageSkew: 'younger' | 'older' | 'neutral'): number {
  const midAge = parseInt(ageBand.split('-')[0]) + 2;
  if (ageSkew === 'neutral') return 1.0;
  if (ageSkew === 'younger') {
    return 1.3 - ((midAge - 27) / (62 - 27)) * 0.6;
  }
  return 0.7 + ((midAge - 27) / (62 - 27)) * 0.6;
}

export function buildPopulationCohort(
  market: Market,
  cohortSize: number,
  archetypeWeightOverrides?: Record<string, number>,
): PopulationCohort {
  const demo = getDemographics(market);
  const archetypeShares = getArchetypeShares(archetypeWeightOverrides);

  const cells: CohortCell[] = [];
  const archetypeTotals: Record<string, number> = {};
  for (const a of ARCHETYPES) archetypeTotals[a.id] = 0;

  let totalWeightedSteps = 0;
  let totalWeightedSedentary = 0;
  let totalWeightedAge = 0;
  let totalPhone = 0;
  let totalApp = 0;
  let totalWearable = 0;
  let totalCount = 0;

  for (const band of demo.ageBands) {
    for (const gender of ['male', 'female'] as const) {
      const genderPop = gender === 'male' ? band.male : band.female;
      const genderPct = genderPop / demo.workingAgePopulation;
      const cellCount = Math.round(cohortSize * genderPct);
      if (cellCount === 0) continue;

      const activity = getActivityBaseline(market, band.label);
      const mortality = getMortalityRate(market, band.label, gender);

      const avgSteps = activity?.avgDailySteps ?? 5500;
      const stepsSD = activity?.stepsSD ?? 2500;
      const sedentaryPct = activity?.pctSedentary ?? 0.35;
      const mortalityPer1000 = mortality?.annualMortalityPer1000 ?? 1.5;

      // Signal coverage from real penetration data
      const signalBand = getSignalPenetrationBand(market, band.label);
      const phonePct = signalBand?.phonePct ?? 0.89;
      const appPct = signalBand?.appPct ?? 0.35;
      const wearablePct = signalBand?.wearablePct ?? 0.22;

      const signalCoverage: SignalCoverage = {
        phoneCount: Math.round(cellCount * phonePct),
        appCount: Math.round(cellCount * appPct),
        wearableCount: Math.round(cellCount * wearablePct),
      };

      // Distribute cell across archetypes with age-adjusted probabilities
      const archetypeBreakdown: Record<string, number> = {};
      let rawTotal = 0;
      const rawCounts: Record<string, number> = {};

      for (const arch of ARCHETYPES) {
        const baseShare = archetypeShares[arch.id];
        const skewMult = getAgeSkewMultiplier(band.label, arch.ageSkew);
        const adjustedShare = baseShare * skewMult;
        rawCounts[arch.id] = adjustedShare;
        rawTotal += adjustedShare;
      }

      let assigned = 0;
      const archIds = ARCHETYPES.map((a) => a.id);
      for (let i = 0; i < archIds.length; i++) {
        const id = archIds[i];
        if (i === archIds.length - 1) {
          archetypeBreakdown[id] = cellCount - assigned;
        } else {
          const count = Math.round(cellCount * (rawCounts[id] / rawTotal));
          archetypeBreakdown[id] = count;
          assigned += count;
        }
        archetypeTotals[id] += archetypeBreakdown[id];
      }

      const midAge = (band.range[0] + band.range[1]) / 2;

      cells.push({
        ageBand: band.label,
        gender,
        count: cellCount,
        baselineSteps: {
          central: avgSteps,
          low: avgSteps - stepsSD * 0.5,
          high: avgSteps + stepsSD * 0.5,
        },
        baselineMortalityPer1000: mortalityPer1000,
        signalCoverage,
        archetypeBreakdown,
      });

      totalWeightedSteps += avgSteps * cellCount;
      totalWeightedSedentary += sedentaryPct * cellCount;
      totalWeightedAge += midAge * cellCount;
      totalPhone += signalCoverage.phoneCount;
      totalApp += signalCoverage.appCount;
      totalWearable += signalCoverage.wearableCount;
      totalCount += cellCount;
    }
  }

  const avgSteps = totalCount > 0 ? totalWeightedSteps / totalCount : 5500;
  const avgSedentary = totalCount > 0 ? totalWeightedSedentary / totalCount : 0.35;

  return {
    market,
    totalSize: totalCount,
    cells,
    archetypeTotals,
    signalCoverageTotals: {
      phoneCount: totalPhone,
      appCount: totalApp,
      wearableCount: totalWearable,
    },
    summary: {
      avgAge: totalCount > 0 ? totalWeightedAge / totalCount : 42,
      avgSteps: { central: avgSteps, low: avgSteps * 0.88, high: avgSteps * 1.12 },
      pctSedentary: { central: avgSedentary, low: avgSedentary * 0.85, high: avgSedentary * 1.15 },
      pctWithPhone: totalCount > 0 ? totalPhone / totalCount : 0.89,
      pctWithApp: totalCount > 0 ? totalApp / totalCount : 0.35,
      pctWithWearable: totalCount > 0 ? totalWearable / totalCount : 0.22,
    },
    sources: [
      getDemographics(market).source,
      'HK BRFSS 2020 / SG NPHS 2022 (activity baselines)',
      'HK Life Tables 2018-2066 / SG Complete Life Tables 2023 (mortality)',
      'GSMA Intelligence 2023 (smartphone penetration)',
      'GfK/Statista 2023 (wearable penetration)',
      'Deloitte Global Mobile Consumer Survey 2023 (health app adoption)',
    ],
  };
}

/**
 * Filter a population cohort to only include members with the required signal.
 *
 * For 'phone' signals: uses phoneCount (highest penetration, ~89%)
 * For 'wearable' signals: uses wearableCount (~22-28%)
 * For 'app' signals: uses appCount (~34-40%)
 * For 'clinical' signals: assumes 100% can access clinical screening
 *
 * Returns a new PopulationCohort with adjusted counts.
 */
export function getEligibleCohort(
  cohort: PopulationCohort,
  requiredSignal: RequiredSignal,
): PopulationCohort {
  if (requiredSignal === 'clinical') {
    // Clinical signals don't depend on device penetration
    return cohort;
  }

  const cells: CohortCell[] = [];
  const archetypeTotals: Record<string, number> = {};
  for (const a of ARCHETYPES) archetypeTotals[a.id] = 0;

  let totalPhone = 0;
  let totalApp = 0;
  let totalWearable = 0;
  let totalCount = 0;
  let totalWeightedSteps = 0;
  let totalWeightedSedentary = 0;
  let totalWeightedAge = 0;

  for (const cell of cohort.cells) {
    // Determine eligible count based on required signal
    let eligibleFraction: number;
    switch (requiredSignal) {
      case 'phone':
        eligibleFraction = cell.signalCoverage.phoneCount / (cell.count || 1);
        break;
      case 'wearable':
        eligibleFraction = cell.signalCoverage.wearableCount / (cell.count || 1);
        break;
      case 'app':
        eligibleFraction = cell.signalCoverage.appCount / (cell.count || 1);
        break;
      default:
        eligibleFraction = 1.0;
    }

    const eligibleCount = Math.round(cell.count * eligibleFraction);
    if (eligibleCount === 0) continue;

    // Scale archetype breakdown proportionally
    const archetypeBreakdown: Record<string, number> = {};
    let assigned = 0;
    const archIds = Object.keys(cell.archetypeBreakdown);
    for (let i = 0; i < archIds.length; i++) {
      const id = archIds[i];
      if (i === archIds.length - 1) {
        archetypeBreakdown[id] = eligibleCount - assigned;
      } else {
        const count = Math.round((cell.archetypeBreakdown[id] / (cell.count || 1)) * eligibleCount);
        archetypeBreakdown[id] = count;
        assigned += count;
      }
      archetypeTotals[id] = (archetypeTotals[id] ?? 0) + archetypeBreakdown[id];
    }

    const signalCoverage: SignalCoverage = {
      phoneCount: Math.round(cell.signalCoverage.phoneCount * eligibleFraction),
      appCount: Math.round(cell.signalCoverage.appCount * eligibleFraction),
      wearableCount: Math.round(cell.signalCoverage.wearableCount * eligibleFraction),
    };

    cells.push({
      ...cell,
      count: eligibleCount,
      archetypeBreakdown,
      signalCoverage,
    });

    // Parse age from band label for average
    const ageParts = cell.ageBand.split('-');
    const midAge = (parseInt(ageParts[0]) + parseInt(ageParts[1])) / 2;

    totalPhone += signalCoverage.phoneCount;
    totalApp += signalCoverage.appCount;
    totalWearable += signalCoverage.wearableCount;
    totalCount += eligibleCount;
    totalWeightedSteps += cell.baselineSteps.central * eligibleCount;
    totalWeightedSedentary += 0.35 * eligibleCount; // estimate
    totalWeightedAge += midAge * eligibleCount;
  }

  const avgSteps = totalCount > 0 ? totalWeightedSteps / totalCount : 5500;
  const avgSedentary = totalCount > 0 ? totalWeightedSedentary / totalCount : 0.35;

  return {
    market: cohort.market,
    totalSize: totalCount,
    cells,
    archetypeTotals,
    signalCoverageTotals: {
      phoneCount: totalPhone,
      appCount: totalApp,
      wearableCount: totalWearable,
    },
    summary: {
      avgAge: totalCount > 0 ? totalWeightedAge / totalCount : 42,
      avgSteps: { central: avgSteps, low: avgSteps * 0.88, high: avgSteps * 1.12 },
      pctSedentary: { central: avgSedentary, low: avgSedentary * 0.85, high: avgSedentary * 1.15 },
      pctWithPhone: totalCount > 0 ? totalPhone / totalCount : 0.89,
      pctWithApp: totalCount > 0 ? totalApp / totalCount : 0.35,
      pctWithWearable: totalCount > 0 ? totalWearable / totalCount : 0.22,
    },
    sources: cohort.sources,
  };
}
