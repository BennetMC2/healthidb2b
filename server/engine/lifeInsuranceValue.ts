import type {
  CohortRewardAllocationResult,
  LifeInsuranceValueResult,
  ResolvedPlan,
  VerificationGrade,
  WearableSignalTier,
} from "@shared/schema";
import { LIFE_ASSUMPTIONS } from "./assumptions";

export const LIFE_INSURANCE_VALUE_MODULE = {
  moduleName: "default-life-insurance-value",
  moduleVersion: "0.1.0",
};

const verificationMultiplier: Record<VerificationGrade, number> = {
  self_reported: 0.25,
  device_reported: 0.5,
  source_attested: 0.72,
  multi_signal_checked: 0.86,
  zero_custody_verified: 1,
};

const evidenceRank = ["E", "D", "C", "B", "A"] as const;

export function buildDefaultSignalTiers(
  plan: ResolvedPlan,
  allocation?: CohortRewardAllocationResult
): WearableSignalTier[] {
  const allocatedShare = allocation
    ? allocation.allocations.length / Math.max(1, allocation.allocations.length + allocation.unallocatedCohorts.length)
    : 0.45;
  const highVerified = Math.round(plan.bookSize * Math.min(0.18, allocatedShare * 0.2));
  const moderateVerified = Math.round(plan.bookSize * Math.min(0.32, allocatedShare * 0.42));
  const lowOrUnverified = Math.max(0, plan.bookSize - highVerified - moderateVerified);
  return [
    {
      signal: "steps_activity",
      tier: "high activity / verified",
      memberCount: highVerified,
      mortalityRelativity: 0.78,
      verificationGrade: "source_attested",
      evidenceGrade: "C",
    },
    {
      signal: "steps_activity",
      tier: "modifiable middle / device reported",
      memberCount: moderateVerified,
      mortalityRelativity: 0.93,
      verificationGrade: "device_reported",
      evidenceGrade: "C",
    },
    {
      signal: "unknown_or_unverified",
      tier: "unverified baseline",
      memberCount: lowOrUnverified,
      mortalityRelativity: 1.04,
      verificationGrade: "self_reported",
      evidenceGrade: "E",
    },
  ];
}

export function estimateLifeInsuranceValue({
  plan,
  allocation,
  signalTiers = buildDefaultSignalTiers(plan, allocation),
  sumAssured = LIFE_ASSUMPTIONS.sumAssured,
  annualPremium = LIFE_ASSUMPTIONS.annualPremium,
  baselineAnnualMortalityRate = LIFE_ASSUMPTIONS.baselineAnnualMortalityRate,
  morbidityValuePctOfMortality = LIFE_ASSUMPTIONS.morbidityValuePctOfMortality,
  acquisitionValuePerNewVerifiedMember = LIFE_ASSUMPTIONS.acquisitionValuePerNewVerifiedMember,
  maxLapseImprovement = LIFE_ASSUMPTIONS.maxLapseImprovement,
  baseLapseImprovement = LIFE_ASSUMPTIONS.baseLapseImprovement,
  lapseImprovementPerPersistenceLift = LIFE_ASSUMPTIONS.lapseImprovementPerPersistenceLift,
  horizonYears = Math.max(1, Math.round(plan.horizonMonths / 12)),
}: {
  plan: ResolvedPlan;
  allocation?: CohortRewardAllocationResult;
  signalTiers?: WearableSignalTier[];
  sumAssured?: number;
  annualPremium?: number;
  baselineAnnualMortalityRate?: number;
  morbidityValuePctOfMortality?: number;
  acquisitionValuePerNewVerifiedMember?: number;
  maxLapseImprovement?: number;
  baseLapseImprovement?: number;
  lapseImprovementPerPersistenceLift?: number;
  horizonYears?: number;
}): LifeInsuranceValueResult {
  const allocatedCost = allocation?.totalExpectedCost ?? 0;
  const verifiedWeightedLives = signalTiers.reduce(
    (sum, tier) => sum + tier.memberCount * verificationMultiplier[tier.verificationGrade],
    0
  );
  const verificationCoverage = verifiedWeightedLives / Math.max(1, plan.bookSize);
  const mortalityRelativity = signalTiers.reduce(
    (sum, tier) => sum + tier.memberCount * tier.mortalityRelativity * verificationMultiplier[tier.verificationGrade],
    0
  ) / Math.max(1, verifiedWeightedLives || plan.bookSize);

  const segmentationLift = Math.max(0, 1 - mortalityRelativity) * verificationCoverage;
  const expectedClaimsReduction = plan.bookSize * baselineAnnualMortalityRate * sumAssured * segmentationLift * horizonYears;

  const allocationIntensity = allocation
    ? allocation.allocations.reduce((sum, a) => sum + a.expectedPersistenceLift, 0) / Math.max(1, allocation.allocations.length)
    : 0.04;
  const lapseImprovement = Math.min(
    maxLapseImprovement,
    baseLapseImprovement + allocationIntensity * lapseImprovementPerPersistenceLift
  );
  const lapsePersistencyValue = plan.bookSize * annualPremium * lapseImprovement * horizonYears;

  const morbidityProxyValue = expectedClaimsReduction * morbidityValuePctOfMortality;
  const allocatedMembers = allocation
    ? allocation.allocations.reduce((sum, a) => {
        const tier = signalTiers.find((t) => a.cohortId.includes(t.signal));
        return sum + (tier?.memberCount ?? 0);
      }, 0)
    : 0;
  const acquisitionValue =
    Math.max(allocatedMembers, Math.round(plan.bookSize * verificationCoverage * 0.08)) *
    acquisitionValuePerNewVerifiedMember;
  const grossValue = expectedClaimsReduction + lapsePersistencyValue + morbidityProxyValue + acquisitionValue;
  const netValue = grossValue - allocatedCost;
  const evidenceGrade = lowestEvidence(signalTiers);
  const caveats = [
    "Prototype life-insurance value model: uses illustrative mortality, sum assured, premium and lapse assumptions.",
    "Mortality prediction and mortality improvement are separated conceptually, but this first model still requires actuary-owned calibration.",
    "Practitioner evidence from reinsurers and wellness programmes must be tagged separately from peer-reviewed causal evidence.",
  ];
  if (verificationCoverage < 0.35) caveats.push("Verification coverage is low; underwriting value should be discounted.");

  return {
    mortalitySegmentationValue: expectedClaimsReduction,
    expectedClaimsReduction,
    acquisitionValue,
    morbidityValue: morbidityProxyValue,
    lapsePersistencyValue,
    rewardCost: allocatedCost,
    netValue,
    grossValue,
    evidenceGrade,
    caveats,
  };
}

function lowestEvidence(signalTiers: WearableSignalTier[]): "A" | "B" | "C" | "D" | "E" {
  let min = evidenceRank.length - 1;
  for (const tier of signalTiers) {
    const idx = evidenceRank.indexOf(tier.evidenceGrade);
    if (idx >= 0) min = Math.min(min, idx);
  }
  return evidenceRank[min];
}
