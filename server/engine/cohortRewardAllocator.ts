import type {
  BehaviorRates,
  CohortPriorityScore,
  CohortRewardAllocationResult,
  PopulationSegmentForAllocation,
  ResolvedPlan,
  RewardOption,
  VerificationGrade,
} from "@shared/schema";
import { activeAssumptionSet } from "./assumptionSets";

export const COHORT_REWARD_ALLOCATOR_MODULE = {
  moduleName: "default-cohort-reward-allocator",
  moduleVersion: "0.1.0",
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const verificationScore: Record<VerificationGrade, number> = activeAssumptionSet().rewardAllocation.verificationScore;

export const DEFAULT_REWARD_CATALOGUE: RewardOption[] = activeAssumptionSet().rewardAllocation.rewardCatalogue;

export function buildDefaultLifeCohorts(plan: ResolvedPlan, behavior: BehaviorRates): PopulationSegmentForAllocation[] {
  const n = plan.bookSize;
  const engaged = clamp01(behavior.behaviorChangeRate);
  return [
    {
      id: "high-risk-low-activity-price-sensitive",
      label: "High-risk, low-activity, price-sensitive",
      memberCount: Math.round(n * 0.18),
      mortalityRiskIndex: 1.55,
      morbidityRiskIndex: 1.45,
      lapseRiskIndex: 1.15,
      modifiabilityIndex: 0.78,
      wearableOwnershipRate: 0.34,
      dataSharingWillingness: 0.48,
      rewardSensitivity: 0.82,
      evidenceScope: "global",
    },
    {
      id: "high-risk-wearable-owner",
      label: "High-risk wearable owner",
      memberCount: Math.round(n * 0.12),
      mortalityRiskIndex: 1.45,
      morbidityRiskIndex: 1.35,
      lapseRiskIndex: 0.95,
      modifiabilityIndex: 0.72,
      wearableOwnershipRate: 0.88,
      dataSharingWillingness: 0.68,
      rewardSensitivity: 0.58,
      evidenceScope: "global",
    },
    {
      id: "older-clinical-follow-up",
      label: "Older high-risk clinical follow-up",
      memberCount: Math.round(n * 0.1),
      mortalityRiskIndex: 1.8,
      morbidityRiskIndex: 1.7,
      lapseRiskIndex: 0.85,
      modifiabilityIndex: 0.58,
      wearableOwnershipRate: 0.42,
      dataSharingWillingness: 0.55,
      rewardSensitivity: 0.48,
      evidenceScope: "global",
    },
    {
      id: "privacy-sensitive",
      label: "Privacy-sensitive but modifiable",
      memberCount: Math.round(n * 0.14),
      mortalityRiskIndex: 1.15,
      morbidityRiskIndex: 1.15,
      lapseRiskIndex: 1.25,
      modifiabilityIndex: 0.62,
      wearableOwnershipRate: 0.52,
      dataSharingWillingness: 0.28,
      rewardSensitivity: 0.5,
      evidenceScope: "global",
    },
    {
      id: "low-risk-already-active",
      label: "Low-risk already active",
      memberCount: Math.round(n * 0.22),
      mortalityRiskIndex: 0.72,
      morbidityRiskIndex: 0.78,
      lapseRiskIndex: 0.9,
      modifiabilityIndex: 0.24 + engaged * 0.15,
      wearableOwnershipRate: 0.74,
      dataSharingWillingness: 0.7,
      rewardSensitivity: 0.28,
      evidenceScope: "global",
    },
    {
      id: "non-wearable-owner",
      label: "Non-wearable owner needing access path",
      memberCount: Math.round(n * 0.16),
      mortalityRiskIndex: 1.2,
      morbidityRiskIndex: 1.25,
      lapseRiskIndex: 1.1,
      modifiabilityIndex: 0.66,
      wearableOwnershipRate: 0.08,
      dataSharingWillingness: 0.46,
      rewardSensitivity: 0.72,
      evidenceScope: "global",
    },
    {
      id: "shift-worker-sleep-disruption",
      label: "Shift worker / sleep disruption",
      memberCount: Math.round(n * 0.08),
      mortalityRiskIndex: 1.25,
      morbidityRiskIndex: 1.38,
      lapseRiskIndex: 1.05,
      modifiabilityIndex: 0.54,
      wearableOwnershipRate: 0.5,
      dataSharingWillingness: 0.5,
      rewardSensitivity: 0.44,
      evidenceScope: "global",
    },
  ];
}

export function allocateCohortRewards({
  plan,
  behavior,
  cohorts = buildDefaultLifeCohorts(plan, behavior),
  rewardOptions = DEFAULT_REWARD_CATALOGUE,
  budgetPmpm,
  objective = "balanced",
}: {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  cohorts?: PopulationSegmentForAllocation[];
  rewardOptions?: RewardOption[];
  budgetPmpm?: number;
  objective?: "max_net_value" | "max_mortality_impact" | "max_persistency" | "balanced";
}): CohortRewardAllocationResult {
  const priorityScores = cohorts.map((cohort) => scoreCohort(cohort, objective));
  const sorted = [...cohorts].sort((a, b) => {
    const sa = priorityScores.find((s) => s.cohortId === a.id)!.compositeScore;
    const sb = priorityScores.find((s) => s.cohortId === b.id)!.compositeScore;
    return sb - sa;
  });

  let totalExpectedCost = 0;
  const maxBudget = budgetPmpm == null ? Infinity : budgetPmpm * plan.bookSize * plan.horizonMonths;
  const allocations = [];
  const unallocatedCohorts = [];

  for (const cohort of sorted) {
    const score = priorityScores.find((s) => s.cohortId === cohort.id)!;
    if (score.priorityBand === "do_not_overpay") {
      unallocatedCohorts.push({ cohortId: cohort.id, reason: "Low value/modifiability combination; avoid rich incentives." });
      continue;
    }
    const reward = chooseReward(cohort, rewardOptions, score);
    const expectedCost = reward.insurerCostPmpm * cohort.memberCount * plan.horizonMonths;
    if (totalExpectedCost + expectedCost > maxBudget) {
      unallocatedCohorts.push({ cohortId: cohort.id, reason: "Budget constraint reached before this cohort." });
      continue;
    }
    totalExpectedCost += expectedCost;
    allocations.push({
      cohortId: cohort.id,
      rewardOptionId: reward.id,
      rewardLabel: reward.label,
      cashValuePmpm: reward.memberPerceivedValuePmpm,
      deliveryMechanic: mechanicLabel(reward),
      expectedEnrolmentLift: clamp01(0.04 + cohort.rewardSensitivity * 0.16 + reward.memberPerceivedValuePmpm / 250),
      expectedPersistenceLift: clamp01(0.03 + score.incentiveFitScore * 0.14),
      expectedSignalQualityLift: clamp01(0.02 + verificationScore[reward.verificationRequirement] * 0.12),
      expectedCost,
      rationale: rationale(cohort, reward, score),
    });
  }

  return { priorityScores, allocations, unallocatedCohorts, totalExpectedCost };
}

function mechanicLabel(reward: RewardOption): string {
  if (reward.archetype === "cash_equivalent") return "direct cash";
  if (reward.archetype === "premium_discount") return "premium credit";
  if (reward.archetype === "device_financing") return "wearable access credit";
  if (reward.archetype === "clinical_follow_up") return "clinical completion bonus";
  if (reward.archetype === "social_team_challenge") return "team cash pool";
  if (reward.archetype === "charity_reward") return "member-directed payout";
  if (reward.archetype === "points_status") return "status wrapper plus redeemable value";
  return reward.label;
}

function scoreCohort(
  cohort: PopulationSegmentForAllocation,
  objective: "max_net_value" | "max_mortality_impact" | "max_persistency" | "balanced"
): CohortPriorityScore {
  const valueAtRiskScore = clamp01((cohort.mortalityRiskIndex - 0.6) / 1.4);
  const behaviorChangePotentialScore = clamp01(cohort.modifiabilityIndex);
  const incentiveFitScore = clamp01(cohort.rewardSensitivity * 0.6 + cohort.dataSharingWillingness * 0.25 + cohort.wearableOwnershipRate * 0.15);
  const verificationConfidenceScore = clamp01(cohort.wearableOwnershipRate * 0.65 + cohort.dataSharingWillingness * 0.35);
  const economicEfficiencyScore = clamp01(valueAtRiskScore * behaviorChangePotentialScore * 0.7 + incentiveFitScore * 0.3);
  const weights =
    objective === "max_mortality_impact"
      ? [0.4, 0.25, 0.15, 0.1, 0.1]
      : objective === "max_persistency"
        ? [0.2, 0.15, 0.25, 0.1, 0.3]
        : objective === "max_net_value"
          ? [0.25, 0.2, 0.15, 0.1, 0.3]
          : [0.28, 0.22, 0.18, 0.12, 0.2];
  const parts = [valueAtRiskScore, behaviorChangePotentialScore, incentiveFitScore, verificationConfidenceScore, economicEfficiencyScore];
  const compositeScore = parts.reduce((sum, part, i) => sum + part * weights[i], 0);
  const priorityBand =
    compositeScore >= 0.68
      ? "target_aggressively"
      : valueAtRiskScore >= 0.55 && behaviorChangePotentialScore < 0.55
        ? "test_or_clinical_pathway"
        : compositeScore >= 0.42
          ? "low_cost_engagement"
          : "do_not_overpay";
  return {
    cohortId: cohort.id,
    valueAtRiskScore,
    behaviorChangePotentialScore,
    incentiveFitScore,
    verificationConfidenceScore,
    economicEfficiencyScore,
    compositeScore,
    priorityBand,
  };
}

function chooseReward(cohort: PopulationSegmentForAllocation, rewardOptions: RewardOption[], score: CohortPriorityScore) {
  const byId = (id: string) => rewardOptions.find((r) => r.id === id) ?? rewardOptions[0];
  if (cohort.id.includes("non-wearable")) return byId("device-financing");
  if (cohort.id.includes("clinical") || (cohort.mortalityRiskIndex > 1.65 && cohort.modifiabilityIndex < 0.65)) return byId("clinical-follow-up");
  if (cohort.id.includes("price-sensitive")) return byId("cash-equivalent");
  if (cohort.id.includes("privacy")) return byId("premium-discount");
  if (score.priorityBand === "target_aggressively" && cohort.wearableOwnershipRate > 0.7) return byId("device-financing");
  if (cohort.rewardSensitivity < 0.35) return byId("status-points");
  if (cohort.id.includes("shift-worker")) return byId("team-challenge");
  return byId("status-points");
}

function rationale(cohort: PopulationSegmentForAllocation, reward: RewardOption, score: CohortPriorityScore) {
  return `${reward.label} selected for ${cohort.label}: all cohorts receive monetary value; the delivery mechanic is tailored to value-at-risk ${(score.valueAtRiskScore * 100).toFixed(0)}%, modifiability ${(score.behaviorChangePotentialScore * 100).toFixed(0)}%, and incentive fit ${(score.incentiveFitScore * 100).toFixed(0)}%.`;
}
