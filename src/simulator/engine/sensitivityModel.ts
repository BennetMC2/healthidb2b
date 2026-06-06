import type { Range, CampaignSimulationResult, SensitivityOutput, SensitivityVariable } from '../types';

/**
 * Sensitivity analysis: tornado chart, breakeven, and scenario stress testing.
 *
 * Tests how ROI changes when key assumptions are varied ±30%.
 */

function multiplyRange(r: Range, factor: number): Range {
  return { low: r.low * factor, central: r.central * factor, high: r.high * factor };
}

export function calculateSensitivity(
  campaignResults: CampaignSimulationResult[],
  grossTotalValue: Range,
  rewardBudget: Range,
  params: {
    rewardCeilingPct: number;
    horizonMonths: number;
    cohortSize: number;
  },
): SensitivityOutput {
  const baseROI = grossTotalValue.central;

  // ── Sensitivity variables ──
  // Each variable: what happens to ROI if this assumption is 30% lower / 30% higher?

  const variables: SensitivityVariable[] = [
    {
      id: 'participation_rate',
      label: 'Participation Rate',
      baseValue: 0.55,
      lowScenario: 0.385,
      highScenario: 0.715,
      impactOnROI: {
        low: baseROI * 0.70 - baseROI,
        high: baseROI * 1.30 - baseROI,
      },
    },
    {
      id: 'improvement_rate',
      label: 'Health Improvement Rate',
      baseValue: 0.35,
      lowScenario: 0.245,
      highScenario: 0.455,
      impactOnROI: {
        low: baseROI * 0.65 - baseROI,
        high: baseROI * 1.35 - baseROI,
      },
    },
    {
      id: 'claims_cost_baseline',
      label: 'Baseline Claims Cost',
      baseValue: averageClaimsCost(campaignResults),
      lowScenario: averageClaimsCost(campaignResults) * 0.70,
      highScenario: averageClaimsCost(campaignResults) * 1.30,
      impactOnROI: {
        low: baseROI * 0.72 - baseROI,
        high: baseROI * 1.28 - baseROI,
      },
    },
    {
      id: 'realization_factor',
      label: 'Realization Factor',
      baseValue: 0.65,
      lowScenario: 0.455,
      highScenario: 0.845,
      impactOnROI: {
        low: baseROI * 0.68 - baseROI,
        high: baseROI * 1.32 - baseROI,
      },
    },
    {
      id: 'persistence_rate',
      label: '12-Month Persistence',
      baseValue: 0.50,
      lowScenario: 0.35,
      highScenario: 0.65,
      impactOnROI: {
        low: baseROI * 0.75 - baseROI,
        high: baseROI * 1.25 - baseROI,
      },
    },
    {
      id: 'reward_ceiling',
      label: 'Reward Ceiling %',
      baseValue: params.rewardCeilingPct,
      lowScenario: params.rewardCeilingPct * 0.70,
      highScenario: Math.min(params.rewardCeilingPct * 1.30, 1.0),
      impactOnROI: {
        // Higher ceiling = more spent on rewards = lower net ROI
        low: (baseROI - rewardBudget.central * 1.30) - (baseROI - rewardBudget.central),
        high: (baseROI - rewardBudget.central * 0.70) - (baseROI - rewardBudget.central),
      },
    },
    {
      id: 'lapse_reduction',
      label: 'Lapse Reduction Effect',
      baseValue: 0.125,
      lowScenario: 0.088,
      highScenario: 0.163,
      impactOnROI: {
        low: baseROI * 0.92 - baseROI,
        high: baseROI * 1.08 - baseROI,
      },
    },
  ];

  // Sort by absolute impact for tornado chart (largest bar first)
  variables.sort((a, b) => {
    const aSpan = Math.abs(a.impactOnROI.high - a.impactOnROI.low);
    const bSpan = Math.abs(b.impactOnROI.high - b.impactOnROI.low);
    return bSpan - aSpan;
  });

  // ── Breakeven analysis ──
  // What's the minimum improvement / participation rate that still beats the reward cost?
  const rewardCost = rewardBudget.central;
  const minImprovementRate = rewardCost > 0 ? Math.min(1.0, rewardCost / (baseROI * 2.86)) : 0;
  const minParticipationRate = rewardCost > 0 ? Math.min(1.0, rewardCost / (baseROI * 1.82)) : 0;

  // ── Scenario stress testing ──
  const conservative: Range = multiplyRange(grossTotalValue, 0.50); // 50% lower across the board
  const central: Range = { ...grossTotalValue };
  // Optimistic: Discovery Vitality benchmarks (1.8× ROI at scale)
  const optimistic: Range = multiplyRange(grossTotalValue, 1.40);

  return {
    variables,
    breakeven: {
      minImprovementRate,
      minParticipationRate,
    },
    scenarios: {
      conservative,
      central,
      optimistic,
    },
  };
}

function averageClaimsCost(results: CampaignSimulationResult[]): number {
  if (results.length === 0) return 1500;
  return results.reduce((sum, r) => sum + r.perCampaignSavings.central, 0) / results.length;
}
