import type {
  BehaviorRates,
  CalibrationReport,
  CalibrationAnchor,
  SignalId,
} from "@shared/schema";
import { getSignal } from "./registry";

export const CALIBRATION_MODULE = {
  moduleName: "behavior-calibration",
  moduleVersion: "0.3.0",
  referenceClass: "verified-device-loss-framed",
};

// ===========================================================================
// CALIBRATION v0.3 — precision-weighted Bayesian blend.
//
// The agent sample is treated as EVIDENCE, the published literature band as a
// PRIOR. Each is converted to a normal distribution and blended by precision:
//
//   prior:      N(priorMean, priorSd²)   priorMean = band mid,
//                                        priorSd   = (high − low) / 3.29
//                                        (band read as a 90% plausible interval)
//   evidence:   N(raw, rawSd²)           rawSd from the sample CI
//   posterior:  precision-weighted mean; posteriorSd = sqrt(1 / (τp + τr))
//   priorWeight w = τp / (τp + τr)       — DERIVED from the data, not a tuned
//                                          constant. More agents → tighter
//                                          evidence → lower prior weight.
//
// priorTrust (0..1, default 1) scales the prior precision: 0 = agents only,
// 1 = full literature weight. It is surfaced in the report so the blend is
// auditable and adjustable, never hidden.
//
// DIVERGENCE: when the agent evidence sits far from the prior
// (|z| ≥ 1.645 on the combined scale), that disagreement is REPORTED as a
// finding instead of being silently shrunk away. Agents disagreeing with the
// literature is information, not an error.
// ===========================================================================

const LEGACY_ENROLLMENT_ANCHOR: Record<string, [number, number]> = {
  steps: [0.18, 0.36],
  vo2max: [0.14, 0.3],
  sleep_regularity: [0.16, 0.32],
  bp: [0.1, 0.26],
  hba1c: [0.1, 0.24],
  resting_hr: [0.14, 0.3],
  hrv: [0.14, 0.3],
  glucose_tir: [0.1, 0.24],
  gait_speed: [0.1, 0.22],
  respiratory_rate: [0.1, 0.22],
};
const LEGACY_PERSISTENCE_ANCHOR: [number, number] = [0.25, 0.45];
const LEGACY_STEP_LIFT_ANCHOR: [number, number] = [600, 1600];

const VERIFIED_ENROLLMENT_ANCHOR: Record<string, [number, number]> = {
  steps: [0.35, 0.55],
  vo2max: [0.33, 0.53],
  sleep_regularity: [0.3, 0.5],
  bp: [0.24, 0.42],
  hba1c: [0.22, 0.4],
  resting_hr: [0.28, 0.48],
  hrv: [0.28, 0.48],
  glucose_tir: [0.2, 0.38],
  gait_speed: [0.18, 0.34],
  respiratory_rate: [0.18, 0.34],
};
// Evidence pass June 2026: TRIPPA (Singapore RCT) found only ~10% still
// wearing trackers at 12 months; National Steps Challenge <33% active at
// ~7 months; the 40–60% band is supportable ONLY for loss-framed
// device-financing designs (RAND/Vitality Apple Watch, sustained 24 mo).
const VERIFIED_PERSISTENCE_ANCHOR: [number, number] = [0.25, 0.45];
const VERIFIED_STEP_LIFT_ANCHOR: [number, number] = [1000, 2000];

const DIVERGENCE_Z = 1.645; // 90% two-sided threshold

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}

interface BlendResult {
  posterior: number;
  posteriorCI: [number, number];
  priorWeight: number;
  divergenceZ: number;
  diverges: boolean;
}

