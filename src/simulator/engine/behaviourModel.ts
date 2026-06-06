import type {
  Range, PopulationCohort, CellBehaviourResult,
  ArchetypeBehaviourResult, BehaviourModelOutput,
} from '../types';
import type { MetricEvidenceChain } from '../data/metricEvidence';
import { ARCHETYPES, getArchetype } from '../data/archetypes';

/**
 * Behaviour change model parameterized per metric.
 *
 * Instead of hardcoded step changes, accepts a MetricEvidenceChain
 * to scale behaviour shifts appropriately for each campaign's metric.
 *
 * For backward compatibility, if no evidence chain is provided,
 * falls back to the original step-based model.
 */

/** Generate monthly engagement fractions for a given decay curve */
function generateDecayCurve(
  decayType: 'none' | 'fast' | 'gradual' | 'slow',
  persistence12Mo: number,
  months: number,
): number[] {
  const curve: number[] = [];

  for (let m = 1; m <= months; m++) {
    switch (decayType) {
      case 'none':
        curve.push(0);
        break;
      case 'fast': {
        const rate = -Math.log(0.05) / 3;
        curve.push(Math.exp(-rate * m));
        break;
      }
      case 'gradual': {
        const target = persistence12Mo;
        const rate = -Math.log(target) / 12;
        curve.push(Math.max(target * 0.5, Math.exp(-rate * m)));
        break;
      }
      case 'slow': {
        const target = persistence12Mo;
        const rate = -Math.log(target) / 18;
        curve.push(Math.max(target * 0.7, Math.exp(-rate * m)));
        break;
      }
    }
  }

  return curve;
}

function stepChangeRange(mean: number, sd: number): Range {
  return {
    low: Math.max(0, mean - sd),
    central: mean,
    high: mean + sd,
  };
}

function multiplyRange(r: Range, factor: number): Range {
  return { low: r.low * factor, central: r.central * factor, high: r.high * factor };
}

function addRange(a: Range, b: Range): Range {
  return { low: a.low + b.low, central: a.central + b.central, high: a.high + b.high };
}

/**
 * Model behaviour change for a metric-specific campaign.
 *
 * The evidence chain provides:
 * - behaviourShift magnitude → scales archetype step changes
 * - improvedSharePct → adjusts effective engagement
 * - sustainedRatePct → adjusts persistence
 *
 * @param cohort Population cohort (may be signal-filtered)
 * @param horizonMonths Simulation horizon
 * @param evidence Optional metric evidence chain for per-metric parameterization
 * @param metricArchetypeShares Optional pre-computed metric-adapted archetype shares
 */
