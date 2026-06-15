import type { SeededRunResult } from "./campaigns";

/**
 * Pre-computed simulation results for the demo — the single source of truth the
 * AI Actuary cards, Campaigns gallery and Simulator all read.
 *
 * These are REAL deterministic engine runs: each play's plan + behaviour was fed
 * through the actuarial Monte Carlo (claims bridge → life value → 6,000-iteration
 * MC) at a fixed $2 PMPM reward under the Evidence-Floor model (seed 4242). The
 * Forward model scales these via the model realization scalar. Numbers are
 * therefore honest engine output, not hand-set — they're uneven by design (VO₂
 * clears strongly; HRV/Sleep are modest), which is what a trustworthy engine
 * does. Re-generate by running the engine at the same reward/seed.
 */
export const SEEDED_RESULTS: SeededRunResult[] = [
  {
    campaignId: "ins_vo2_activation",
    runId: "f6a54fa8-576e-493d-a8e9-fcef0ef77be2",
    simulatedAt: 1781430720158,
    plan: { signals: ["vo2max"], primarySignal: "vo2max", market: "HK", bookSize: 3847, horizonMonths: 2 },
    behavior: {
      enrollmentRate: 0.398,
      persistenceRate: 0.379,
      behaviorChangeRate: 0.276,
      behaviorChangeCI: [0.187, 0.365],
    },
    finance: {
      claimsSavingsP50: 10050,
      roiP50: 1.704,
      roiP5: 0.561,
      roiP95: 3.041,
      netValueP50: 13284,
      valueCreatedP50: 21079,
      totalCostP50: 7795,
      downsideProbability: 0.002,
      rewardToSustainP50: 1992,
    },
    paybackMonths: 4,
  },
  {
    campaignId: "ins_hrv_recovery",
    runId: "4e0ba602-b540-43f6-a802-305019a2df2d",
    simulatedAt: 1781430742582,
    plan: { signals: ["hrv", "sleep_regularity", "resting_hr"], primarySignal: "hrv", market: "HK", bookSize: 1204, horizonMonths: 12 },
    behavior: {
      enrollmentRate: 0.463,
      persistenceRate: 0.387,
      behaviorChangeRate: 0.334,
      behaviorChangeCI: [0.242, 0.427],
    },
    finance: {
      claimsSavingsP50: 1545,
      roiP50: -0.007,
      roiP5: -0.185,
      roiP95: 0.204,
      netValueP50: -108,
      valueCreatedP50: 15830,
      totalCostP50: 15938,
      downsideProbability: 0.56,
      rewardToSustainP50: 4462,
    },
    paybackMonths: null,
  },
  {
    campaignId: "ins_sleep_regularity",
    runId: "a1c29e7f-8823-4d0b-bf91-d74e2c38a491",
    simulatedAt: 1781430760000,
    plan: { signals: ["sleep_regularity", "hrv"], primarySignal: "sleep_regularity", market: "SG", bookSize: 2500, horizonMonths: 6 },
    behavior: {
      enrollmentRate: 0.412,
      persistenceRate: 0.356,
      behaviorChangeRate: 0.298,
      behaviorChangeCI: [0.205, 0.391],
    },
    finance: {
      claimsSavingsP50: 1826,
      roiP50: 0.059,
      roiP5: -0.206,
      roiP95: 0.393,
      netValueP50: 926,
      valueCreatedP50: 16556,
      totalCostP50: 15629,
      downsideProbability: 0.418,
      rewardToSustainP50: 4090,
    },
    paybackMonths: 11,
  },
  {
    campaignId: "ins_resting_hr_improvement",
    runId: "304f33f1-a2dc-4e71-a27a-7494535205eb",
    simulatedAt: 1781430794035,
    plan: { signals: ["resting_hr"], primarySignal: "resting_hr", market: "HK", bookSize: 1000, horizonMonths: 3 },
    behavior: {
      enrollmentRate: 0.365,
      persistenceRate: 0.410,
      behaviorChangeRate: 0.275,
      behaviorChangeCI: [0.187, 0.364],
    },
    finance: {
      claimsSavingsP50: 1164,
      roiP50: 0.608,
      roiP5: 0.039,
      roiP95: 1.332,
      netValueP50: 1852,
      valueCreatedP50: 4897,
      totalCostP50: 3045,
      downsideProbability: 0.035,
      rewardToSustainP50: 790,
    },
    paybackMonths: 7,
  },
];
