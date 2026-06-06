import { METRIC_ACTUARIAL_CONFIG } from '@/utils/actuarial';
import type { HealthMetric } from '@/types';
import type {
  HorizonOutput, MonthlyProjection, LeverBreakdown,
  BridgeStep, BehaviourLeverId, ScenarioAssumptions,
  InterventionId, RewardConfig,
} from '../types';
import { CLINICAL_RULES } from '../data/interventions';
import { BEHAVIOUR_LEVERS } from '../data/behaviourLevers';
import { BEHAVIOUR_LEVER_LABELS } from '../constants';
import { calculateRewards, scaleRewardCostForHorizon, deriveRewardBudget } from './rewardCalculator';
import { computeConfidence } from './confidenceModel';

const EVIDENCE_RANGE: Record<'high' | 'medium' | 'low', [number, number]> = {
  high: [0.78, 1.28],
  medium: [0.55, 1.40],
  low: [0.35, 1.55],
};

interface ROIInput {
  cohortSize: number;
  interventionIds: InterventionId[];
  rewardConfig: RewardConfig;
  rewardCeilingPct: number;
  assumptions: ScenarioAssumptions;
  leverBaselines: Record<BehaviourLeverId, number>;
  leverTargets: Record<BehaviourLeverId, number>;
  availableSignals: HealthMetric[];
  availableSources: string[];
}

/**
 * Calculate ROI for a single time horizon.
 */
