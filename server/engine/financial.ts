import type { IncentiveDesign, ResolvedPlan } from "@shared/schema";
import { ECONOMIC_ASSUMPTIONS } from "./assumptions";
import { evaluateClaimsBridge, targetedTierFraction, type ClaimsBridgeEvaluation } from "./claimsBridge";
import { evaluateGroupProductivity, type GroupProductivityEvaluation } from "./groupProductivity";
import { evaluateMortalityMargin, type MortalityMarginEvaluation } from "./mortalityMargin";
import { presentValueRecurringAnnual } from "./discounting";
import { rewardLifts } from "./rewardResponse";
import type { ClaimsCostBasis } from "./assumptionSets";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const FINANCIAL_MODULE = {
  moduleName: "default-financial-chain",
  moduleVersion: "0.2.0",
};

export interface ChainParams {
  enrollment: number;
  persistence: number;
  stepLift: number;
  effortIntensity: number;
  lapseReduction: number;
  ltv: number;
  claimsAnnualDeltaOverride?: number;
  rng?: () => number;
}

export interface ChainEvaluation {
  value: number;
  claims: number;
  productivity: number;
  retention: number;
  mortality: number;
  rewardToSustain: number;
  adminCost: number;
  platformCost: number;
  totalCost: number;
  netValue: number;
  roi: number;
  engagedMembers: number;
  effectiveTreated: number;
  persistMembers: number;
  claimsBridge: ClaimsBridgeEvaluation;
  groupProductivity: GroupProductivityEvaluation;
  mortalityMargin: MortalityMarginEvaluation;
  targetedFraction: number;
  rewardCostRatio: number;
  costBasis: {
    reward: string;
    admin: string;
    platform: string;
    rewardMembers: number;
    adminMembers: number;
    platformMembers: number;
    months: number;
  };
}

function basisMembers(
  basis: ClaimsCostBasis,
  bookMembers: number,
  enrolledMembers: number,
  engagedMembers: number,
  rewardedMembers: number
): number {
  if (basis === "book") return bookMembers;
  if (basis === "enrolled") return enrolledMembers;
  if (basis === "rewarded") return rewardedMembers;
  return engagedMembers;
}

export function evalChain(
  plan: ResolvedPlan,
  cp: ChainParams,
  reward: number,
  engagedFrac: number,
  incentive?: IncentiveDesign
): ChainEvaluation {
  // Targeting high-risk members shrinks the offered population to the
  // non-low risk tiers; costs and value both scale to that pool.
  const targeted = !!plan.targetHighRisk;
  const targetedFraction = targeted ? targetedTierFraction() : 1;
  const N = plan.bookSize * targetedFraction;
  const months = plan.horizonMonths;
  const years = months / 12;
  const engagedMembers = N * engagedFrac;
  const enrolledMembers = N * cp.enrollment;
  const lift = rewardLifts(reward, plan.assumedOfferPmpm);
  const persistFrac = clamp(cp.persistence * lift.persistence, 0.05, 0.97);
  const persistMembers = engagedMembers * persistFrac;
  const partialMembers = Math.max(0, engagedMembers - persistMembers);
  const effectiveTreated = persistMembers + partialMembers * ECONOMIC_ASSUMPTIONS.faderPartCreditPct;
  const rewardedMembers = persistMembers + partialMembers * ECONOMIC_ASSUMPTIONS.rewardFaderCostCreditPct;

  const persistShare = effectiveTreated > 0 ? persistMembers / effectiveTreated : 0;
  const claimsBridge = evaluateClaimsBridge(
    plan,
    effectiveTreated * lift.cohortRisk,
    cp.effortIntensity * lift.dose,
    cp.stepLift,
    cp.rng,
    cp.claimsAnnualDeltaOverride,
    undefined,
    persistShare
  );
  const claims = claimsBridge.claims;
  const groupProductivity = evaluateGroupProductivity(effectiveTreated, months);
  const productivity = groupProductivity.value;
  // LTV is documented as an already-discounted lifetime value. Lapse impact is
  // capped by the selected horizon through the persistence member count.
  const retention = persistMembers * cp.lapseReduction * cp.ltv;
  // Life-book mortality margin: avoided death-claim payouts from the achieved
  // step lift, attribution-haircut like the claims bridge.
  const mortalityMargin = evaluateMortalityMargin(
    effectiveTreated * lift.cohortRisk,
    cp.stepLift,
    claimsBridge.doseAchievement,
    months,
    targeted
  );
  const mortality = mortalityMargin.value;
  const value = claims + productivity + retention + mortality;

  const costReward = incentive?.configured ? incentive.rewardPmpm : reward;
  const adminPmpm = incentive?.configured ? incentive.adminCostPmpm : ECONOMIC_ASSUMPTIONS.adminCostPmpm;
  const platformPmpm = incentive?.configured ? incentive.platformCostPmpm : ECONOMIC_ASSUMPTIONS.platformCostPmpm;
  const rewardMembers = basisMembers(ECONOMIC_ASSUMPTIONS.costBasis.reward, N, enrolledMembers, engagedMembers, rewardedMembers);
  const adminMembers = basisMembers(ECONOMIC_ASSUMPTIONS.costBasis.admin, N, enrolledMembers, engagedMembers, rewardedMembers);
  const platformMembers = basisMembers(ECONOMIC_ASSUMPTIONS.costBasis.platform, N, enrolledMembers, engagedMembers, rewardedMembers);
  const discountRatePct = ECONOMIC_ASSUMPTIONS.discounting.discountRatePct;
  // Insurer funds only the expected-redemption share of points/voucher face
  // value (breakage, IFRS 15) — rewardCostRatio = 1.0 for pure-cash rewards.
  const rewardCostRatio = clamp(ECONOMIC_ASSUMPTIONS.rewardCostRatio, 0.1, 1);
  const rewardToSustain =
    presentValueRecurringAnnual(rewardMembers * costReward * 12, years, discountRatePct) * rewardCostRatio;
  const adminCost = presentValueRecurringAnnual(adminMembers * adminPmpm * 12, years, discountRatePct);
  const platformCost = presentValueRecurringAnnual(platformMembers * platformPmpm * 12, years, discountRatePct);
  const totalCost = rewardToSustain + adminCost + platformCost;
  const netValue = value - totalCost;
  const roi = totalCost > 0 ? netValue / totalCost : 0;

  return {
    value,
    claims,
    productivity,
    retention,
    mortality,
    rewardToSustain,
    adminCost,
    platformCost,
    totalCost,
    netValue,
    roi,
    engagedMembers,
    effectiveTreated,
    persistMembers,
    claimsBridge,
    groupProductivity,
    mortalityMargin,
    targetedFraction,
    rewardCostRatio,
    costBasis: {
      reward: ECONOMIC_ASSUMPTIONS.costBasis.reward,
      admin: ECONOMIC_ASSUMPTIONS.costBasis.admin,
      platform: ECONOMIC_ASSUMPTIONS.costBasis.platform,
      rewardMembers,
      adminMembers,
      platformMembers,
      months,
    },
  };
}
