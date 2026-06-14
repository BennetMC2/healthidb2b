import type {
  BehaviorRates,
  ResolvedPlan,
  MonteCarloResult,
  Distribution,
  TornadoBar,
  GuardrailFlag,
  CampaignType,
  RewardOptimization,
  RewardRoiPoint,
  ResponseCurvePoint,
  IncentiveDesign,
} from "@shared/schema";
import { HP_PER_USD } from "@shared/schema";
import { ECONOMIC_ASSUMPTIONS } from "./assumptions";
import { engagementAt, fitResponseCurve, rewardForEngagement, type ResponseCurveParams } from "./rewardResponse";
import { evalChain, type ChainParams } from "./financial";
import { buildClaimsBreakdown, CLAIMS_BRIDGE_DOSE_RESPONSE_PARAMS, weightedClaimsBaseline } from "./claimsBridge";
import { buildGuardrails, buildTornado } from "./uncertainty";
import { calibrationPriorWeight } from "./calibration";

export const DOSE_RESPONSE_PARAMS = CLAIMS_BRIDGE_DOSE_RESPONSE_PARAMS;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number, mean: number, sd: number) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
}
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function sdFromCI(ci: [number, number]) {
  return Math.max(1e-4, (ci[1] - ci[0]) / (2 * 1.96));
}

function buildDistribution(values: number[], bins = 40): Distribution {
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const width = (max - min) / bins || 1;
  const histogram = Array.from({ length: bins }, (_, i) => ({ x: min + width * (i + 0.5), count: 0 }));
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    histogram[idx].count++;
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const step = Math.max(1, Math.floor(values.length / 1000));
  const sample = values.filter((_, i) => i % step === 0);
  return { values: sample, histogram, p5: q(0.05), p50: q(0.5), p95: q(0.95), mean };
}

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

