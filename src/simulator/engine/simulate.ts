import type { Scenario, SimulationOutput, HorizonOutput } from '../types';
import type { HealthMetric } from '@/types';
import { TIME_HORIZON_MONTHS } from '../constants';
import { filterCohort } from './cohortEngine';
import { computeConfidence } from './confidenceModel';
import { calculateHorizonROI, calculateLeverBreakdowns, buildHealthToValueBridge } from './roiCalculator';
import { generateAuditTrail } from './auditLog';
import { INTERVENTIONS } from '../data/interventions';

/**
 * Main simulation entry point.
 * Combines all 6 layers → multi-horizon ROI output with full audit lineage.
 */
export function runSimulation(scenario: Scenario): SimulationOutput {
  // L3: Cohort filtering
  const cohortResult = filterCohort(scenario.cohortDefinition);
  const cohortSize = cohortResult.size > 0 ? cohortResult.size : 3000; // Fallback for demo

  // Gather all signals from active interventions
  const activeInterventions = INTERVENTIONS.filter((i) =>
    scenario.interventions.includes(i.id),
  );
  const allSignals: HealthMetric[] = [...new Set(
    activeInterventions.flatMap((i) => i.primarySignals),
  )];

  // Available sources from cohort
  const availableSources = Object.entries(cohortResult.signalAvailability)
    .filter(([, rate]) => rate > 0.1)
    .map(([source]) => source);

  // Build ROI input
  const roiInput = {
    cohortSize,
    interventionIds: scenario.interventions,
    rewardConfig: scenario.rewardConfig,
    rewardCeilingPct: scenario.rewardCeilingPct,
    assumptions: scenario.assumptions,
    leverBaselines: scenario.leverBaselines,
    leverTargets: scenario.leverTargets,
    availableSignals: allSignals,
    availableSources,
  };

  // L6: Calculate multi-horizon ROI
  const horizons: Record<'90d' | '1y' | '3y', HorizonOutput> = {
    '90d': calculateHorizonROI(roiInput, TIME_HORIZON_MONTHS['90d']),
    '1y': calculateHorizonROI(roiInput, TIME_HORIZON_MONTHS['1y']),
    '3y': calculateHorizonROI(roiInput, TIME_HORIZON_MONTHS['3y']),
  };

  // Lever breakdowns (using 1-year horizon as primary)
  const leverBreakdowns = calculateLeverBreakdowns(
    scenario.interventions,
    scenario.leverBaselines,
    scenario.leverTargets,
    horizons['1y'].projectedClaimsImpact,
    scenario.assumptions.realizationFactor,
  );

  // Health-to-value bridge (using 1-year horizon)
  const healthToValueBridge = buildHealthToValueBridge(
    horizons['1y'],
    leverBreakdowns,
    scenario.interventions,
  );

  // Confidence
  const confidence = computeConfidence(
    allSignals,
    availableSources as never[],
    scenario.interventions,
    scenario.assumptions.realizationFactor,
  );

  // Audit trail
  const auditTrail = generateAuditTrail({
    scenarioId: scenario.id,
    signals: allSignals,
    interventionIds: scenario.interventions,
    assumptions: scenario.assumptions,
    cohortSize,
    leverBaselines: scenario.leverBaselines,
    leverTargets: scenario.leverTargets,
  });

  // Plain-English summary
  const primaryIntervention = activeInterventions[0];
  const h1y = horizons['1y'];
  const plainEnglishSummary = generatePlainEnglishSummary(
    scenario.name,
    cohortSize,
    primaryIntervention?.name ?? 'intervention',
    h1y.netROI,
    h1y.grossTotalValue,
    h1y.recommendedRewardBudget,
    h1y.morbidityShiftBps,
    h1y.paybackMonths,
    confidence.label,
    scenario.rewardCeilingPct,
  );

  // Caveats
  const caveats = generateCaveats(confidence.label, scenario);

  return {
    scenarioId: scenario.id,
    horizons,
    leverBreakdowns,
    healthToValueBridge,
    auditTrail,
    confidenceLabel: confidence.label,
    plainEnglishSummary,
    caveats,
  };
}

function generatePlainEnglishSummary(
  scenarioName: string,
  cohortSize: number,
  interventionName: string,
  netROI: number,
  grossTotalValue: number,
  recommendedRewardBudget: number,
  morbidityBps: number,
  paybackMonths: number,
  confidenceLabel: string,
  rewardCeilingPct: number,
): string {
  const ceilingStr = `${Math.round(rewardCeilingPct * 100)}%`;

  return `The "${scenarioName}" scenario models a ${interventionName.toLowerCase()} programme ` +
    `for a cohort of ${cohortSize.toLocaleString()} members. ` +
    `The model projects $${grossTotalValue.toLocaleString()} in gross value from behaviour change. ` +
    `With a reward ceiling of ${ceilingStr}, the recommended incentive budget is $${recommendedRewardBudget.toLocaleString()}, ` +
    `yielding $${netROI.toLocaleString()} net ROI. ` +
    `Morbidity shift: ${morbidityBps} bps. Payback: ${paybackMonths} months. ` +
    `This projection carries ${confidenceLabel} and should be validated against carrier-specific claims data.`;
}

function generateCaveats(
  confidenceLabel: string,
  scenario: Scenario,
): string[] {
  const caveats: string[] = [
    'All projections are directional estimates based on published literature and should be validated against carrier-specific claims data before commercial decisions.',
    'Effect sizes from clinical literature may not directly translate to insurance programme settings due to differences in population, adherence, and measurement methodology.',
    'Behavioural economics modifiers (loss aversion, streaks) are calibrated from RCT evidence but real-world programme effects may differ.',
  ];

  if (confidenceLabel === 'exploratory') {
    caveats.push('This scenario has exploratory confidence — wider uncertainty bands apply. Consider running with higher-evidence interventions or richer data sources.');
  }

  if (scenario.assumptions.realizationFactor < 0.5) {
    caveats.push('A conservative realization factor below 50% has been applied, significantly discounting the projected impact.');
  }

  if (scenario.interventions.length > 1) {
    caveats.push('Multi-intervention scenarios include an overlap discount to account for correlation between health signals. Actual interaction effects are uncertain.');
  }

  return caveats;
}
