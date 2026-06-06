import type {
  Range, CellBehaviourResult, CellHealthImpact, ArchetypeHealthImpact,
  HealthImpactOutput, MortalityRate, SignalPathwayValue, PopulationCohort,
} from '../types';
import { interpolateHazardRatio, STEPS_DOSE_RESPONSE, CVD_RISK_REDUCTION_FOR_ACTIVE, CVD_SOURCE, DIABETES_RISK_REDUCTION_FOR_ACTIVE, DIABETES_SOURCE } from '../data/doseResponse';
import { ARCHETYPES } from '../data/archetypes';

/**
 * Step 5: Calculate health impact using multiple signal pathways.
 *
 * SIGNAL PATHWAYS:
 *
 * 1. STEPS → All-cause mortality (everyone with phone — ~89%)
 *    Source: Paluch 2022, non-linear dose-response
 *
 * 2. STEPS → CVD event reduction (everyone with phone)
 *    Source: PURE Study (Lear 2017), 20% CVD reduction for active
 *
 * 3. STEPS → Type 2 diabetes risk reduction (everyone with phone)
 *    Source: Aune 2015, 25% reduction for active vs sedentary
 *
 * 4. SLEEP → Mortality risk (people with wearable or app — ~35%)
 *    Source: Cappuccio 2010, short sleep RR 1.12
 *    Intervention: sleep coaching via app nudges
 *
 * 5. HRV/HR → Cardiovascular risk detection (wearable users — ~22%)
 *    Source: Hilton 2022, lower HRV = universal mortality predictor
 *    Value: early detection → earlier treatment → avoided events
 *
 * 6. FITNESS (VO₂max proxy) → Mortality (wearable users)
 *    Source: Mandsager 2018, HR 0.20 elite vs low fitness
 *    Value: fitness improvement from sustained activity
 *
 * Each pathway runs only for the subset of the cohort that has the
 * required signal, based on real penetration data.
 */

function addRanges(...ranges: Range[]): Range {
  return ranges.reduce(
    (acc, r) => ({ low: acc.low + r.low, central: acc.central + r.central, high: acc.high + r.high }),
    { low: 0, central: 0, high: 0 },
  );
}

function multiplyRange(r: Range, factor: number): Range {
  return { low: r.low * factor, central: r.central * factor, high: r.high * factor };
}

/**
 * Sleep mortality risk reduction.
 * Cappuccio 2010: short sleep (<6h) RR 1.12 → improving to 7-8h = ~10% risk reduction.
 * Only applies to people whose sleep is being tracked (wearable + app users).
 * Conservative: assume 40% of tracked users have suboptimal sleep, and intervention
 * improves 30% of those → net 12% × 0.40 × 0.30 = ~1.4% mortality reduction for tracked.
 */
const SLEEP_MORTALITY_REDUCTION_TRACKED = 0.014;
const SLEEP_SOURCE = 'Cappuccio FP et al. 2010, Sleep. n=1,382,999. Short sleep RR 1.12.';

/**
 * HRV/HR cardiovascular early detection value.
 * Hilton 2022: lower HRV = universal mortality predictor.
 * Value comes from early flagging → clinical intervention.
 * Conservative estimate: 2% of wearable users get early CV flag → 50% of those
 * get meaningful intervention → avoids ~15% of their would-be events.
 * Net: 0.02 × 0.50 × 0.15 = 0.15% additional mortality reduction for wearable users.
 */
const HRV_CV_DETECTION_MORTALITY_REDUCTION = 0.0015;
const HRV_SOURCE = 'Hilton MF et al. 2022, Neuroscience & Biobehavioral Reviews. n=38,008.';

/**
 * Fitness improvement mortality reduction for sustained exercisers.
 * Mandsager 2018: going from low to moderate fitness = HR ~0.50.
 * Only applies to super-engagers and steady movers who sustain activity.
 * Net additional mortality reduction beyond step-count effect: ~3% for these groups.
 */