export function runMonteCarlo(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  iterations = 6000,
  seedOverride?: number,
  incentiveDesign?: IncentiveDesign,
  // mean prior weight from the calibration report (derived, per-run); falls
  // back to a representative value when a run bypasses calibration (tests)
  calibrationWeight?: number
): MonteCarloResult {
  const seed = seedOverride ?? ((Math.floor(Math.random() * 0xffffffff) ^ (Date.now() >>> 0)) >>> 0);
  const rng = mulberry32(seed);
  const N = plan.bookSize;

  const enrollSd = sdFromCI(behavior.enrollmentCI);
  const persistSd = sdFromCI(behavior.persistenceCI);
  const behaviorSd = sdFromCI(behavior.behaviorChangeCI);
  // step-lift sampling only matters for steps campaigns; for everything else the
  // achieved dose is carried by effortIntensity. Do NOT default a zero lift to a
  // fictional number — a genuine zero must stay zero.
  const liftSd = behavior.stepLiftCI[1] > 0 ? sdFromCI(behavior.stepLiftCI) : Math.max(1e-4, behavior.meanStepLift * 0.25);
  const effortSd = sdFromCI(behavior.effortIntensityCI);

  const claimsBaseline = weightedClaimsBaseline();
  const curve = fitResponseCurve(plan, behavior);

  const grossValueArr: number[] = [];
  const netValueArr: number[] = [];
  const claimsSavingsArr: number[] = [];
  const productivityArr: number[] = [];
  const retentionArr: number[] = [];
  const rewardToSustainArr: number[] = [];
  const adminCostArr: number[] = [];
  const platformCostArr: number[] = [];
  const totalCostArr: number[] = [];
  const roiArr: number[] = [];
  const behaviorFrac: number[] = [];
  const behaviorMembers: number[] = [];
  const derivedRewardArr: number[] = [];

  // pre-store params per iteration for the reward-curve sweep (use a subset)
  // Sweep $0..$85/member/month (= $0..$1,020/member/year) so the air-miles-scale
  // reward thesis is actually on the axis. 35 points, ~$2.5/mo resolution.
  const sweepRewards = Array.from({ length: 35 }, (_, i) => i * 2.5); // 0..85 /mo
  // Always include the EXACT run reward as a swept point so the curve carries
  // a point that reconciles 1:1 with the headline spine (no interpolation gap
  // when the configured reward is off the $2.50 grid, e.g. $8.50).
  const exactRewards = [plan.assumedOfferPmpm, incentiveDesign?.configured ? incentiveDesign.rewardPmpm : NaN];
  for (const r of exactRewards) {
    if (Number.isFinite(r) && r >= 0 && !sweepRewards.includes(r)) sweepRewards.push(r);
  }
  sweepRewards.sort((a, b) => a - b);
  const sweepNet: number[][] = sweepRewards.map(() => []);
  const sweepRoi: number[][] = sweepRewards.map(() => []);
  // Sweep each reward level under the SAME admin/platform economics as the run
  // itself — only the reward varies. Otherwise the curve and the headline
  // disagree at the configured reward.
  const sweepIncentive = (rew: number): IncentiveDesign | undefined =>
    incentiveDesign?.configured ? { ...incentiveDesign, rewardPmpm: rew } : undefined;

  for (let i = 0; i < iterations; i++) {
    // (a) agent-sample sampling error: enrollment, persistence, behaviour, lift
    const persistence = clamp(gaussian(rng, behavior.persistenceRate, persistSd), 0.02, 0.98);
    const behaviorFracDraw = clamp(gaussian(rng, behavior.behaviorChangeRate, behaviorSd), 0.005, 0.9);
    const stepLift = Math.max(0, gaussian(rng, behavior.meanStepLift, liftSd));
    const effortIntensity = clamp(gaussian(rng, behavior.meanEffortIntensity, effortSd), 0, 1);
    const lapseReduction = clamp(gaussian(rng, ECONOMIC_ASSUMPTIONS.lapseReduction, 0.006), 0, 0.05);
    const ltv = gaussian(rng, ECONOMIC_ASSUMPTIONS.ltvPerMember, 400);

    const cp: ChainParams = {
      enrollment: clamp(gaussian(rng, behavior.enrollmentRate, enrollSd), 0.01, 0.95),
      persistence,
      stepLift,
      effortIntensity,
      lapseReduction,
      ltv,
      rng,
    };

    // Evaluate the chain at the assumed offer context (this is the as-observed scenario).
    const r = evalChain(plan, cp, plan.assumedOfferPmpm, behaviorFracDraw, incentiveDesign);
    grossValueArr.push(r.value);
    netValueArr.push(r.netValue);
    claimsSavingsArr.push(r.claims);
    productivityArr.push(r.productivity);
    retentionArr.push(r.retention);
    rewardToSustainArr.push(r.rewardToSustain);
    adminCostArr.push(r.adminCost);
    platformCostArr.push(r.platformCost);
    totalCostArr.push(r.totalCost);
    roiArr.push(r.roi);
    behaviorFrac.push(behaviorFracDraw);
    behaviorMembers.push(behaviorFracDraw * N);

    // Reward BACK-CALCULATION: the reward needed to sustain THIS iteration's
    // engaged fraction on the calibrated response curve.
    derivedRewardArr.push(clamp(rewardForEngagement(behaviorFracDraw, curve), 0, 30));

    // sweep the reward axis for the optimisation curve
    for (let s = 0; s < sweepRewards.length; s++) {
      const rew = sweepRewards[s];
      const eng = engagementAt(rew, curve);
      const rr = evalChain(plan, cp, rew, eng, sweepIncentive(rew));
      sweepNet[s].push(rr.netValue);
      sweepRoi[s].push(rr.roi);
    }
  }

  const claimsDist = buildDistribution(claimsSavingsArr.map((v) => Math.max(0, v)));

  const grossDist = buildDistribution(grossValueArr);
  const economicsConfigured = !!incentiveDesign?.configured;
  const netDist = buildDistribution(economicsConfigured ? netValueArr : grossValueArr);
  const behaviorDist = buildDistribution(behaviorFrac);
  const behaviorMembersDist = buildDistribution(behaviorMembers);

  // ----- Single scenario spine -----
  // Every headline point estimate comes from ONE deterministic evaluation of
  // the value chain at the calibrated central rates, so claims + productivity
  // + retention = gross, gross − costs = net, and net / costs = ROI all
  // reconcile EXACTLY across every panel. Monte Carlo supplies the
  // uncertainty bands (P5/P95, distributions) around this spine — its medians
  // are never mixed into the point estimates (sum of component medians ≠
  // median of sums).
  const medianCp: ChainParams = {
    enrollment: behavior.enrollmentRate,
    persistence: behavior.persistenceRate,
    stepLift: behavior.meanStepLift,
    effortIntensity: behavior.meanEffortIntensity,
    lapseReduction: ECONOMIC_ASSUMPTIONS.lapseReduction,
    ltv: ECONOMIC_ASSUMPTIONS.ltvPerMember,
  };
  const medianEval = evalChain(plan, medianCp, plan.assumedOfferPmpm, behavior.behaviorChangeRate, incentiveDesign);

  const claimsSavingsP50 = Math.max(0, medianEval.claims);
  const productivityP50 = Math.max(0, medianEval.productivity);
  const retentionValueP50 = Math.max(0, medianEval.retention);
  const mortalityValueP50 = Math.max(0, medianEval.mortality);
  const valueCreatedP50 = claimsSavingsP50 + productivityP50 + retentionValueP50 + mortalityValueP50;
  const rewardToSustainP50 = economicsConfigured ? medianEval.rewardToSustain : 0;
  const adminCostP50 = economicsConfigured ? medianEval.adminCost : 0;
  const platformCostP50 = economicsConfigured ? medianEval.platformCost : 0;
  const totalCostP50 = economicsConfigured ? medianEval.totalCost : 0;
  const netValueP50 = economicsConfigured ? valueCreatedP50 - totalCostP50 : valueCreatedP50;
  const roiP50 = economicsConfigured && totalCostP50 > 0 ? netValueP50 / totalCostP50 : 0;
  const roiSorted = [...roiArr].sort((a, b) => a - b);
  const roiQ = (q: number) => economicsConfigured
    ? roiSorted[Math.min(roiSorted.length - 1, Math.floor(q * roiSorted.length))]
    : 0;
  const roiP5 = roiQ(0.05);
  const roiP95 = roiQ(0.95);
  const downsideProbability = economicsConfigured
    ? netValueArr.filter((v) => v < 0).length / Math.max(1, netValueArr.length)
    : 0;

  // ----- Reward response curve (value created vs reward) -----
  const roiCurve: RewardRoiPoint[] = sweepRewards.map((rew, s) => {
    const netSorted = [...sweepNet[s]].sort((a, b) => a - b);
    const roiSortedAt = [...sweepRoi[s]].sort((a, b) => a - b);
    const pNet = (q: number) => netSorted[Math.min(netSorted.length - 1, Math.floor(q * netSorted.length))];
    const pRoi = (q: number) => roiSortedAt[Math.min(roiSortedAt.length - 1, Math.floor(q * roiSortedAt.length))];
    const eng = engagementAt(rew, curve);
    return {
      reward: rew,
      rewardHp: rew * HP_PER_USD,
      engagement: eng,
      behaviorChange: eng, // engaged share == meaningfully-improving share at this reward
      members: 0, // filled below
      claimsSaved: 0, // filled below
      productivityValue: 0, // filled below
      retentionValue: 0, // filled below
      mortalityValue: 0, // filled below
      valueCreated: 0, // filled below
      rewardToSustain: 0, // filled below
      adminCost: 0,
      platformCost: 0,
      totalCost: 0,
      netValue: 0,
      roi: 0,
      // ROI percentiles are RATIOS (net/cost); net-value percentiles are USD.
      roiP50: pRoi(0.5),
      roiP5: pRoi(0.05),
      roiP95: pRoi(0.95),
      netValueP5: pNet(0.05),
      netValueP95: pNet(0.95),
    };
  });
  // members / claims / retention / reward-to-sustain per reward point (median-params pass)
  fillRoiMultiples(plan, behavior, curve, claimsBaseline, roiCurve, incentiveDesign);

  // Net-value band: rewards whose net economics are within 80% of peak net value.
  let peakIdx = 0;
  let bestValue = -Infinity;
  for (let s = 0; s < roiCurve.length; s++) {
    const pt = roiCurve[s];
    if (pt.reward <= 0) continue;
    if (pt.netValue > bestValue) {
      bestValue = pt.netValue;
      peakIdx = s;
    }
  }
  const bandFloor = bestValue * 0.8;
  const bandIdx = roiCurve
    .map((pt, i) => (pt.reward > 0 && pt.netValue > 0 && pt.netValue >= bandFloor ? i : -1))
    .filter((i) => i >= 0);
  const workWellRange: [number, number] | null =
    bandIdx.length > 0
      ? [roiCurve[bandIdx[0]].reward, roiCurve[bandIdx[bandIdx.length - 1]].reward]
      : null;
  // Illustrative anchor = the band's lower edge (lowest reward that already works
  // well). Used only as the slider default; the story leads with curve + band.
  const optIdx = bandIdx.length > 0 ? bandIdx[0] : peakIdx;
  const optimalReward = roiCurve[optIdx].reward;
  const optimalRoi = roiCurve[optIdx].netValue;

  const viableIdx = roiCurve
    .map((pt, i) => (pt.reward > 0 && pt.netValue >= 0 ? i : -1))
    .filter((i) => i >= 0);
  const viableRewardRange: [number, number] | null =
    viableIdx.length > 0 ? [roiCurve[viableIdx[0]].reward, roiCurve[viableIdx[viableIdx.length - 1]].reward] : null;

  // ----- Claims breakdown for the headline value figure (median-params, at assumed offer context) -----
  const maxAllInCostP50 = valueCreatedP50;
  const maxRewardPmpmP50 = Math.max(
    0,
    valueCreatedP50 / Math.max(1, plan.bookSize * plan.horizonMonths * Math.max(0.01, behavior.behaviorChangeRate))
  );

  // The breakdown waterfall is built from the SAME spine evaluation, so the
  // executive read-out, the tiles and the calculation drawer all agree.
  const claimsBreakdown = buildClaimsBreakdown(plan, behavior, medianEval, incentiveDesign);

  const responseCurve: ResponseCurvePoint[] = sweepRewards.map((rew) => ({
    reward: rew,
    engagement: engagementAt(rew, curve),
  }));

  const derivedSorted = [...derivedRewardArr].sort((a, b) => a - b);
  const dq = (q: number) => derivedSorted[Math.min(derivedSorted.length - 1, Math.floor(q * derivedSorted.length))];
  const rewardOptimization: RewardOptimization = {
    floor: curve.floor,
    cap: curve.cap,
    k: curve.k,
    shapeSource: curve.shapeSource,
    responseCurve,
    roiCurve,
    optimalReward,
    optimalRoi,
    recommendedRewardIndex: optIdx,
    workWellRange,
    viableRewardRange,
    derivedReward: dq(0.5),
    derivedRewardHp: dq(0.5) * HP_PER_USD,
    derivedRewardLow: dq(0.05),
    derivedRewardHigh: dq(0.95),
    derivedEngagement: behavior.behaviorChangeRate,
  };

  const tornado = buildTornado(plan, behavior, curve, claimsBaseline);
  const guardrails = buildGuardrails(
    plan,
    behavior,
    netDist,
    rewardOptimization,
    economicsConfigured,
    maxAllInCostP50,
    maxRewardPmpmP50
  );

  return {
    seed,
    iterations,
    rewardLevelsSwept: sweepRewards.length,
    // each iteration evaluates the value chain at the assumed offer context + every swept reward level
    scenariosExplored: iterations * (1 + sweepRewards.length),
    behaviorChange: behaviorDist,
    behaviorChangeMembers: behaviorMembersDist,
    grossValue: grossDist,
    netRoi: netDist,
    netValue: netDist,
    claimsSavings: claimsDist,
    claimsSavingsP50,
    retentionValueP50,
    mortalityValueP50,
    valueCreatedP50,
    rewardToSustainP50,
    adminCostP50,
    platformCostP50,
    totalCostP50,
    netValueP50,
    roiP50,
    roiP5,
    roiP95,
    downsideProbability,
    effectiveSampleSize: behavior.sampleSize,
    calibrationWeight: calibrationWeight ?? calibrationPriorWeight(behavior.sampleSize),
    economicsConfigured,
    incentiveDesign: economicsConfigured ? incentiveDesign : undefined,
    hpPerUsd: HP_PER_USD,
    evidenceCollectionCount: (plan.signals ?? [plan.primarySignal ?? plan.campaign])
      .map((id) => plan.signalDefinitions?.find((s) => s.signalId === id))
      .filter((s) => s?.evidenceTier === "Experimental").length,
    maxAllInCostP50,
    maxRewardPmpmP50,
    roiAvailable: economicsConfigured,
    claimsBreakdown,
    rewardOptimization,
    tornado,
    guardrails,
  };
}

