import type { Range, MortalityRate, PopulationCohort, CellHealthImpact, ArchetypeHealthImpact, HealthImpactOutput } from '../types';
import type { MetricEvidenceChain } from '../data/metricEvidence';
import { getMetricDoseResponse } from '../data/metricDoseResponse';
import { ARCHETYPES } from '../data/archetypes';
import type { CellBehaviourResult } from '../types';

/**
 * Per-metric health impact model.
 *
 * Unlike the original multi-pathway healthImpactModel, this calculates
 * health impact for a single metric using its specific dose-response
 * function and evidence chain.
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
 * Calculate health impact for a single metric campaign.
 *
 * Uses the metric's specific dose-response function and evidence chain
 * rather than the generic step-based pathways.
 */
export function calculateMetricHealthImpact(
  behaviourResults: CellBehaviourResult[],
  mortalityData: MortalityRate[],
  _cohort: PopulationCohort,
  horizonYears: number,
  evidence: MetricEvidenceChain,
): HealthImpactOutput {
  const doseResponse = getMetricDoseResponse(evidence.metric);
  const cellImpacts: CellHealthImpact[] = [];
  let totalAvoidedDeaths: Range = { low: 0, central: 0, high: 0 };
  let totalMorbidityReduction: Range = { low: 0, central: 0, high: 0 };
  const archetypeValueAccum: Record<string, number> = {};
  for (const a of ARCHETYPES) archetypeValueAccum[a.id] = 0;

  // Central shift magnitude for dose-response
  const centralMarkerShift = (evidence.markerShift.value.low + evidence.markerShift.value.high) / 2;

  // Use marker shift for dose-response (more clinically relevant)
  const shiftForDoseResponse = centralMarkerShift;

  // Get dose-response-derived risk reductions
  const mortalityDR = doseResponse
    ? doseResponse.mortalityReduction(shiftForDoseResponse)
    : { low: evidence.mortalityRiskReduction.low, central: (evidence.mortalityRiskReduction.low + evidence.mortalityRiskReduction.high) / 2, high: evidence.mortalityRiskReduction.high };
  const morbidityDR = doseResponse
    ? doseResponse.morbidityReduction(shiftForDoseResponse)
    : { low: evidence.morbidityRiskReduction.low, central: (evidence.morbidityRiskReduction.low + evidence.morbidityRiskReduction.high) / 2, high: evidence.morbidityRiskReduction.high };

  // Improved share (what fraction of participants actually improve)
  const centralImprovedShare = (evidence.improvedSharePct.low + evidence.improvedSharePct.high) / 2;
  // Sustained rate (of those who improve, how many sustain)
  const centralSustainedRate = (evidence.sustainedRatePct.low + evidence.sustainedRatePct.high) / 2;

  let totalPeople = 0;

  for (const cell of behaviourResults) {
    const mortalityEntry = mortalityData.find(
      (m) => m.ageBand === cell.ageBand && m.gender === cell.gender,
    );
    const baseMortalityPer1000 = mortalityEntry?.annualMortalityPer1000 ?? 1.5;
    const baselineAnnualDeaths = (cell.totalCount * baseMortalityPer1000) / 1000;

    const archetypeImpacts: ArchetypeHealthImpact[] = [];
    let cellAvoidedDeaths: Range = { low: 0, central: 0, high: 0 };
    let cellMorbidity: Range = { low: 0, central: 0, high: 0 };

    for (const archResult of cell.archetypes) {
      const archetype = ARCHETYPES.find((a) => a.id === archResult.archetypeId);
      if (!archetype || archResult.count === 0) continue;

      // Non-starters get zero benefit
      if (archetype.id === 'non_starters') {
        archetypeImpacts.push({
          archetypeId: archResult.archetypeId,
          count: archResult.count,
          stepChange: { low: 0, central: 0, high: 0 },
          hazardRatioBaseline: 1.0,
          hazardRatioProjected: { low: 1.0, central: 1.0, high: 1.0 },
          relativeRiskReduction: { low: 0, central: 0, high: 0 },
          avoidedDeaths: { low: 0, central: 0, high: 0 },
          morbidityReduction: { low: 0, central: 0, high: 0 },
        });
        continue;
      }

      // Scale risk reduction by engagement × improved share × sustained rate
      const avgEngagement = archResult.monthlyEngagement.length > 0
        ? archResult.monthlyEngagement.reduce((s, v) => s + v, 0) / archResult.monthlyEngagement.length
        : 0;

      const effectiveFraction = avgEngagement * centralImprovedShare * centralSustainedRate;

      const rrr: Range = {
        low: mortalityDR.low * effectiveFraction * 0.8,
        central: mortalityDR.central * effectiveFraction,
        high: mortalityDR.high * effectiveFraction * 1.2,
      };

      const archDeaths = (archResult.count * baseMortalityPer1000) / 1000;
      const avoided: Range = {
        low: archDeaths * rrr.low * horizonYears,
        central: archDeaths * rrr.central * horizonYears,
        high: archDeaths * rrr.high * horizonYears,
      };

      const morbidity: Range = {
        low: morbidityDR.low * effectiveFraction * 0.8 * 1.5,
        central: morbidityDR.central * effectiveFraction * 1.5,
        high: morbidityDR.high * effectiveFraction * 1.2 * 1.5,
      };

      archetypeImpacts.push({
        archetypeId: archResult.archetypeId,
        count: archResult.count,
        stepChange: archResult.stepChange,
        hazardRatioBaseline: 1.0,
        hazardRatioProjected: {
          low: 1.0 - rrr.high,
          central: 1.0 - rrr.central,
          high: 1.0 - rrr.low,
        },
        relativeRiskReduction: rrr,
        avoidedDeaths: avoided,
        morbidityReduction: morbidity,
      });

      cellAvoidedDeaths = addRanges(cellAvoidedDeaths, avoided);
      cellMorbidity = addRanges(cellMorbidity, multiplyRange(morbidity, archResult.count));
      archetypeValueAccum[archResult.archetypeId] += avoided.central;
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
    totalPeople += cell.totalCount;
  }

  const totalBaselineDeaths = cellImpacts.reduce((s, c) => s + c.baselineAnnualDeaths, 0) * horizonYears;
  const mortalityReductionPct: Range = totalBaselineDeaths > 0
    ? {
        low: (totalAvoidedDeaths.low / totalBaselineDeaths) * 100,
        central: (totalAvoidedDeaths.central / totalBaselineDeaths) * 100,
        high: (totalAvoidedDeaths.high / totalBaselineDeaths) * 100,
      }
    : { low: 0, central: 0, high: 0 };

  const totalCentralValue = Object.values(archetypeValueAccum).reduce((s, v) => s + v, 0);
  const archetypeContribution = ARCHETYPES.map((a) => ({
    id: a.id,
    name: a.name,
    pctOfTotalValue: totalCentralValue > 0 ? (archetypeValueAccum[a.id] / totalCentralValue) * 100 : 0,
  }));

  const totalMorbidityPct: Range = totalPeople > 0
    ? {
        low: (totalMorbidityReduction.low / totalPeople) * 100,
        central: (totalMorbidityReduction.central / totalPeople) * 100,
        high: (totalMorbidityReduction.high / totalPeople) * 100,
      }
    : { low: 0, central: 0, high: 0 };

  return {
    byCellAndArchetype: cellImpacts,
    totals: {
      avoidedDeaths: totalAvoidedDeaths,
      mortalityReductionPct,
      morbidityReductionPct: totalMorbidityPct,
      archetypeContribution,
    },
    signalPathways: [{
      signal: evidence.metric,
      label: `${evidence.label} → Health Impact`,
      source: evidence.doseResponseSource,
      cohortCovered: totalPeople,
      pctOfCohort: 100,
      avoidedDeaths: totalAvoidedDeaths,
      morbidityReduction: totalMorbidityReduction,
      pctOfTotalValue: 100,
    }],
    sources: [
      evidence.doseResponseSource,
      ...evidence.interventionSources,
    ],
    explanation: `${evidence.label}: projected ${totalAvoidedDeaths.low.toFixed(1)}–${totalAvoidedDeaths.central.toFixed(1)}–${totalAvoidedDeaths.high.toFixed(1)} avoided deaths over ${horizonYears} year${horizonYears > 1 ? 's' : ''}. ` +
      `${(centralImprovedShare * 100).toFixed(0)}% of participants show improvement, ${(centralSustainedRate * 100).toFixed(0)}% sustain.`,
  };
}
