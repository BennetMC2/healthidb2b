import { activeModelModuleSummary } from "./moduleRegistry";
import { currentSet } from "./modelContext";

export const OPERATOR_MODEL_MAP_VERSION = "0.1.0";

export function buildOperatorModelMap() {
  const assumptions = currentSet();
  const moduleSummary = activeModelModuleSummary();
  return {
    version: OPERATOR_MODEL_MAP_VERSION,
    registryVersion: moduleSummary.registryVersion,
    assumptionSet: {
      id: assumptions.id,
      version: assumptions.version,
      label: assumptions.label,
      status: assumptions.status,
      source: assumptions.source,
    },
    modules: moduleSummary.modules,
    calculationChain: [
      {
        step: 1,
        name: "Scenario resolution",
        file: "server/engine/orchestrator.ts",
        purpose: "Convert user goal into campaign, market, book size and horizon.",
        inputs: ["goal text", "sample size"],
        outputs: ["ResolvedPlan"],
        operatorNotes: ["LLM parsing may degrade to heuristic parsing; parse mode is surfaced in the run."],
      },
      {
        step: 2,
        name: "Population sampling",
        file: "server/engine/population.ts",
        purpose: "Generate synthetic member records from default global life segments or an approved selected segment set.",
        inputs: ["market", "sample size", "seed", "optional selected segment set"],
        outputs: ["MemberAgent[]", "wearable prior"],
        formula: "segment draw proportional to segment.weight; member traits sampled deterministically from seed.",
        operatorNotes: ["Approved uploaded segment sets replace illustrative defaults only when explicitly selected."],
      },
      {
        step: 3,
        name: "Live member-agent decisions",
        file: "server/engine/agents.ts",
        purpose: "Estimate enrolment, persistence, effort and reward sensitivity for each sampled member.",
        inputs: ["MemberAgent[]", "ResolvedPlan", "LLM provider settings"],
        outputs: ["AgentDecision[]"],
        formula: "Strict batched LLM calls with retries; no heuristic substitution inside completed live batches.",
        operatorNotes: ["Run mode is llm, mixed or heuristic and must be shown before treating agent reasoning as live model output."],
      },
      {
        step: 4,
        name: "Behaviour aggregation and calibration",
        file: "server/engine/calibration.ts",
        purpose: "Aggregate agent decisions and shrink raw rates toward the active verified-device, loss-framed reference class.",
        inputs: ["AgentDecision[]", "campaign type"],
        outputs: ["BehaviorRates", "CalibrationReport"],
        formula: "calibrated = raw * (1 - w) + anchor_midpoint * w, where w = 28/(28+n).",
        operatorNotes: ["Calibration diagnostics show active verified-device anchors and legacy unverified-wellness comparison anchors."],
      },
      {
        step: 5,
        name: "Cohort reward allocation",
        file: "server/engine/cohortRewardAllocator.ts",
        purpose: "Score life-insurance cohorts and assign reward archetypes under objective and budget constraints.",
        inputs: ["ResolvedPlan", "BehaviorRates", "reward catalogue", "objective", "budget PMPM"],
        outputs: ["CohortRewardAllocationResult"],
        formula: "composite score = weighted value-at-risk, modifiability, incentive fit, verification confidence and economic efficiency.",
        operatorNotes: ["Deterministic allocator owns scores, reward assignments and costs. AI explanations cannot change these outputs."],
      },
      {
        step: 6,
        name: "Life insurance value path",
        file: "server/engine/lifeInsuranceValue.ts",
        purpose: "Estimate mortality segmentation, morbidity proxy, acquisition value, persistency value and reward cost.",
        inputs: ["ResolvedPlan", "CohortRewardAllocationResult", "selected/pending life assumptions", "wearable signal tiers"],
        outputs: ["LifeInsuranceValueResult"],
        formula:
          "mortality value = book_size * baseline_mortality * sum_assured * segmentation_lift * horizon_years; gross life value = mortality + morbidity + acquisition + persistency; net life value = gross - reward cost.",
        operatorNotes: ["Pending life assumption overrides take precedence over selected approved life-assumption versions."],
      },
      {
        step: 7,
        name: "Monte Carlo financial engine",
        file: "server/engine/montecarlo.ts",
        purpose: "Propagate behaviour, claims-bridge, productivity, attribution and cost uncertainty through gross value, configured costs, net value and ROI band.",
        inputs: ["ResolvedPlan", "BehaviorRates", "iterations", "seed", "optional IncentiveDesign"],
        outputs: ["MonteCarloResult"],
        formula: "ROI = net value / total cost only when incentive, admin and platform costs are explicitly configured.",
        operatorNotes: ["Impact-only runs suppress ROI and show break-even budget instead."],
      },
      {
        step: 8,
        name: "Claims bridge and group productivity",
        file: "server/engine/claimsBridge.ts; server/engine/groupProductivity.ts",
        purpose: "Convert applicable treated members into claims-denominated savings and optional group productivity value.",
        inputs: ["ResolvedPlan", "effective treated members", "claims bridge assumptions", "group productivity assumptions"],
        outputs: ["claims savings", "productivity value"],
        formula: "claims = effectiveTreated × applicablePrevalence × annualClaimsDeltaUSD × attributionFactor × achievedDose × PV factor; productivity = groupTreated × productivityPerMember × attributionFactor × PV factor.",
        operatorNotes: ["Claims bridge does not use mortality RR; productivity is separate from claims and should be disabled for individual-only books."],
      },
      {
        step: 9,
        name: "Narrative and explanation",
        file: "server/engine/narrative.ts; server/engine/rewardStrategyExplainer.ts",
        purpose: "Write executive narrative and bounded reward-strategy explanation from deterministic outputs.",
        inputs: ["ResolvedPlan", "BehaviorRates", "MonteCarloResult", "CohortRewardAllocationResult"],
        outputs: ["NarrativeReport", "RewardStrategyExplanation"],
        operatorNotes: ["LLM prose explains outputs; it must not decide actuarial values, verdict thresholds, reward assignments or ROI."],
      },
      {
        step: 10,
        name: "Governance persistence",
        file: "server/storage.ts; server/routes.ts",
        purpose: "Persist runs, scenarios, backtests, governed inputs, segment uploads and audit events.",
        inputs: ["simulation outputs", "user uploads", "approval events", "exports"],
        outputs: ["database records", "audit log"],
        operatorNotes: ["Prototype actor is system until authentication and tenancy are added."],
      },
    ],
    formulas: [
      {
        name: "Reward allocation score",
        expression:
          "score = Σ(weight_i × component_i), where components are value-at-risk, modifiability, incentive fit, verification confidence and economic efficiency.",
        owner: "server/engine/cohortRewardAllocator.ts",
      },
      {
        name: "Mortality segmentation value",
        expression: "bookSize × baselineAnnualMortalityRate × sumAssured × segmentationLift × horizonYears",
        owner: "server/engine/lifeInsuranceValue.ts",
      },
      {
        name: "Persistency value",
        expression: "bookSize × annualPremium × lapseImprovement × horizonYears",
        owner: "server/engine/lifeInsuranceValue.ts",
      },
      {
        name: "Net life value",
        expression: "mortalitySegmentationValue + morbidityValue + acquisitionValue + lapsePersistencyValue - rewardCost",
        owner: "server/engine/lifeInsuranceValue.ts",
      },
      {
        name: "ROI",
        expression: "ROI band = P5/P50/P95 of netValue / totalCost; unavailable unless reward, admin and platform costs are configured",
        owner: "server/engine/financial.ts",
      },
      {
        name: "Claims bridge",
        expression: "effectiveTreated × applicablePrevalence × annualClaimsDeltaUSD × attributionFactor × achievedDose × presentValueFactor",
        owner: "server/engine/claimsBridge.ts",
      },
      {
        name: "Group productivity",
        expression: "groupTreated × productivityPerMemberUSD × attributionFactor × presentValueFactor",
        owner: "server/engine/groupProductivity.ts",
      },
    ],
    governedInputs: [
      "Approved life-assumption versions",
      "Approved segment-set versions",
      "Pending life assumption overrides",
      "Behaviour calibration reference class / anchor overrides",
      "Claims bridge, cost basis, claims tiers, discounting, group productivity and mortality-table versions",
      "Reward strategy objective and budget",
      "Configured incentive, admin and platform costs",
    ],
  };
}