// deterministic median-params pass to populate roi multiples along the curve
function fillRoiMultiples(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  curve: { floor: number; cap: number; k: number },
  claimsBaseline: number,
  roiCurve: RewardRoiPoint[],
  incentiveDesign?: IncentiveDesign
) {
  const cp: ChainParams = {
    enrollment: behavior.enrollmentRate,
    persistence: behavior.persistenceRate,
    stepLift: behavior.meanStepLift,
    effortIntensity: behavior.meanEffortIntensity,
    lapseReduction: ECONOMIC_ASSUMPTIONS.lapseReduction,
    ltv: ECONOMIC_ASSUMPTIONS.ltvPerMember,
  };
  for (const pt of roiCurve) {
    const r = evalChain(
      plan,
      cp,
      pt.reward,
      pt.engagement,
      incentiveDesign?.configured ? { ...incentiveDesign, rewardPmpm: pt.reward } : undefined
    );
    pt.members = Math.round(r.engagedMembers);
    pt.claimsSaved = Math.max(0, r.claims);
    pt.productivityValue = Math.max(0, r.productivity);
    pt.retentionValue = Math.max(0, r.retention);
    pt.mortalityValue = Math.max(0, r.mortality);
    pt.valueCreated = Math.max(0, r.value);
    pt.rewardToSustain = Math.max(0, r.rewardToSustain);
    pt.adminCost = Math.max(0, r.adminCost);
    pt.platformCost = Math.max(0, r.platformCost);
    pt.totalCost = Math.max(0, r.totalCost);
    pt.netValue = r.netValue;
    pt.roi = r.roi;
  }
}
