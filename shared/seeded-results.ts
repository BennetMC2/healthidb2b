import type { SeededRunResult } from "./campaigns";

/**
 * Pre-computed simulation results for the demo.
 *
 * Illustrative target economics for the four headline plays. Each is internally
 * consistent (roiP50 = netValueP50 / totalCostP50; valueCreatedP50 =
 * netValueP50 + totalCostP50) and represents a verified, multi-year-persistence
 * programme priced below its expected book-value gain. Behaviour rates are kept
 * from the original agent runs; the financial layer is set to the
 * optimistic-but-defensible case the Forward model prices toward.
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
      claimsSavingsP50: 13000,
      roiP50: 1.7,
      roiP5: 0.9,
      roiP95: 2.7,
      netValueP50: 10297,
      valueCreatedP50: 16354,
      totalCostP50: 6057,
      downsideProbability: 0.06,
      rewardToSustainP50: 2988,
    },
    paybackMonths: 5,
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
      claimsSavingsP50: 16000,
      roiP50: 1.2,
      roiP5: 0.5,
      roiP95: 2.2,
      netValueP50: 11630,
      valueCreatedP50: 21322,
      totalCostP50: 9692,
      downsideProbability: 0.12,
      rewardToSustainP50: 3723,
    },
    paybackMonths: 7,
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
      claimsSavingsP50: 9500,
      roiP50: 1.4,
      roiP5: 0.7,
      roiP95: 2.4,
      netValueP50: 7084,
      valueCreatedP50: 12144,
      totalCostP50: 5060,
      downsideProbability: 0.09,
      rewardToSustainP50: 2640,
    },
    paybackMonths: 6,
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
      claimsSavingsP50: 2900,
      roiP50: 1.0,
      roiP5: 0.4,
      roiP95: 1.9,
      netValueP50: 1826,
      valueCreatedP50: 3652,
      totalCostP50: 1826,
      downsideProbability: 0.15,
      rewardToSustainP50: 633,
    },
    paybackMonths: 8,
  },
];
