import type { SeededRunResult } from "./campaigns";

/**
 * Pre-computed simulation results for the demo.
 * Generated from real agent-based Monte Carlo runs.
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
      claimsSavingsP50: 4620,
      roiP50: 0.127,
      roiP5: -0.408,
      roiP95: 0.699,
      netValueP50: 769,
      valueCreatedP50: 6826,
      totalCostP50: 6057,
      downsideProbability: 0.377,
      rewardToSustainP50: 2988,
    },
    paybackMonths: null,
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
      claimsSavingsP50: 862,
      roiP50: -0.616,
      roiP5: -0.703,
      roiP95: -0.518,
      netValueP50: -5970,
      valueCreatedP50: 3722,
      totalCostP50: 9692,
      downsideProbability: 1.0,
      rewardToSustainP50: 3723,
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
      claimsSavingsP50: 3150,
      roiP50: 0.083,
      roiP5: -0.352,
      roiP95: 0.541,
      netValueP50: 420,
      valueCreatedP50: 5480,
      totalCostP50: 5060,
      downsideProbability: 0.42,
      rewardToSustainP50: 2640,
    },
    paybackMonths: 14,
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
      claimsSavingsP50: 479,
      roiP50: -0.328,
      roiP5: -0.585,
      roiP95: -0.025,
      netValueP50: -599,
      valueCreatedP50: 1227,
      totalCostP50: 1826,
      downsideProbability: 0.961,
      rewardToSustainP50: 633,
    },
    paybackMonths: null,
  },
];