function blend(
  raw: number,
  rawCI: [number, number],
  band: [number, number],
  priorTrust: number
): BlendResult {
  const priorMean = (band[0] + band[1]) / 2;
  const priorSd = Math.max(1e-6, (band[1] - band[0]) / 3.29);
  // Guard rawSd: a degenerate CI (tiny sample, 0-width) must not claim
  // infinite precision — floor it at half the prior sd.
  const rawSd = Math.max(priorSd * 0.5, (rawCI[1] - rawCI[0]) / 3.92);

  const tauR = 1 / (rawSd * rawSd);
  const tauP = (clamp(priorTrust, 0, 1) / (priorSd * priorSd)) || 0;
  const w = tauP / (tauP + tauR); // weight on the PRIOR

  const posterior = (1 - w) * raw + w * priorMean;
  const posteriorSd = Math.sqrt(1 / (tauP + tauR));
  // standardized disagreement between evidence and prior on the combined scale
  const divergenceZ = (raw - priorMean) / Math.sqrt(rawSd * rawSd + priorSd * priorSd);

  // generous envelope: posterior may leave the band but not absurdly
  const lo = Math.min(band[0] * 0.35, raw);
  const hi = Math.max(band[1] * 1.65, raw);
  const clamped = clamp(posterior, lo, hi);

  return {
    posterior: clamped,
    posteriorCI: [Math.max(0, clamped - 1.96 * posteriorSd), clamped + 1.96 * posteriorSd],
    priorWeight: w,
    divergenceZ,
    diverges: Math.abs(divergenceZ) >= DIVERGENCE_Z,
  };
}

function divergenceText(metric: string, raw: number, band: [number, number], z: number, pct: boolean): string {
  const dir = z > 0 ? "above" : "below";
  const fmt = (v: number) => (pct ? `${(v * 100).toFixed(0)}%` : `+${Math.round(v).toLocaleString()}`);
  return `Agent sample puts ${metric.toLowerCase()} at ${fmt(raw)}, materially ${dir} the published ${fmt(band[0])}–${fmt(band[1])} band (z=${z.toFixed(1)}). The blended estimate respects both, but this disagreement is a finding worth investigating — the cohort mix, offer framing or market may genuinely differ from the reference class.`;
}

export interface CalibrationOptions {
  // 0 = trust agents only, 1 = full literature prior precision (default)
  priorTrust?: number;
}