const FITNESS_MORTALITY_REDUCTION_SUSTAINED = 0.03;
const FITNESS_SOURCE = 'Mandsager K et al. 2018, JAMA Network Open. n=122,007.';

export function calculateHealthImpact(
  behaviourResults: CellBehaviourResult[],
  mortalityData: MortalityRate[],
  cohort: PopulationCohort,
  horizonYears: number,
): HealthImpactOutput {
  const cellImpacts: CellHealthImpact[] = [];
  let totalAvoidedDeaths: Range = { low: 0, central: 0, high: 0 };
  let totalMorbidityReduction: Range = { low: 0, central: 0, high: 0 };
  const archetypeValueAccum: Record<string, number> = {};
  for (const a of ARCHETYPES) archetypeValueAccum[a.id] = 0;

  // Signal pathway accumulators
  let stepsDeathsAvoided: Range = { low: 0, central: 0, high: 0 };
  let cvdEventsAvoided: Range = { low: 0, central: 0, high: 0 };
  let diabetesRiskReduced: Range = { low: 0, central: 0, high: 0 };
  let sleepDeathsAvoided: Range = { low: 0, central: 0, high: 0 };
  let hrvDeathsAvoided: Range = { low: 0, central: 0, high: 0 };
  let fitnessDeathsAvoided: Range = { low: 0, central: 0, high: 0 };

  let totalPhoneCovered = 0;
  let totalAppCovered = 0;
  let totalWearableCovered = 0;

  for (const cell of behaviourResults) {
    const mortalityEntry = mortalityData.find(
      (m) => m.ageBand === cell.ageBand && m.gender === cell.gender,
    );
    const baseMortalityPer1000 = mortalityEntry?.annualMortalityPer1000 ?? 1.5;
    const baselineAnnualDeaths = (cell.totalCount * baseMortalityPer1000) / 1000;

    // Get signal coverage for this cell
    const cohortCell = cohort.cells.find(
      (c) => c.ageBand === cell.ageBand && c.gender === cell.gender,
    );
    const phoneCount = cohortCell?.signalCoverage.phoneCount ?? Math.round(cell.totalCount * 0.89);
    const appCount = cohortCell?.signalCoverage.appCount ?? Math.round(cell.totalCount * 0.35);
    const wearableCount = cohortCell?.signalCoverage.wearableCount ?? Math.round(cell.totalCount * 0.22);

    totalPhoneCovered += phoneCount;
    totalAppCovered += appCount;
    totalWearableCovered += wearableCount;

    const archetypeImpacts: ArchetypeHealthImpact[] = [];
    let cellAvoidedDeaths: Range = { low: 0, central: 0, high: 0 };
    let cellMorbidity: Range = { low: 0, central: 0, high: 0 };

    for (const archResult of cell.archetypes) {
      const archetype = ARCHETYPES.find((a) => a.id === archResult.archetypeId);
      if (!archetype || archResult.count === 0) continue;

      const baseSteps = archResult.baselineSteps;
      const hrBaseline = interpolateHazardRatio(baseSteps);
      const hrProjectedCentral = interpolateHazardRatio(archResult.projectedSteps.central);
      const hrProjectedLow = interpolateHazardRatio(archResult.projectedSteps.low);
      const hrProjectedHigh = interpolateHazardRatio(archResult.projectedSteps.high);

      // ── PATHWAY 1: Steps → all-cause mortality (phone users only) ──
      const phoneFraction = phoneCount / (cell.totalCount || 1);
      const rrr: Range = {
        low: Math.max(0, 1 - (hrProjectedLow.high / hrBaseline.central)) * phoneFraction,
        central: Math.max(0, 1 - (hrProjectedCentral.central / hrBaseline.central)) * phoneFraction,
        high: Math.max(0, 1 - (hrProjectedHigh.low / hrBaseline.central)) * phoneFraction,
      };

      const archDeaths = (archResult.count * baseMortalityPer1000) / 1000;
      const stepsAvoidedLocal: Range = {
        low: archDeaths * rrr.low * horizonYears,
        central: archDeaths * rrr.central * horizonYears,
        high: archDeaths * rrr.high * horizonYears,
      };
      stepsDeathsAvoided = addRanges(stepsDeathsAvoided, stepsAvoidedLocal);

      // ── PATHWAY 2: Steps → CVD (phone users) ──
      // CVD reduction proportional to step change relative to guideline threshold
      const stepChangeRatio = Math.min(1.0, archResult.stepChange.central / 1500);
      const cvdReduction = CVD_RISK_REDUCTION_FOR_ACTIVE * stepChangeRatio * phoneFraction;
      const cvdLocal: Range = {
        low: archDeaths * cvdReduction * 0.7 * horizonYears,
        central: archDeaths * cvdReduction * horizonYears,
        high: archDeaths * cvdReduction * 1.3 * horizonYears,
      };
      cvdEventsAvoided = addRanges(cvdEventsAvoided, cvdLocal);

      // ── PATHWAY 3: Steps → Diabetes (phone users) ──
      const diabetesReduction = DIABETES_RISK_REDUCTION_FOR_ACTIVE * stepChangeRatio * phoneFraction * 0.3; // 30% of mortality attributable
      const diabetesLocal: Range = {
        low: archDeaths * diabetesReduction * 0.7 * horizonYears,
        central: archDeaths * diabetesReduction * horizonYears,
        high: archDeaths * diabetesReduction * 1.3 * horizonYears,
      };
      diabetesRiskReduced = addRanges(diabetesRiskReduced, diabetesLocal);

      // ── PATHWAY 4: Sleep → Mortality (app + wearable users) ──
      const sleepFraction = (appCount + wearableCount) / (cell.totalCount || 1);
      const sleepLocal: Range = {
        low: archDeaths * SLEEP_MORTALITY_REDUCTION_TRACKED * sleepFraction * 0.6 * horizonYears,
        central: archDeaths * SLEEP_MORTALITY_REDUCTION_TRACKED * sleepFraction * horizonYears,
        high: archDeaths * SLEEP_MORTALITY_REDUCTION_TRACKED * sleepFraction * 1.5 * horizonYears,
      };
      sleepDeathsAvoided = addRanges(sleepDeathsAvoided, sleepLocal);

      // ── PATHWAY 5: HRV → CV detection (wearable users only) ──
      const wearableFraction = wearableCount / (cell.totalCount || 1);
      const hrvLocal: Range = {
        low: archDeaths * HRV_CV_DETECTION_MORTALITY_REDUCTION * wearableFraction * 0.5 * horizonYears,
        central: archDeaths * HRV_CV_DETECTION_MORTALITY_REDUCTION * wearableFraction * horizonYears,
        high: archDeaths * HRV_CV_DETECTION_MORTALITY_REDUCTION * wearableFraction * 2.0 * horizonYears,
      };
      hrvDeathsAvoided = addRanges(hrvDeathsAvoided, hrvLocal);

      // ── PATHWAY 6: Fitness → Mortality (wearable + sustained activity) ──
      const isSustained = archetype.id === 'steady_movers' || archetype.id === 'super_engagers';
      const fitnessLocal: Range = isSustained ? {
        low: archDeaths * FITNESS_MORTALITY_REDUCTION_SUSTAINED * wearableFraction * 0.5 * horizonYears,
        central: archDeaths * FITNESS_MORTALITY_REDUCTION_SUSTAINED * wearableFraction * horizonYears,
        high: archDeaths * FITNESS_MORTALITY_REDUCTION_SUSTAINED * wearableFraction * 1.5 * horizonYears,
      } : { low: 0, central: 0, high: 0 };
      fitnessDeathsAvoided = addRanges(fitnessDeathsAvoided, fitnessLocal);

      // ── Aggregate for this archetype ──
      const totalArchDeaths = addRanges(stepsAvoidedLocal, cvdLocal, diabetesLocal, sleepLocal, hrvLocal, fitnessLocal);

      // Morbidity: broader than mortality — CVD events, hospitalizations, diabetes management
      const morbidityReduction: Range = {
        low: (rrr.low + cvdReduction * 0.7 + diabetesReduction * 0.7) * 1.5,
        central: (rrr.central + cvdReduction + diabetesReduction) * 1.5,
        high: (rrr.high + cvdReduction * 1.3 + diabetesReduction * 1.3) * 1.5,
      };

      archetypeImpacts.push({
        archetypeId: archResult.archetypeId,
        count: archResult.count,
        stepChange: archResult.stepChange,
        hazardRatioBaseline: hrBaseline.central,
        hazardRatioProjected: { low: hrProjectedLow.central, central: hrProjectedCentral.central, high: hrProjectedHigh.central },
        relativeRiskReduction: rrr,
        avoidedDeaths: totalArchDeaths,
        morbidityReduction,
      });

      cellAvoidedDeaths = addRanges(cellAvoidedDeaths, totalArchDeaths);
      cellMorbidity = addRanges(cellMorbidity, multiplyRange(morbidityReduction, archResult.count));
      archetypeValueAccum[archResult.archetypeId] += totalArchDeaths.central;
    }

    cellImpacts.push({
      ageBand: cell.ageBand,
      gender: cell.gender,
      baselineAnnualDeaths,
      archetypeImpacts,
      totalAvoidedDeaths: cellAvoidedDeaths,
      totalMorbidityReduction: cellMorbidity,
    });

    totalAvoidedDeaths = addRanges(totalAvoidedDeaths, cellAvoidedDeaths);
    totalMorbidityReduction = addRanges(totalMorbidityReduction, cellMorbidity);
  }

  // ── Mortality reduction % ──
  const totalBaselineDeaths = cellImpacts.reduce((s, c) => s + c.baselineAnnualDeaths, 0) * horizonYears;
  const mortalityReductionPct: Range = totalBaselineDeaths > 0
    ? {
        low: (totalAvoidedDeaths.low / totalBaselineDeaths) * 100,
        central: (totalAvoidedDeaths.central / totalBaselineDeaths) * 100,
        high: (totalAvoidedDeaths.high / totalBaselineDeaths) * 100,
      }
    : { low: 0, central: 0, high: 0 };

  // ── Archetype contribution ──
  const totalCentralValue = Object.values(archetypeValueAccum).reduce((s, v) => s + v, 0);
  const archetypeContribution = ARCHETYPES.map((a) => ({
    id: a.id,
    name: a.name,
    pctOfTotalValue: totalCentralValue > 0 ? (archetypeValueAccum[a.id] / totalCentralValue) * 100 : 0,
  }));

  const totalPeople = behaviourResults.reduce((s, c) => s + c.totalCount, 0);
  const totalMorbidityPct: Range = totalPeople > 0
    ? {
        low: (totalMorbidityReduction.low / totalPeople) * 100,
        central: (totalMorbidityReduction.central / totalPeople) * 100,
        high: (totalMorbidityReduction.high / totalPeople) * 100,
      }
    : { low: 0, central: 0, high: 0 };

  // ── Signal pathway breakdown ──
  const allDeathsCentral = totalAvoidedDeaths.central || 1;
  const signalPathways: SignalPathwayValue[] = [
    {
      signal: 'daily_steps',
      label: 'Steps → All-Cause Mortality',
      source: STEPS_DOSE_RESPONSE.source,
      cohortCovered: totalPhoneCovered,
      pctOfCohort: totalPeople > 0 ? (totalPhoneCovered / totalPeople) * 100 : 0,
      avoidedDeaths: stepsDeathsAvoided,
      morbidityReduction: multiplyRange(stepsDeathsAvoided, 1.5),
      pctOfTotalValue: (stepsDeathsAvoided.central / allDeathsCentral) * 100,
    },
    {
      signal: 'steps_cvd',
      label: 'Steps → CVD Risk Reduction',
      source: CVD_SOURCE,
      cohortCovered: totalPhoneCovered,
      pctOfCohort: totalPeople > 0 ? (totalPhoneCovered / totalPeople) * 100 : 0,
      avoidedDeaths: cvdEventsAvoided,
      morbidityReduction: multiplyRange(cvdEventsAvoided, 2.0),
      pctOfTotalValue: (cvdEventsAvoided.central / allDeathsCentral) * 100,
    },
    {
      signal: 'steps_diabetes',
      label: 'Steps → Diabetes Risk Reduction',
      source: DIABETES_SOURCE,
      cohortCovered: totalPhoneCovered,
      pctOfCohort: totalPeople > 0 ? (totalPhoneCovered / totalPeople) * 100 : 0,
      avoidedDeaths: diabetesRiskReduced,
      morbidityReduction: multiplyRange(diabetesRiskReduced, 3.0),
      pctOfTotalValue: (diabetesRiskReduced.central / allDeathsCentral) * 100,
    },
    {
      signal: 'sleep',
      label: 'Sleep Tracking → Mortality Risk',
      source: SLEEP_SOURCE,
      cohortCovered: totalAppCovered + totalWearableCovered,
      pctOfCohort: totalPeople > 0 ? ((totalAppCovered + totalWearableCovered) / totalPeople) * 100 : 0,
      avoidedDeaths: sleepDeathsAvoided,
      morbidityReduction: multiplyRange(sleepDeathsAvoided, 2.0),
      pctOfTotalValue: (sleepDeathsAvoided.central / allDeathsCentral) * 100,
    },
    {
      signal: 'hrv',
      label: 'HRV → CV Early Detection',
      source: HRV_SOURCE,
      cohortCovered: totalWearableCovered,
      pctOfCohort: totalPeople > 0 ? (totalWearableCovered / totalPeople) * 100 : 0,
      avoidedDeaths: hrvDeathsAvoided,
      morbidityReduction: multiplyRange(hrvDeathsAvoided, 3.0),
      pctOfTotalValue: (hrvDeathsAvoided.central / allDeathsCentral) * 100,
    },
    {
      signal: 'fitness',
      label: 'Fitness Improvement → Mortality',
      source: FITNESS_SOURCE,
      cohortCovered: totalWearableCovered,
      pctOfCohort: totalPeople > 0 ? (totalWearableCovered / totalPeople) * 100 : 0,
      avoidedDeaths: fitnessDeathsAvoided,
      morbidityReduction: multiplyRange(fitnessDeathsAvoided, 1.5),
      pctOfTotalValue: (fitnessDeathsAvoided.central / allDeathsCentral) * 100,
    },
  ];

  return {
    byCellAndArchetype: cellImpacts,
    totals: {
      avoidedDeaths: totalAvoidedDeaths,
      mortalityReductionPct,
      morbidityReductionPct: totalMorbidityPct,
      archetypeContribution,
    },
    signalPathways,
    sources: [
      STEPS_DOSE_RESPONSE.source,
      CVD_SOURCE,
      DIABETES_SOURCE,
      SLEEP_SOURCE,
      HRV_SOURCE,
      FITNESS_SOURCE,
    ],
    explanation: `Over ${horizonYears} year${horizonYears > 1 ? 's' : ''}, the programme is projected to avoid ` +
      `${totalAvoidedDeaths.low.toFixed(1)}–${totalAvoidedDeaths.central.toFixed(1)}–${totalAvoidedDeaths.high.toFixed(1)} deaths ` +
      `across 6 health signal pathways. ` +
      `Steps (${(totalPhoneCovered / totalPeople * 100).toFixed(0)}% coverage via phone) drive the majority of value. ` +
      `Sleep tracking (${((totalAppCovered + totalWearableCovered) / totalPeople * 100).toFixed(0)}% coverage) and ` +
      `HRV/fitness monitoring (${(totalWearableCovered / totalPeople * 100).toFixed(0)}% via wearable) add incremental value. ` +
      `Higher wearable penetration = more signal pathways = more value captured.`,
  };
}
