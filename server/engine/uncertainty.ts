import type {
  BehaviorRates,
  Distribution,
  GuardrailFlag,
  ResolvedPlan,
  RewardOptimization,
  TornadoBar,
} from "@shared/schema";
import { ECONOMIC_ASSUMPTIONS } from "./assumptions";
import { evalChain, type ChainParams } from "./financial";
import { CLAIMS_BRIDGE_DOSE_RESPONSE_PARAMS } from "./claimsBridge";
import { signalToClaimsBridgeKey } from "./signalCompatibility";
import type { ResponseCurveParams } from "./rewardResponse";

export const UNCERTAINTY_MODULE = {
  moduleName: "default-uncertainty-and-guardrails",
  moduleVersion: "0.2.0",
};

export function buildTornado(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  curve: ResponseCurveParams,
  claimsBaseline: number
): TornadoBar[] {
  const base = CLAIMS_BRIDGE_DOSE_RESPONSE_PARAMS.find((p) => p.campaign === signalToClaimsBridgeKey(plan.primarySignal ?? plan.campaign));
  const factors: { factor: string; lo: () => number; hi: () => number }[] = [
    {
      factor: "Engaged fraction (behaviour change)",
      lo: () => quickNet(plan, { ...behavior, behaviorChangeRate: behavior.behaviorChangeCI[0] }, curve, claimsBaseline),
      hi: () => quickNet(plan, { ...behavior, behaviorChangeRate: behavior.behaviorChangeCI[1] }, curve, claimsBaseline),
    },
    {
      factor: "12-mo persistence",
      lo: () => quickNet(plan, { ...behavior, persistenceRate: behavior.persistenceCI[0] }, curve, claimsBaseline),
      hi: () => quickNet(plan, { ...behavior, persistenceRate: behavior.persistenceCI[1] }, curve, claimsBaseline),
    },
    {
      factor: "Claims-cost bridge delta (CI)",
      lo: () => quickNet(plan, behavior, curve, claimsBaseline, base?.effectCI[0]),
      hi: () => quickNet(plan, behavior, curve, claimsBaseline, base?.effectCI[1]),
    },
  ];
  return factors
    .map((f) => {
      const low = f.lo();
      const high = f.hi();
      return { factor: f.factor, low, high, swing: Math.abs(high - low) };
    })
    .sort((a, b) => b.swing - a.swing);
}

function quickNet(
  plan: ResolvedPlan,
  b: BehaviorRates,
  _curve: ResponseCurveParams,
  claimsBaseline: number,
  claimsDeltaOverride?: number
): number {
  const cp: ChainParams = {
    enrollment: b.enrollmentRate,
    persistence: b.persistenceRate,
    stepLift: b.meanStepLift,
    effortIntensity: b.meanEffortIntensity,
    lapseReduction: ECONOMIC_ASSUMPTIONS.lapseReduction,
    ltv: ECONOMIC_ASSUMPTIONS.ltvPerMember,
    claimsAnnualDeltaOverride: claimsDeltaOverride,
  };
  return evalChain(plan, cp, plan.assumedOfferPmpm, b.behaviorChangeRate).netValue;
}

export function buildGuardrails(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  netDist: Distribution,
  opt: RewardOptimization,
  economicsConfigured: boolean,
  maxAllInCostP50: number,
  maxRewardPmpmP50: number
): GuardrailFlag[] {
  const flags: GuardrailFlag[] = [];
  if (!economicsConfigured) {
    flags.push({
      level: "info",
      message: `Impact-only run: ROI is unavailable until reward, admin and platform costs are configured.`,
    });
    flags.push({
      level: "info",
      message: `Break-even all-in programme budget is approximately US$${fmt(maxAllInCostP50)} at P50, or up to US$${(maxRewardPmpmP50 * 12).toFixed(0)}/changed member/year before non-reward costs.`,
    });
    return flags;
  }
  flags.push({
    level: "info",
    message: `Reward to sustain observed engagement ≈ US$${(opt.derivedReward * 12).toFixed(0)}/member/year (P5–P95 US$${(opt.derivedRewardLow * 12).toFixed(0)}–${(opt.derivedRewardHigh * 12).toFixed(0)}).`,
  });
  if (opt.workWellRange) {
    flags.push({
      level: "info",
      message: `Net-positive reward band: ≈ US$${(opt.workWellRange[0] * 12).toFixed(0)} to US$${(opt.workWellRange[1] * 12).toFixed(0)}/member/year under the selected assumptions.`,
    });
  }
  if (opt.viableRewardRange) {
    flags.push({
      level: "info",
      message: `Net value is non-negative for rewards up to US$${(opt.viableRewardRange[1] * 12).toFixed(0)}/member/year under this assumption set.`,
    });
  } else {
    flags.push({
      level: "warn",
      message: `No tested reward level produces positive net value after reward, admin and platform costs.`,
    });
  }
  if (behavior.behaviorChangeRate < 0.08) {
    flags.push({
      level: "warn",
      message: `Agent-derived behaviour-change rate is low (${(behavior.behaviorChangeRate * 100).toFixed(0)}% of members); consider stronger onboarding or incentive design.`,
    });
  }
  if (behavior.sampleSize < 40) {
    flags.push({
      level: "info",
      message: `Sample of ${behavior.sampleSize} agents → wider behavioural confidence intervals. The default 100-agent run tightens these bands.`,
    });
  }
  flags.push({
    level: netDist.p50 < 0 ? "critical" : "info",
    message: `Net value at the median ≈ US$${fmt(netDist.p50)} after reward, admin and platform costs.`,
  });
  return flags;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}