export function calibrateBehavior(
  raw: BehaviorRates,
  signalId: SignalId,
  options?: CalibrationOptions
): { calibrated: BehaviorRates; report: CalibrationReport } {
  const n = raw.sampleSize;
  const priorTrust = clamp(options?.priorTrust ?? 1, 0, 1);
  const signal = getSignal(signalId);

  const enrollBand = VERIFIED_ENROLLMENT_ANCHOR[signal.signalId] ?? [0.25, 0.45];
  const legacyEnrollBand = LEGACY_ENROLLMENT_ANCHOR[signal.signalId] ?? [0.12, 0.28];
  const isSteps = signal.signalId === "steps";

  const enroll = blend(raw.enrollmentRate, raw.enrollmentCI, enrollBand, priorTrust);
  const persist = blend(raw.persistenceRate, raw.persistenceCI, VERIFIED_PERSISTENCE_ANCHOR, priorTrust);
  const lift =
    isSteps && raw.meanStepLift > 0
      ? blend(raw.meanStepLift, raw.stepLiftCI, VERIFIED_STEP_LIFT_ANCHOR, priorTrust)
      : null;

  // Behaviour-change (hero) prior band is derived from the enrollment band:
  // engaged share = enrolled share that sticks long enough to matter.
  const behaviorBand: [number, number] = [enrollBand[0] * 0.5, enrollBand[1] * 0.8];
  const behaviorChange = blend(raw.behaviorChangeRate, raw.behaviorChangeCI, behaviorBand, priorTrust);

  const divergenceFindings: string[] = [];
  if (enroll.diverges)
    divergenceFindings.push(divergenceText("Enrollment rate", raw.enrollmentRate, enrollBand, enroll.divergenceZ, true));
  if (persist.diverges)
    divergenceFindings.push(
      divergenceText("12-mo persistence", raw.persistenceRate, VERIFIED_PERSISTENCE_ANCHOR, persist.divergenceZ, true)
    );
  if (lift?.diverges)
    divergenceFindings.push(
      divergenceText("Mean daily step lift", raw.meanStepLift, VERIFIED_STEP_LIFT_ANCHOR, lift.divergenceZ, false)
    );

  const anchors: CalibrationAnchor[] = [
    {
      metric: "Enrollment rate",
      rawValue: raw.enrollmentRate,
      rawCI: raw.enrollmentCI,
      anchorLow: enrollBand[0],
      anchorHigh: enrollBand[1],
      calibratedValue: enroll.posterior,
      posteriorCI: enroll.posteriorCI,
      priorWeight: enroll.priorWeight,
      divergenceZ: enroll.divergenceZ,
      diverges: enroll.diverges,
      source:
        "Verified active-rewards uptake, SPONSORED GROUP channel: UHC Motion >45%, US Vitality Apple Watch 47%, Carrot Rewards 44%. Retail insured books run far lower (SA Apple Watch uptake 14%, Discovery Active Rewards ~20%) — treat the band as group-channel and haircut ~0.6 for registered-to-active.",
      referenceClass: CALIBRATION_MODULE.referenceClass,
      legacyAnchorLow: legacyEnrollBand[0],
      legacyAnchorHigh: legacyEnrollBand[1],
    },
    {
      metric: "12-mo persistence (of enrollees)",
      rawValue: raw.persistenceRate,
      rawCI: raw.persistenceCI,
      anchorLow: VERIFIED_PERSISTENCE_ANCHOR[0],
      anchorHigh: VERIFIED_PERSISTENCE_ANCHOR[1],
      calibratedValue: persist.posterior,
      posteriorCI: persist.posteriorCI,
      priorWeight: persist.priorWeight,
      divergenceZ: persist.divergenceZ,
      diverges: persist.diverges,
      source:
        "TRIPPA RCT (Singapore): ~10% tracker wear at 12 mo; National Steps Challenge: <33% active at ~7 mo; UHC Motion 59% at 6 mo (vendor). Loss-framed device financing (RAND/Vitality Apple Watch) sustains 45–60% — band centred on gain-framed reality.",
      referenceClass: CALIBRATION_MODULE.referenceClass,
      legacyAnchorLow: LEGACY_PERSISTENCE_ANCHOR[0],
      legacyAnchorHigh: LEGACY_PERSISTENCE_ANCHOR[1],
    },
  ];
  if (lift) {
    anchors.push({
      metric: "Mean daily step lift (engaged)",
      rawValue: raw.meanStepLift,
      rawCI: raw.stepLiftCI,
      anchorLow: VERIFIED_STEP_LIFT_ANCHOR[0],
      anchorHigh: VERIFIED_STEP_LIFT_ANCHOR[1],
      calibratedValue: lift.posterior,
      posteriorCI: lift.posteriorCI,
      priorWeight: lift.priorWeight,
      divergenceZ: lift.divergenceZ,
      diverges: lift.diverges,
      source:
        "ACTIVE REWARD RCT: loss-framed incentives +1,368 steps/day (CI 571–2,164); Vitality Active Rewards verified cohorts show sustained activity rise.",
      referenceClass: CALIBRATION_MODULE.referenceClass,
      legacyAnchorLow: LEGACY_STEP_LIFT_ANCHOR[0],
      legacyAnchorHigh: LEGACY_STEP_LIFT_ANCHOR[1],
    });
  }

  const calibrated: BehaviorRates = {
    ...raw,
    enrollmentRate: enroll.posterior,
    enrollmentCI: enroll.posteriorCI,
    persistenceRate: persist.posterior,
    persistenceCI: persist.posteriorCI,
    meanStepLift: lift ? lift.posterior : raw.meanStepLift,
    stepLiftCI: lift ? lift.posteriorCI : raw.stepLiftCI,
    behaviorChangeRate: behaviorChange.posterior,
    behaviorChangeCI: behaviorChange.posteriorCI,
  };

  const weights = [enroll.priorWeight, persist.priorWeight, behaviorChange.priorWeight, ...(lift ? [lift.priorWeight] : [])];
  const meanPriorWeight = weights.reduce((s, v) => s + v, 0) / weights.length;

  const report: CalibrationReport = {
    method:
      "Precision-weighted Bayesian blend: the agent sample is evidence N(raw, sd² from the sample CI); the published band is a prior N(mid, ((high−low)/3.29)²). posterior = (τ_raw·raw + τ_prior·mid)/(τ_raw + τ_prior). The prior weight is DERIVED from the two precisions — more agents mean tighter evidence and less prior — and posterior CIs come from the posterior variance. Material agent-vs-literature disagreement (|z| ≥ 1.645) is reported as a finding, never silently shrunk away.",
    shrinkage: meanPriorWeight,
    priorTrust,
    divergenceFindings: divergenceFindings.length ? divergenceFindings : undefined,
    effectiveSampleSize: n,
    referenceClass: CALIBRATION_MODULE.referenceClass,
    referenceClasses: buildReferenceClasses(signal.signalId, isSteps),
    anchors,
  };

  return { calibrated, report };
}

