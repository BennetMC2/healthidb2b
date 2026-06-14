import type { MonteCarloResult, ResolvedPlan, RewardRoiPoint } from "@shared/schema";
import { interpolateRewardPoint } from "./rewards";

// THE single canonical result object for the results page. Every tier reads
// from this selector — no component computes its own version of a headline
// metric. Point estimates come from the deterministic scenario spine (or the
// reward curve when the lever is dragged off the run reward); bands come from
// the Monte Carlo simulation.
export interface DisplayResult {
  // reward lever (canonical unit: USD PMPM)
  rewardPmpm: number;
  // true when the lever sits on the reward the run was actually computed at —
  // spine values and full MC bands apply; otherwise values are read off the
  // simulated reward-response surface.
  atRunReward: boolean;
  economicsConfigured: boolean;

  // behaviour
  behaviorFrac: number; // fraction of book expected to meaningfully improve
  behaviorBandFrac: [number, number] | null; // P5–P95, only at the run reward
  membersImproved: number;

  // economics (USD, present-valued over the horizon)
  grossUsd: number;
  claimsUsd: number;
  productivityUsd: number;
  retentionUsd: number;
  mortalityUsd: number;
  rewardCostUsd: number;
  adminCostUsd: number;
  platformCostUsd: number;
  totalCostUsd: number;
  netUsd: number;
  netBandUsd: [number, number] | null;

  // ROI as a ratio (0.8 = +80%)
  roi: number | null;
  roiBand: [number, number] | null;
  downsideFrac: number | null; // P(net < 0), only at the run reward

  // the curve point backing this readout (for charts/markers)
  point: RewardRoiPoint;
}

export function buildDisplayResult(
  finance: MonteCarloResult,
  plan: ResolvedPlan | null,
  selectedReward: number | null
): DisplayResult {
  const runReward = plan?.incentiveDesign?.configured
    ? plan.incentiveDesign.rewardPmpm
    : plan?.assumedOfferPmpm ?? finance.rewardOptimization.optimalReward;
  const rewardPmpm = selectedReward ?? runReward;
  const atRunReward = Math.abs(rewardPmpm - runReward) < 0.01;
  const economicsConfigured = !!finance.economicsConfigured;

  const point = interpolateRewardPoint(finance.rewardOptimization.roiCurve, rewardPmpm);

  // At the run reward, the deterministic spine is the source of truth (the
  // curve passes through the same point by construction, but the spine is
  // exact). Off the run reward, the curve point is the only honest estimate.
  const spine = atRunReward;

  const grossUsd = spine ? finance.valueCreatedP50 : point.valueCreated;
  const claimsUsd = spine ? finance.claimsSavingsP50 : point.claimsSaved;
  const productivityUsd = spine ? finance.claimsBreakdown.productivityValue ?? 0 : point.productivityValue;
  const retentionUsd = spine ? finance.retentionValueP50 : point.retentionValue;
  const mortalityUsd = spine ? finance.mortalityValueP50 ?? 0 : point.mortalityValue ?? 0;
  const rewardCostUsd = spine ? finance.rewardToSustainP50 : point.rewardToSustain;
  const adminCostUsd = spine ? finance.adminCostP50 : point.adminCost;
  const platformCostUsd = spine ? finance.platformCostP50 : point.platformCost;
  const totalCostUsd = spine ? finance.totalCostP50 : point.totalCost;
  const netUsd = spine ? finance.netValueP50 : point.netValue;

  return {
    rewardPmpm,
    atRunReward,
    economicsConfigured,
    // behaviour reads off the response curve at every reward — the curve is
    // anchored through the calibrated rate at the run reward, so Tier 1, the
    // slider and the chart can never disagree.
    behaviorFrac: point.behaviorChange,
    behaviorBandFrac: spine ? [finance.behaviorChange.p5, finance.behaviorChange.p95] : null,
    membersImproved: point.members,
    grossUsd,
    claimsUsd,
    productivityUsd,
    retentionUsd,
    mortalityUsd,
    rewardCostUsd,
    adminCostUsd,
    platformCostUsd,
    totalCostUsd,
    netUsd,
    netBandUsd: economicsConfigured
      ? spine
        ? [finance.netValue.p5, finance.netValue.p95]
        : [point.netValueP5, point.netValueP95]
      : null,
    roi: economicsConfigured && totalCostUsd > 0 ? (spine ? finance.roiP50 : point.roi) : null,
    roiBand: economicsConfigured
      ? spine
        ? [finance.roiP5 ?? 0, finance.roiP95 ?? 0]
        : [point.roiP5, point.roiP95]
      : null,
    downsideFrac: economicsConfigured && spine ? finance.downsideProbability : null,
    point,
  };
}