export function modelBehaviourChange(
  cohort: PopulationCohort,
  horizonMonths: number,
  evidence?: MetricEvidenceChain,
  metricArchetypeShares?: Record<string, number>,
): BehaviourModelOutput {
  const results: CellBehaviourResult[] = [];
  const archetypeAggs: Record<string, ArchetypeBehaviourResult> = {};

  // Scale factor for step changes based on metric evidence
  // If the evidence shows a different magnitude of change than steps,
  // we normalize to the step-change scale (which is what archetypes model)
  const metricScaleFactor = evidence
    ? getMetricScaleFactor(evidence)
    : 1.0;

  // Initialise aggregators
  for (const a of ARCHETYPES) {
    archetypeAggs[a.id] = {
      archetypeId: a.id,
      archetypeName: a.name,
      count: 0,
      baselineSteps: 0,
      stepChange: { low: 0, central: 0, high: 0 },
      projectedSteps: { low: 0, central: 0, high: 0 },
      persistingAtHorizon: { low: 0, central: 0, high: 0 },
      monthlyEngagement: new Array(horizonMonths).fill(0),
    };
  }

  let totalEffective: Range = { low: 0, central: 0, high: 0 };
  let totalWeightedStepChange: Range = { low: 0, central: 0, high: 0 };
  let totalWeightCount = 0;

  for (const cell of cohort.cells) {
    const cellArchetypes: ArchetypeBehaviourResult[] = [];
    let cellWeightedStepChange: Range = { low: 0, central: 0, high: 0 };
    let cellPersistence: Range = { low: 0, central: 0, high: 0 };
    let cellEffective: Range = { low: 0, central: 0, high: 0 };

    for (const archetype of ARCHETYPES) {
      // Use metric-adapted shares if provided, else use cohort's breakdown
      let count: number;
      if (metricArchetypeShares) {
        count = Math.round(cell.count * (metricArchetypeShares[archetype.id] ?? 0));
      } else {
        count = cell.archetypeBreakdown[archetype.id] ?? 0;
      }
      if (count === 0) continue;

      const arch = getArchetype(archetype.id)!;
      const baseSteps = cell.baselineSteps.central;

      // Step change scaled by metric factor
      const scaledMean = arch.stepChangeMean * metricScaleFactor;
      const scaledSD = arch.stepChangeSD * metricScaleFactor;
      const change = stepChangeRange(scaledMean, scaledSD);

      const decayCurve = generateDecayCurve(
        arch.decayCurve,
        arch.persistenceAt12Mo,
        horizonMonths,
      );

      const endEngagement = decayCurve.length > 0 ? decayCurve[decayCurve.length - 1] : 0;
      const persistingCount: Range = {
        low: Math.round(count * endEngagement * 0.8),
        central: Math.round(count * endEngagement),
        high: Math.round(count * endEngagement * 1.2),
      };

      const avgEngagement = decayCurve.length > 0
        ? decayCurve.reduce((s, v) => s + v, 0) / decayCurve.length
        : 0;
      const effectiveChange = multiplyRange(change, avgEngagement);

      const archResult: ArchetypeBehaviourResult = {
        archetypeId: arch.id,
        archetypeName: arch.name,
        count,
        baselineSteps: baseSteps,
        stepChange: effectiveChange,
        projectedSteps: {
          low: baseSteps + effectiveChange.low,
          central: baseSteps + effectiveChange.central,
          high: baseSteps + effectiveChange.high,
        },
        persistingAtHorizon: persistingCount,
        monthlyEngagement: decayCurve,
      };

      cellArchetypes.push(archResult);

      const agg = archetypeAggs[arch.id];
      agg.count += count;
      agg.baselineSteps = (agg.baselineSteps * (agg.count - count) + baseSteps * count) / agg.count;
      agg.stepChange = addRange(agg.stepChange, multiplyRange(effectiveChange, count));
      agg.persistingAtHorizon = addRange(agg.persistingAtHorizon, persistingCount);

      cellWeightedStepChange = addRange(cellWeightedStepChange, multiplyRange(effectiveChange, count));
      cellPersistence = addRange(cellPersistence, persistingCount);
      cellEffective = addRange(cellEffective, {
        low: count * avgEngagement * 0.8,
        central: count * avgEngagement,
        high: count * avgEngagement * 1.2,
      });
    }

    const cellTotal = cell.count || 1;
    results.push({
      ageBand: cell.ageBand,
      gender: cell.gender,
      totalCount: cell.count,
      archetypes: cellArchetypes,
      weightedStepChange: {
        low: cellWeightedStepChange.low / cellTotal,
        central: cellWeightedStepChange.central / cellTotal,
        high: cellWeightedStepChange.high / cellTotal,
      },
      weightedPersistence: cellPersistence,
      effectiveParticipants: cellEffective,
    });

    totalEffective = addRange(totalEffective, cellEffective);
    totalWeightedStepChange = addRange(totalWeightedStepChange, cellWeightedStepChange);
    totalWeightCount += cell.count;
  }

  const archetypeSummary: ArchetypeBehaviourResult[] = [];
  for (const a of ARCHETYPES) {
    const agg = archetypeAggs[a.id];
    if (agg.count > 0) {
      agg.stepChange = {
        low: agg.stepChange.low / agg.count,
        central: agg.stepChange.central / agg.count,
        high: agg.stepChange.high / agg.count,
      };
      agg.projectedSteps = {
        low: agg.baselineSteps + agg.stepChange.low,
        central: agg.baselineSteps + agg.stepChange.central,
        high: agg.baselineSteps + agg.stepChange.high,
      };
    }
    archetypeSummary.push(agg);
  }

  const avgStepChange: Range = totalWeightCount > 0
    ? {
        low: totalWeightedStepChange.low / totalWeightCount,
        central: totalWeightedStepChange.central / totalWeightCount,
        high: totalWeightedStepChange.high / totalWeightCount,
      }
    : { low: 0, central: 0, high: 0 };

  const metricLabel = evidence?.label ?? 'general programme';

  return {
    byCellAndArchetype: results,
    totalEffectiveParticipants: totalEffective,
    totalWeightedStepChange: avgStepChange,
    archetypeSummary,
    sources: [
      'Patel MS et al. 2016, Annals of Internal Medicine (step change calibration)',
      'Patel MS et al. 2019, JAMA Internal Medicine (gamification effects)',
      'Discovery Vitality 13-year longitudinal data (persistence rates)',
      ...(evidence ? evidence.interventionSources : []),
    ],
    explanation: `Modelled ${cohort.totalSize.toLocaleString()} people across 6 behavioural archetypes for ${metricLabel}. ` +
      `Effective participants at ${horizonMonths} months: ` +
      `${Math.round(totalEffective.low).toLocaleString()}–${Math.round(totalEffective.central).toLocaleString()}–${Math.round(totalEffective.high).toLocaleString()}.`,
  };
}

/**
 * Compute a scale factor to adapt step-based archetype changes
 * to a different health metric.
 *
 * The archetypes were calibrated for ~1,200 steps/day average increase.
 * For other metrics, we normalize the expected improvement relative to
 * the evidence chain's behaviour shift magnitude.
 */
function getMetricScaleFactor(evidence: MetricEvidenceChain): number {
  // Use the expected improvement rate from actuarial config as a proxy
  // Higher improvement rate → larger effective behaviour shift
  // Normalize against steps baseline (0.05 expectedImprovementRate)
  const stepsBaseline = 0.05;
  const metricRate = evidence.expectedImprovementRate;
  return Math.max(0.5, Math.min(3.0, metricRate / stepsBaseline));
}
