import type { BehaviorRates, ClaimsBreakdown, DoseResponseParam, IncentiveDesign, ResolvedPlan } from "@shared/schema";
import { ECONOMIC_ASSUMPTIONS } from "./assumptions";
import { doseSaturation } from "./doseResponse";
import { presentValueFactor } from "./discounting";
import { evidenceGateMultiplier, getSignal, TRUST_VALUE_MODIFIER } from "./registry";
import { signalToClaimsBridgeKey } from "./signalCompatibility";
import type { ChainEvaluation } from "./financial";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function gaussian(rng: () => number, mean: number, sd: number) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
}

function sdFromCI(ci: [number, number]) {
  return Math.max(1e-4, (ci[1] - ci[0]) / (2 * 1.96));
}

export const CLAIMS_BRIDGE_MODULE = {
  moduleName: "default-claims-bridge",
  moduleVersion: "0.2.0",
};

export interface ClaimsBridgeEvaluation {
  claims: number;
  annualClaimsDeltaPerTreated: number;
  applicablePrevalence: number;
  attributionFactor: number;
  doseAchievement: number;
  evidenceHorizonYears: number;
  valuationHorizonYears: number;
  discountRatePct: number;
  presentValueFactor: number;
  // share of effectively treated members who persist (their savings are
  // valued over persistedSavingsYears; faders keep the base evidence window)
  persistShare: number;
  persistedSavingsYears: number;
  targeted: boolean;
  baselineClaimsPerMember: number;
  source: string;
  tierBreakdown: {
    tier: string;
    weight: number;
    annualClaims: number;
    annualDelta: number;
    savings: number;
  }[];
}

export const CLAIMS_BRIDGE_DOSE_RESPONSE_PARAMS: DoseResponseParam[] = Object.entries(
  ECONOMIC_ASSUMPTIONS.claimsBridge
).map(([campaign, assumption]) => ({
  campaign: campaign as DoseResponseParam["campaign"],
  label: `${campaign.replace(/_/g, " ")} → claims-cost bridge`,
  effectP50: assumption.annualClaimsDeltaUSD,
  effectCI: assumption.annualClaimsDeltaCI,
  effectUnit: "USD/applicable-treated-member/year",
  source: assumption.source,
}));

export function weightedClaimsBaseline(): number {
  const tiers = ECONOMIC_ASSUMPTIONS.claimsBaselineByTier;
  const totalWeight = tiers.reduce((s, t) => s + t.weight, 0) || 1;
  return tiers.reduce((s, t) => s + (t.weight / totalWeight) * t.annualClaims, 0);
}

// Share of the book sitting in the non-low (targetable) risk tiers — the
// population a "target high-risk members" campaign is actually offered to.
export function targetedTierFraction(): number {
  const tiers = ECONOMIC_ASSUMPTIONS.claimsBaselineByTier;
  const total = tiers.reduce((s, t) => s + t.weight, 0) || 1;
  const targetable = tiers.filter((t) => t.tier !== "low").reduce((s, t) => s + t.weight, 0);
  return clamp(targetable / total, 0.01, 1);
}

export function evaluateClaimsBridge(
  plan: ResolvedPlan,
  effectiveTreated: number,
  effortIntensity: number,
  stepLift: number,
  rng?: () => number,
  annualDeltaOverride?: number,
  attributionOverride?: number,
  persistShare = 0
): ClaimsBridgeEvaluation {
  const primary = getSignal(plan.primarySignal ?? plan.campaign);
  const targeted = !!plan.targetHighRisk;
  const assumption = ECONOMIC_ASSUMPTIONS.claimsBridge[signalToClaimsBridgeKey(primary.signalId)];
  const discountRatePct = ECONOMIC_ASSUMPTIONS.discounting.discountRatePct;
  const valuationHorizonYears = Math.max(
    plan.horizonMonths / 12,
    Math.min(ECONOMIC_ASSUMPTIONS.discounting.valuationHorizonYears, assumption.evidenceHorizonYears)
  );
  // Faders are valued over the base evidence window; PERSISTING members carry
  // their savings for persistedSavingsYears (Wagner 2001: years 1–4), still
  // capped by the discounting valuation horizon. Blend by persist share.
  const persistYears = Math.max(
    valuationHorizonYears,
    Math.min(ECONOMIC_ASSUMPTIONS.discounting.valuationHorizonYears, ECONOMIC_ASSUMPTIONS.persistedSavingsYears)
  );
  const share = clamp(persistShare, 0, 1);
  const pvFactor =
    share * presentValueFactor(persistYears, discountRatePct) +
    (1 - share) * presentValueFactor(valuationHorizonYears, discountRatePct);
  const doseAchievement = doseSaturation(signalToClaimsBridgeKey(primary.signalId), effortIntensity, stepLift);
  const delta =
    annualDeltaOverride ??
    (rng
      ? clamp(
          gaussian(rng, assumption.annualClaimsDeltaUSD, sdFromCI(assumption.annualClaimsDeltaCI)),
          Math.max(0, assumption.annualClaimsDeltaCI[0] * 0.5),
          assumption.annualClaimsDeltaCI[1] * 1.3
        )
      : assumption.annualClaimsDeltaUSD);
  const applicablePrevalence = clamp(assumption.applicablePrevalence, 0, 1);
  const fusionBoost = plan.fusionDefinition?.corroboration && (plan.signals?.length ?? 0) >= 2 ? 0.08 : 0;
  const attributionFactor = clamp(attributionOverride ?? Math.max(assumption.attributionFactor, primary.attributionConfidence + fusionBoost), 0, 0.7);
  const valueGate = evidenceGateMultiplier(primary.evidenceTier) * TRUST_VALUE_MODIFIER[primary.trustCeiling];
  // When targeting high-risk members, the campaign is offered only to the
  // non-low tiers, so the treated pool's tier mix renormalizes to that subset.
  const allTiers = ECONOMIC_ASSUMPTIONS.claimsBaselineByTier;
  const tiers = targeted ? allTiers.filter((t) => t.tier !== "low") : allTiers;
  const totalWeight = tiers.reduce((s, t) => s + t.weight, 0) || 1;
  const applicableTreated = Math.max(0, effectiveTreated) * applicablePrevalence;
  const tierBreakdown = tiers.map((tier) => {
    const weight = tier.weight / totalWeight;
    const annualDelta = Math.max(0, delta * tier.deltaMultiplier);
    const savings = applicableTreated * weight * annualDelta * attributionFactor * doseAchievement * pvFactor * valueGate;
    return {
      tier: tier.label,
      weight,
      annualClaims: tier.annualClaims,
      annualDelta,
      savings,
    };
  });
  const claims = tierBreakdown.reduce((s, t) => s + t.savings, 0);
  return {
    claims,
    annualClaimsDeltaPerTreated: delta,
    applicablePrevalence,
    attributionFactor,
    doseAchievement,
    evidenceHorizonYears: assumption.evidenceHorizonYears,
    valuationHorizonYears,
    discountRatePct,
    presentValueFactor: pvFactor,
    persistShare: share,
    persistedSavingsYears: persistYears,
    targeted,
    baselineClaimsPerMember: weightedClaimsBaseline(),
    source: assumption.source,
    tierBreakdown,
  };
}