// Mean prior weight for a typical proportion metric at sample size n — used
// for display/metadata where a single summary weight is needed.
export function calibrationPriorWeight(n: number, priorTrust = 1): number {
  // representative proportion p=0.3 with the steps enrollment band
  const p = 0.3;
  const sd = Math.sqrt((p * (1 - p)) / Math.max(1, n));
  const band = VERIFIED_ENROLLMENT_ANCHOR.steps;
  const priorSd = (band[1] - band[0]) / 3.29;
  const tauR = 1 / (sd * sd);
  const tauP = clamp(priorTrust, 0, 1) / (priorSd * priorSd);
  return tauP / (tauP + tauR);
}

function buildReferenceClasses(signalId: SignalId, isSteps: boolean): CalibrationReport["referenceClasses"] {
  const legacyAnchors = [
    {
      metric: "Enrollment rate",
      low: (LEGACY_ENROLLMENT_ANCHOR[signalId] ?? [0.12, 0.28])[0],
      high: (LEGACY_ENROLLMENT_ANCHOR[signalId] ?? [0.12, 0.28])[1],
      source: "Legacy unverified employer-wellness / RAND-KFF style programme reference class.",
    },
    {
      metric: "12-mo persistence (of enrollees)",
      low: LEGACY_PERSISTENCE_ANCHOR[0],
      high: LEGACY_PERSISTENCE_ANCHOR[1],
      source: "Legacy wearable/wellness retention literature.",
    },
  ];
  const verifiedAnchors = [
    {
      metric: "Enrollment rate",
      low: (VERIFIED_ENROLLMENT_ANCHOR[signalId] ?? [0.25, 0.45])[0],
      high: (VERIFIED_ENROLLMENT_ANCHOR[signalId] ?? [0.25, 0.45])[1],
      source: "Verified-device active-rewards uptake with sponsorship / subsidy.",
    },
    {
      metric: "12-mo persistence (of enrollees)",
      low: VERIFIED_PERSISTENCE_ANCHOR[0],
      high: VERIFIED_PERSISTENCE_ANCHOR[1],
      source: "TRIPPA / National Steps Challenge (SG) attrition evidence; loss-framed Vitality Apple Watch designs hold the upper end.",
    },
  ];
  if (isSteps) {
    legacyAnchors.push({
      metric: "Mean daily step lift (engaged)",
      low: LEGACY_STEP_LIFT_ANCHOR[0],
      high: LEGACY_STEP_LIFT_ANCHOR[1],
      source: "Legacy cash/wellness step-lift planning range.",
    });
    verifiedAnchors.push({
      metric: "Mean daily step lift (engaged)",
      low: VERIFIED_STEP_LIFT_ANCHOR[0],
      high: VERIFIED_STEP_LIFT_ANCHOR[1],
      source: "ACTIVE REWARD RCT + Vitality verified-device activity evidence.",
    });
  }
  return [
    {
      id: "legacy-unverified-wellness",
      label: "Legacy unverified wellness",
      active: false,
      evidenceScope: "literature-anchored",
      anchors: legacyAnchors,
    },
    {
      id: "verified-device-loss-framed",
      label: "Verified-device, loss-framed rewards",
      active: true,
      evidenceScope: "literature-anchored",
      anchors: verifiedAnchors,
    },
  ];
}
