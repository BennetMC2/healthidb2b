import { CALIBRATION_MODULE } from "./calibration";
import { CLAIMS_BRIDGE_MODULE } from "./claimsBridge";
import { COHORT_REWARD_ALLOCATOR_MODULE } from "./cohortRewardAllocator";
import { DISCOUNTING_MODULE } from "./discounting";
import { DOSE_RESPONSE_MODULE } from "./doseResponse";
import { FINANCIAL_MODULE } from "./financial";
import { GROUP_PRODUCTIVITY_MODULE } from "./groupProductivity";
import { LIFE_BACKTEST_MODULE } from "./lifeBacktest";
import { LIFE_INSURANCE_VALUE_MODULE } from "./lifeInsuranceValue";
import { REWARD_STRATEGY_EXPLAINER_MODULE } from "./rewardStrategyExplainer";
import { REWARD_RESPONSE_MODULE } from "./rewardResponse";
import { EVIDENCE_GATE_MODULE, FUSION_MODULE, SIGNAL_REGISTRY_MODULE, TRUST_MODIFIER_MODULE } from "./registry";
import { UNCERTAINTY_MODULE } from "./uncertainty";
import type { ModuleRunMetadata } from "./contracts";

export const MODEL_REGISTRY_VERSION = "0.2.0";

export const ACTIVE_MODEL_MODULES: ModuleRunMetadata[] = [
  {
    ...SIGNAL_REGISTRY_MODULE,
    evidenceScope: "global",
  },
  {
    ...FUSION_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...EVIDENCE_GATE_MODULE,
    evidenceScope: "global",
  },
  {
    ...TRUST_MODIFIER_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...DOSE_RESPONSE_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...CALIBRATION_MODULE,
    evidenceScope: "global",
  },
  {
    ...REWARD_RESPONSE_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...CLAIMS_BRIDGE_MODULE,
    evidenceScope: "global",
  },
  {
    ...DISCOUNTING_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...GROUP_PRODUCTIVITY_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...COHORT_REWARD_ALLOCATOR_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...LIFE_INSURANCE_VALUE_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...REWARD_STRATEGY_EXPLAINER_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...LIFE_BACKTEST_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...FINANCIAL_MODULE,
    evidenceScope: "illustrative",
  },
  {
    ...UNCERTAINTY_MODULE,
    evidenceScope: "illustrative",
  },
];

export function activeModelModuleSummary() {
  return {
    registryVersion: MODEL_REGISTRY_VERSION,
    modules: ACTIVE_MODEL_MODULES,
  };
}