export function calculateHorizonROI(
  input: ROIInput,
  horizonMonths: number,
): HorizonOutput {
  const { cohortSize, interventionIds, rewardConfig, rewardCeilingPct, assumptions, availableSignals } = input;

  // Get all clinical rules for active interventions
  const activeRules = CLINICAL_RULES.filter((r) => interventionIds.includes(r.interventionId));
  const affectedMetrics = [...new Set(activeRules.map((r) => r.signalId))];

  // Calculate reward engagement metrics (participation/completion/persistence)
  const rewardCalc = calculateRewards(rewardConfig, cohortSize);
  const scaledRewardCost = scaleRewardCostForHorizon(rewardCalc.totalRewardCost, horizonMonths, assumptions.dropoutRate);

  // ── Phase 1: Gross Value (reward-independent) ──────────────────────

  let totalMorbidityBps = 0;
  let totalClaimsImpact = 0;
  let weightedLatency = 0;

  for (const rule of activeRules) {
    const metricConfig = METRIC_ACTUARIAL_CONFIG[rule.signalId];
    if (!metricConfig) continue;

    const effectiveImprovement = rule.effectSize *
      assumptions.realizationFactor;

    const effectiveMonths = Math.max(0, horizonMonths - metricConfig.outcomeLatencyMonths);
    const timeAdjustedImpact = effectiveImprovement * (effectiveMonths / horizonMonths);

    const benefitingLives = Math.round(cohortSize * rewardCalc.adjustedParticipation * rewardCalc.adjustedCompletion);
    const claimsImpactPerMetric = metricConfig.baselineClaimCostPerMember *
      timeAdjustedImpact *
      benefitingLives *
      (1 - assumptions.claimsInflation * horizonMonths / 12);

    totalClaimsImpact += claimsImpactPerMetric;
    totalMorbidityBps += Math.round(timeAdjustedImpact * 10000 * 0.35);
    weightedLatency += metricConfig.outcomeLatencyMonths;
  }

  // Overlap discount for multiple metrics
  const overlapDiscount = affectedMetrics.length <= 1 ? 1 : Math.max(0.58, 1 - (affectedMetrics.length - 1) * 0.12);
  totalClaimsImpact *= overlapDiscount;
  totalMorbidityBps = Math.round(totalMorbidityBps * overlapDiscount);

  // Lapse-rate impact: better engagement → lower lapse
  const lapseRateImpact = -rewardCalc.adjustedPersistence * 0.03 * cohortSize;

  // Cross-sell uplift: engaged members more likely to cross-sell
  const crossSellUplift = rewardCalc.adjustedParticipation * 0.015 * cohortSize * 180;

  // Gross value = total value of behaviour change before reward deduction
  const grossClaimsImpact = totalClaimsImpact;
  const grossTotalValue = totalClaimsImpact + crossSellUplift;

  // ── Phase 2: Reward Ceiling → Net ROI ──────────────────────────────

  // Derive reward budget from ceiling
  const rewardBudget = deriveRewardBudget(
    grossTotalValue,
    rewardCeilingPct,
    cohortSize,
    rewardCalc.adjustedParticipation,
    horizonMonths,
  );

  // Cap actual reward cost at the ceiling
  const cappedRewardCost = Math.min(scaledRewardCost, rewardBudget.totalBudget);

  // Net ROI = gross value − capped reward cost (always positive when ceiling < 100%)
  const netROI = grossTotalValue - cappedRewardCost;

  // Payback months
  const monthlySavings = grossTotalValue / horizonMonths;
  const paybackMonths = monthlySavings > 0
    ? Math.min(horizonMonths, Math.round(cappedRewardCost / monthlySavings))
    : horizonMonths;

  // Mortality delta (conservative estimate)
  const avgEffectSize = activeRules.length > 0
    ? activeRules.reduce((sum, r) => sum + r.effectSize, 0) / activeRules.length
    : 0;
  const mortalityDelta = avgEffectSize * assumptions.realizationFactor * overlapDiscount * 0.25;

  // Engagement score
  const engagementScore = Math.min(100, Math.round(
    rewardCalc.adjustedParticipation * 40 +
    rewardCalc.adjustedCompletion * 35 +
    rewardCalc.adjustedPersistence * 25,
  ));

  // Actuary confidence
  const confidence = computeConfidence(
    availableSignals,
    input.availableSources as never[],
    interventionIds,
    assumptions.realizationFactor,
  );

  // Scenario range (applied to net ROI using capped cost)
  const bestEvidence = activeRules.length > 0
    ? (activeRules.some((r) => {
        const mc = METRIC_ACTUARIAL_CONFIG[r.signalId];
        return mc && mc.evidenceLevel === 'high';
      }) ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    : 'low';
  const [lowFactor, highFactor] = EVIDENCE_RANGE[bestEvidence];

  // Monthly projections (tracking gross savings and reward cost separately)
  const monthlyProjections: MonthlyProjection[] = [];
  let cumulativeSavings = 0;
  const avgLatency = activeRules.length > 0 ? weightedLatency / activeRules.length : 6;

  for (let m = 1; m <= horizonMonths; m++) {
    const t = m - avgLatency * 0.5;
    const rampFactor = 1 / (1 + Math.exp(-0.6 * t));
    const retention = Math.pow(1 - assumptions.dropoutRate / 12, m);

    const monthlySav = (totalClaimsImpact / horizonMonths) * rampFactor * retention;
    const monthlyReward = (cappedRewardCost / horizonMonths) * retention;
    cumulativeSavings += monthlySav;

    const confidenceBandWidth = (1 - confidence.compositeConfidence) * monthlySav * 0.8;

    monthlyProjections.push({
      month: m,
      projectedSavings: Math.round(monthlySav),
      cumulativeSavings: Math.round(cumulativeSavings),
      rewardCost: Math.round(monthlyReward),
      netValue: Math.round(monthlySav - monthlyReward),
      confidenceLow: Math.round(monthlySav - confidenceBandWidth),
      confidenceHigh: Math.round(monthlySav + confidenceBandWidth),
      engagementRate: Math.round(rewardCalc.adjustedParticipation * retention * 100) / 100,
    });
  }

  return {
    netROI: Math.round(netROI),
    projectedClaimsImpact: Math.round(totalClaimsImpact),
    grossClaimsImpact: Math.round(grossClaimsImpact),
    grossTotalValue: Math.round(grossTotalValue),
    recommendedRewardBudget: rewardBudget.totalBudget,
    derivedBudgetPerMember: rewardBudget.budgetPerMember,
    morbidityShiftBps: totalMorbidityBps,
    mortalityDelta: Math.round(mortalityDelta * 10000) / 10000,
    paybackMonths,
    lapseRateImpact: Math.round(lapseRateImpact),
    crossSellUplift: Math.round(crossSellUplift),
    engagementScore,
    actuaryConfidence: confidence.compositeConfidence,
    scenarioRangeLow: Math.round(netROI * lowFactor),
    scenarioRangeHigh: Math.round(netROI * highFactor),
    monthlyProjections,
  };
}

/**
 * Compute per-lever ROI breakdown.
 */
export function calculateLeverBreakdowns(
  interventionIds: InterventionId[],
  leverBaselines: Record<BehaviourLeverId, number>,
  leverTargets: Record<BehaviourLeverId, number>,
  totalClaimsImpact: number,
  realizationFactor: number,
): LeverBreakdown[] {
  const levers = BEHAVIOUR_LEVERS;
  const activeRules = CLINICAL_RULES.filter((r) => interventionIds.includes(r.interventionId));

  const breakdowns: LeverBreakdown[] = [];
  let totalWeight = 0;

  for (const lever of levers) {
    const leverRules = activeRules.filter((r) => lever.metrics.includes(r.signalId));
    if (leverRules.length === 0) continue;

    const avgEffect = leverRules.reduce((sum, r) => sum + r.effectSize, 0) / leverRules.length;
    const movement = (leverTargets[lever.id] ?? 0) - (leverBaselines[lever.id] ?? 0);
    const weight = avgEffect * Math.abs(movement);
    totalWeight += weight;

    const bestEvidence = leverRules.some((r) => {
      const mc = METRIC_ACTUARIAL_CONFIG[r.signalId];
      return mc && mc.evidenceLevel === 'high';
    }) ? 'high' : leverRules.some((r) => {
      const mc = METRIC_ACTUARIAL_CONFIG[r.signalId];
      return mc && mc.evidenceLevel === 'medium';
    }) ? 'medium' : 'low';

    breakdowns.push({
      lever: lever.id,
      label: BEHAVIOUR_LEVER_LABELS[lever.id],
      signalMovement: Math.round(movement * 100) / 100,
      savingsContribution: weight, // will normalize below
      evidenceLevel: bestEvidence as 'high' | 'medium' | 'low',
      confidenceScore: Math.round(avgEffect * realizationFactor * 100) / 100,
    });
  }

  // Normalize savings contributions
  if (totalWeight > 0) {
    for (const bd of breakdowns) {
      bd.savingsContribution = Math.round((bd.savingsContribution / totalWeight) * totalClaimsImpact);
    }
  }

  return breakdowns.sort((a, b) => b.savingsContribution - a.savingsContribution);
}

/**
 * Build health-to-value bridge steps.
 */
export function buildHealthToValueBridge(
  horizonOutput: HorizonOutput,
  leverBreakdowns: LeverBreakdown[],
  _interventionIds: InterventionId[],
): BridgeStep[] {
  const totalSignalMovement = leverBreakdowns.reduce((sum, b) => sum + Math.abs(b.signalMovement), 0);

  return [
    {
      stage: 'signal_movement',
      label: 'Signal Movement',
      description: 'Measured improvement in health signals from wearable and clinical data.',
      value: Math.round(totalSignalMovement * 100),
      unit: 'pts improvement',
      confidence: 0.75,
      evidenceIds: ['banach_2023', 'mandsager_2018'],
    },
    {
      stage: 'behaviour_change',
      label: 'Behaviour Change',
      description: 'Sustained behaviour modification across activity, sleep, and clinical markers.',
      value: horizonOutput.engagementScore,
      unit: 'engagement score',
      confidence: 0.65,
      evidenceIds: ['patel_2019', 'glisic_2026'],
    },
    {
      stage: 'risk_factor',
      label: 'Risk-Factor Movement',
      description: 'Projected shift in modifiable risk factors based on observed behaviour changes.',
      value: horizonOutput.morbidityShiftBps,
      unit: 'bps morbidity shift',
      confidence: 0.55,
      evidenceIds: ['ekelund_2020', 'hilton_2022'],
    },
    {
      stage: 'health_outcome',
      label: 'Health Outcome Hypothesis',
      description: 'Projected mortality and morbidity delta from sustained risk-factor improvement.',
      value: Math.round(horizonOutput.mortalityDelta * 10000),
      unit: 'bps mortality delta',
      confidence: 0.45,
      evidenceIds: ['discovery_vitality', 'munich_re_klarity_2025'],
    },
    {
      stage: 'claims_impact',
      label: 'Claims / Lapse / LTV Impact',
      description: 'Projected financial impact on claims costs, lapse rates, and customer lifetime value.',
      value: horizonOutput.projectedClaimsImpact,
      unit: 'USD projected savings',
      confidence: 0.40,
      evidenceIds: ['discovery_vitality'],
    },
    {
      stage: 'net_value',
      label: 'Net Insurer Value',
      description: 'Net ROI after deducting reward programme costs and accounting for cross-sell uplift.',
      value: horizonOutput.netROI,
      unit: 'USD net ROI',
      confidence: horizonOutput.actuaryConfidence,
      evidenceIds: [],
    },
  ];
}
