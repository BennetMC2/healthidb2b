import type { Range, CampaignSimulationResult, MultiCampaignOutput } from '../types';
import { calculateSensitivity } from './sensitivityModel';

/**
 * Multi-campaign combination with overlap discount.
 *
 * From actuarial.ts line 418:
 * 1 metric = 1.0×, 2 = 0.84×, 3 = 0.68× (floor 0.58×)
 *
 * Prevents double-counting when multiple campaigns target
 * overlapping health pathways.
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
 * Calculate overlap discount for multiple campaigns.
 * From actuarial.ts: 1=1.0, 2=0.84, 3=0.68, floor=0.58
 */
export function getOverlapDiscount(campaignCount: number): number {
  if (campaignCount <= 1) return 1.0;
  return Math.max(0.58, 1 - (campaignCount - 1) * 0.16);
}

/**
 * Combine multiple campaign results into a single output.
 */
export function combineCampaigns(
  campaignResults: CampaignSimulationResult[],
  params: {
    rewardCeilingPct: number;
    horizonMonths: number;
    cohortSize: number;
  },
): MultiCampaignOutput {
  const overlapDiscount = getOverlapDiscount(campaignResults.length);

  // Sum per-campaign savings
  const rawGrossClaimsSavings = campaignResults.reduce(
    (acc, cr) => addRanges(acc, addRanges(cr.perCampaignSavings, cr.perCampaignMorbiditySavings)),
    { low: 0, central: 0, high: 0 },
  );

  // Apply overlap discount
  const grossClaimsSavings = multiplyRange(rawGrossClaimsSavings, overlapDiscount);

  // Lapse + cross-sell (from financial model, but estimate here for combined view)
  const engagedFraction = 0.55; // ~55% of cohort engaged across campaigns
  const lapseValue = params.cohortSize * engagedFraction * 0.06 * 0.125 * 3800 * (params.horizonMonths / 12);
  const crossSellValue = params.cohortSize * engagedFraction * 0.075 * 3800 * 0.2 * (params.horizonMonths / 12);
  const ancillaryValue: Range = {
    low: (lapseValue + crossSellValue) * 0.7,
    central: lapseValue + crossSellValue,
    high: (lapseValue + crossSellValue) * 1.3,
  };

  const grossTotalValue = addRanges(grossClaimsSavings, ancillaryValue);

  const affordableRewardBudget = multiplyRange(grossTotalValue, params.rewardCeilingPct);

  // Per member per month
  const participantMonths = params.cohortSize * engagedFraction * params.horizonMonths;
  const rewardPerMemberPerMonth: Range = participantMonths > 0
    ? {
        low: affordableRewardBudget.low / participantMonths,
        central: affordableRewardBudget.central / participantMonths,
        high: affordableRewardBudget.high / participantMonths,
      }
    : { low: 0, central: 0, high: 0 };

  const netROI: Range = {
    low: grossTotalValue.low - affordableRewardBudget.high,
    central: grossTotalValue.central - affordableRewardBudget.central,
    high: grossTotalValue.high - affordableRewardBudget.low,
  };

  const roiMultiple: Range = {
    low: affordableRewardBudget.high > 0 ? grossTotalValue.low / affordableRewardBudget.high : 0,
    central: affordableRewardBudget.central > 0 ? grossTotalValue.central / affordableRewardBudget.central : 0,
    high: affordableRewardBudget.low > 0 ? grossTotalValue.high / affordableRewardBudget.low : 0,
  };

  const monthlySavings = grossTotalValue.central / params.horizonMonths;
  const monthlyReward = affordableRewardBudget.central / params.horizonMonths;
  const paybackCentral = monthlyReward > 0 && monthlySavings > monthlyReward
    ? Math.ceil(monthlyReward / (monthlySavings - monthlyReward) * params.horizonMonths / (monthlySavings / monthlyReward))
    : params.horizonMonths;

  const paybackMonths: Range = {
    low: Math.max(1, Math.round(paybackCentral * 0.7)),
    central: Math.min(paybackCentral, params.horizonMonths),
    high: Math.min(Math.round(paybackCentral * 1.4), params.horizonMonths),
  };

  // Calculate sensitivity analysis
  const sensitivity = calculateSensitivity(campaignResults, grossTotalValue, affordableRewardBudget, params);

  return {
    campaigns: campaignResults,
    combined: {
      overlapDiscount,
      grossClaimsSavings,
      grossTotalValue,
      affordableRewardBudget,
      rewardPerMemberPerMonth,
      netROI,
      roiMultiple,
      paybackMonths,
    },
    sensitivity,
  };
}
