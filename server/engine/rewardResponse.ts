import type { BehaviorRates, ResolvedPlan } from "@shared/schema";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const REWARD_RESPONSE_MODULE = {
  moduleName: "default-reward-response",
  moduleVersion: "0.2.0",
};

export interface ResponseCurveParams {
  floor: number;
  cap: number;
  k: number;
  // where the floor/cap shape came from: observed randomized reward arms,
  // per-agent stated decisions, or fallback constants
  shapeSource?: "observed-arms" | "agent-derived" | "fallback-heuristic";
}

// OBSERVED-ARMS FIT — when the run randomized agents across reward arms (a
// synthetic RCT), fit the curve through the observed arm engagement instead of
// stated sensitivities:
//   • the $0 arm sets the FLOOR directly (intrinsic motivation: members who
//     engage for their own health + the companion experience, no cash),
//   • the curve is anchored exactly through the calibrated headline at the
//     run offer (arm rates are rescaled by calibrated/raw so calibration of
//     the LEVEL doesn't break the observed SHAPE),
//   • k is chosen by least squares against the remaining observed arms, with
//     the cap implied by the anchor constraint.
function fitFromObservedArms(
  arms: NonNullable<BehaviorRates["doseResponseArms"]>,
  engagedFrac: number,
  offer: number
): ResponseCurveParams | null {
  const offerArm = arms.find((a) => a.isOfferArm);
  if (!offerArm || offerArm.engagedRate <= 1e-3 || engagedFrac <= 1e-3) return null;
  const scale = engagedFrac / offerArm.engagedRate;
  const zeroArm = arms.find((a) => a.rewardPmpm === 0);
  const floor = clamp((zeroArm?.engagedRate ?? 0) * scale, 0, Math.max(0, engagedFrac - 1e-3));
  const pts = arms
    .filter((a) => !a.isOfferArm && a.rewardPmpm > 0)
    .map((a) => ({ r: a.rewardPmpm, e: clamp(a.engagedRate * scale, 0, 0.95) }));
  if (!pts.length && !zeroArm) return null;

  let best: ResponseCurveParams | null = null;
  let bestErr = Infinity;
  for (let i = 0; i < 80; i++) {
    const k = 0.005 * Math.pow(140, i / 79); // log-spaced 0.005..0.7
    const denom = 1 - Math.exp(-k * offer);
    if (denom < 1e-4) continue;
    const cap = floor + (engagedFrac - floor) / denom;
    if (!(cap > engagedFrac) || cap > 0.95) continue;
    const candidate: ResponseCurveParams = { floor, cap, k, shapeSource: "observed-arms" };
    const err = pts.reduce((s, pt) => s + (engagementAt(pt.r, candidate) - pt.e) ** 2, 0);
    if (err < bestErr) {
      bestErr = err;
      best = candidate;
    }
  }
  return best;
}

// Fit the reward→engagement curve through the one OBSERVED point (the engaged
// fraction at the offered reward). The curve SHAPE (floor and cap) comes from
// the per-agent enroll-likelihood × reward-sensitivity distribution when it is
// available — i.e. the agents, not tuned constants, say how much engagement
// survives a zero reward and how much headroom a bigger reward can buy.
export function fitResponseCurve(plan: ResolvedPlan, behavior: BehaviorRates): ResponseCurveParams {
  const engagedFrac = behavior.behaviorChangeRate;
  const offer = Math.max(1, plan.assumedOfferPmpm);

  // Best evidence first: observed randomized reward arms (synthetic RCT).
  if (behavior.doseResponseArms && behavior.doseResponseArms.length >= 3) {
    const observed = fitFromObservedArms(behavior.doseResponseArms, engagedFrac, offer);
    if (observed) return observed;
  }

  let floor: number;
  let cap: number;
  let shapeSource: ResponseCurveParams["shapeSource"];
  const shape = behavior.rewardCurveShape;
  if (shape && shape.capShare > shape.floorShare) {
    floor = clamp(engagedFrac * shape.floorShare, 0, 0.9);
    cap = clamp(engagedFrac * shape.capShare, Math.min(0.95, engagedFrac * 1.05 + 1e-3), 0.95);
    shapeSource = "agent-derived";
  } else {
    const s = clamp(behavior.meanRewardSensitivity, 0.05, 0.95);
    floor = engagedFrac * (1 - s) * 0.6;
    cap = clamp(0.68 + s * 0.25, Math.max(engagedFrac * 1.25, 0.62), 0.95);
    shapeSource = "fallback-heuristic";
  }

  // Anchor exactly through the observed point: engagementAt(offer) === engagedFrac
  // (modulo the ratio clamp). No dampening factor — a flattened curve made the
  // curve-at-the-run-reward disagree with the headline spine.
  const ratio = clamp((engagedFrac - floor) / Math.max(1e-3, cap - floor), 0.02, 0.98);
  const k = -Math.log(1 - ratio) / offer;
  return { floor, cap, k, shapeSource };
}

export function engagementAt(reward: number, p: ResponseCurveParams): number {
  return p.floor + (p.cap - p.floor) * (1 - Math.exp(-p.k * Math.max(0, reward)));
}

export function rewardForEngagement(target: number, p: ResponseCurveParams): number {
  const t = clamp(target, p.floor + 1e-3, p.cap - 1e-3);
  return -Math.log(1 - (t - p.floor) / (p.cap - p.floor)) / Math.max(1e-4, p.k);
}

// Saturation scale ≈ $35 PMPM ≈ $1.15/day. The published dose-response
// supports saturation near $1–1.5/day: Carrot Rewards (+115 steps @ ~$0.03/d),
// Mitchell 2019 meta-analysis (+607 steps @ ~$1.30/d), TRIPPA (+570 steps @
// ~$1.90/d max) — virtually no marginal gain beyond ~$1.5/day for gain-framed
// cash. Loss-framing multiplies the effect ~2.7× at identical EV (Patel 2016).
const REWARD_LIFT_SCALE = 35;

export function rewardLifts(reward: number, offer: number) {
  const sat = (r: number, scale: number) => 1 - Math.exp(-Math.max(0, r) / scale);
  const base = sat(offer, REWARD_LIFT_SCALE);
  const norm = (r: number, ceil: number) => {
    const f = (sat(r, REWARD_LIFT_SCALE) - base) / Math.max(1e-6, 1 - base);
    return 1 + ceil * Math.max(0, f);
  };
  return {
    persistence: norm(reward, 0.38),
    dose: norm(reward, 0.28),
    cohortRisk: norm(reward, 0.25),
  };
}