// Transparent breakdown of how the headline value figure is computed at the
// assumed offer context using median parameters.
export function buildClaimsBreakdown(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  r: ChainEvaluation,
  incentive?: IncentiveDesign
): ClaimsBreakdown {
  const economicsConfigured = !!incentive?.configured;
  return {
    engagedMembers: Math.round(r.engagedMembers),
    effectiveTreated: Math.round(r.effectiveTreated),
    baselineClaimsPerMember: r.claimsBridge.baselineClaimsPerMember,
    doseResponsePct: r.claimsBridge.doseAchievement,
    annualClaimsDeltaPerTreated: r.claimsBridge.annualClaimsDeltaPerTreated,
    applicablePrevalence: r.claimsBridge.applicablePrevalence,
    attributionFactor: r.claimsBridge.attributionFactor,
    doseAchievement: r.claimsBridge.doseAchievement,
    evidenceHorizonYears: r.claimsBridge.evidenceHorizonYears,
    valuationHorizonYears: r.claimsBridge.valuationHorizonYears,
    discountRatePct: r.claimsBridge.discountRatePct,
    presentValueFactor: r.claimsBridge.presentValueFactor,
    faderPartCreditPct: ECONOMIC_ASSUMPTIONS.faderPartCreditPct,
    claimsBridgeSource: r.claimsBridge.source,
    claimsTierBreakdown: r.claimsBridge.tierBreakdown,
    claimsSavings: Math.max(0, r.claims),
    productivityValue: Math.max(0, r.productivity),
    persistingMembers: Math.round(r.persistMembers),
    lapseReductionPct: ECONOMIC_ASSUMPTIONS.lapseReduction,
    ltvPerMember: ECONOMIC_ASSUMPTIONS.ltvPerMember,
    retentionValue: Math.max(0, r.retention),
    mortalityValue: Math.max(0, r.mortality),
    mortalityDetail: {
      baselineAnnualMortalityRate: r.mortalityMargin.baselineAnnualMortalityRate,
      sumAssured: r.mortalityMargin.sumAssured,
      relativeMortalityReduction: r.mortalityMargin.relativeMortalityReduction,
      attributionFactor: r.mortalityMargin.attributionFactor,
      highRiskRelativity: r.mortalityMargin.highRiskRelativity,
      source: r.mortalityMargin.source,
    },
    rewardCostRatio: r.rewardCostRatio,
    persistedSavingsYears: r.claimsBridge.persistedSavingsYears,
    targetHighRisk: r.claimsBridge.targeted,
    targetedFraction: r.targetedFraction,
    totalValue: Math.max(0, r.value),
    rewardCost: economicsConfigured ? Math.max(0, r.rewardToSustain) : 0,
    adminCost: economicsConfigured ? Math.max(0, r.adminCost) : 0,
    platformCost: economicsConfigured ? Math.max(0, r.platformCost) : 0,
    totalCost: economicsConfigured ? Math.max(0, r.totalCost) : 0,
    costBasis: r.costBasis,
    netValue: economicsConfigured ? r.netValue : r.value,
    roi: economicsConfigured ? r.roi : 0,
  };
}
