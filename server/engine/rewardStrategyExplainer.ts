import type {
  BehaviorRates,
  CohortRewardAllocationResult,
  LifeInsuranceValueResult,
  ResolvedPlan,
  RewardStrategyConfig,
  RewardStrategyExplanation,
} from "@shared/schema";
import { callLlm } from "./llm";

export const REWARD_STRATEGY_EXPLAINER_MODULE = {
  moduleName: "bounded-reward-strategy-explainer",
  moduleVersion: "0.1.0",
};

export async function explainRewardStrategy({
  plan,
  behavior,
  strategy,
  allocation,
  lifeValue,
}: {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  strategy: RewardStrategyConfig;
  allocation: CohortRewardAllocationResult;
  lifeValue: LifeInsuranceValueResult;
}): Promise<RewardStrategyExplanation> {
  const deterministic = deterministicExplanation({ plan, behavior, strategy, allocation, lifeValue });
  try {
    const text = await callLlm({
      maxTokens: 650,
      temperature: 0.3,
      system:
        "You explain an insurer reward allocation that has already been determined by a deterministic model. Do not change allocations, costs, scores, or recommendations. Return only compact JSON.",
      prompt: buildPrompt({ plan, behavior, strategy, allocation, lifeValue, deterministic }),
    });
    const parsed = parseJson(text.text);
    return {
      mode: "llm",
      summary: String(parsed.summary || deterministic.summary).slice(0, 360),
      rationale: Array.isArray(parsed.rationale)
        ? parsed.rationale.slice(0, 4).map((r: unknown) => String(r).slice(0, 220))
        : deterministic.rationale,
      boundedVariants: deterministic.boundedVariants,
      caveats: Array.isArray(parsed.caveats)
        ? parsed.caveats.slice(0, 4).map((c: unknown) => String(c).slice(0, 220))
        : deterministic.caveats,
    };
  } catch {
    return deterministic;
  }
}

export function deterministicExplanation({
  plan,
  behavior,
  strategy,
  allocation,
  lifeValue,
}: {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  strategy: RewardStrategyConfig;
  allocation: CohortRewardAllocationResult;
  lifeValue: LifeInsuranceValueResult;
}): RewardStrategyExplanation {
  const top = [...allocation.priorityScores].sort((a, b) => b.compositeScore - a.compositeScore)[0];
  const allocated = allocation.allocations.length;
  const budgetText = typeof strategy.budgetPmpm === "number" ? `$${strategy.budgetPmpm.toFixed(2)} PMPM budget cap` : "uncapped budget";
  return {
    mode: "deterministic",
    summary: `The deterministic allocator assigned ${allocated} cohort reward paths under a ${strategy.objective.replace(/_/g, " ")} objective and ${budgetText}. Net life value is $${Math.round(lifeValue.netValue).toLocaleString()} after expected reward cost.`,
    rationale: [
      top
        ? `Highest-priority cohort is ${top.cohortId.replace(/-/g, " ")} because value-at-risk, modifiability and incentive fit combine to ${(top.compositeScore * 100).toFixed(0)}%.`
        : "No priority score exceeded the allocator threshold.",
      `${allocated} cohorts received a reward assignment; ${allocation.unallocatedCohorts.length} were left unallocated because of economics, priority band, or budget constraints.`,
      `Observed behaviour inputs were enrolment ${(behavior.enrollmentRate * 100).toFixed(0)}%, persistence ${(behavior.persistenceRate * 100).toFixed(0)}%, and behaviour change ${(behavior.behaviorChangeRate * 100).toFixed(0)}%.`,
    ],
    boundedVariants: boundedVariants(strategy),
    caveats: [
      "AI text explains the deterministic allocation only; it does not alter actuarial outputs.",
      "Variant ideas must be re-run through the deterministic allocator before being treated as a result.",
      "Cohort weights and reward-response assumptions remain planning assumptions until validated against observed campaign data.",
    ],
  };
}

function boundedVariants(strategy: RewardStrategyConfig): RewardStrategyExplanation["boundedVariants"] {
  const budget = strategy.budgetPmpm;
  return [
    {
      name: "Mortality-impact tilt",
      objective: "reduce_mortality",
      budgetPmpm: budget,
      expectedTradeoff: "Prioritises high-risk cohorts; may raise reward cost or reduce breadth of allocation.",
    },
    {
      name: "Acquisition/persistency tilt",
      objective: "attract_users",
      budgetPmpm: budget,
      expectedTradeoff: "Prioritises take-up and retention; may underweight morbidity and mortality impact.",
    },
    {
      name: "Budget discipline",
      objective: "max_net_value",
      budgetPmpm: typeof budget === "number" ? Math.max(0, budget * 0.8) : 6,
      expectedTradeoff: "Constrains overspend; may leave some modifiable cohorts unallocated.",
    },
  ];
}

function buildPrompt(input: {
  plan: ResolvedPlan;
  behavior: BehaviorRates;
  strategy: RewardStrategyConfig;
  allocation: CohortRewardAllocationResult;
  lifeValue: LifeInsuranceValueResult;
  deterministic: RewardStrategyExplanation;
}) {
  const topAllocations = input.allocation.allocations.slice(0, 5).map((a) => ({
    cohortId: a.cohortId,
    rewardOptionId: a.rewardOptionId,
    expectedCost: Math.round(a.expectedCost),
    expectedEnrolmentLift: a.expectedEnrolmentLift,
    expectedPersistenceLift: a.expectedPersistenceLift,
    rationale: a.rationale,
  }));
  return JSON.stringify({
    instruction:
      "Explain why the deterministic reward strategy makes sense. Do not invent numbers. Do not recommend a final business decision. Keep variants bounded to the supplied deterministic variants.",
    campaign: input.plan.campaignLabel,
    bookSize: input.plan.bookSize,
    objective: input.strategy.objective,
    budgetPmpm: input.strategy.budgetPmpm ?? null,
    behaviorChangeRate: input.behavior.behaviorChangeRate,
    netLifeValue: input.lifeValue.netValue,
    rewardCost: input.lifeValue.rewardCost,
    topAllocations,
    deterministicVariants: input.deterministic.boundedVariants,
    requiredJsonShape: {
      summary: "one concise paragraph",
      rationale: ["2-4 bullets explaining allocation using supplied facts"],
      caveats: ["2-4 caveats"],
    },
  });
}

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("no json object");
  return JSON.parse(cleaned.slice(s, e + 1));
}
