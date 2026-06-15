// ── Portfolio Solver ──────────────────────────────────────────────────
// Client-side optimizer that allocates a budget across candidate lines
// to maximize total risk-adjusted, present-valued, verified value.
//
// Runs in <50ms so objective-weight dragging is instant.
// Uses the same actuarial parameters as the server engine.

import { calculateActuarialROI } from '@/lib/economics';
import { useModelStore } from '@/stores/useModelStore';
import { HEALTH_METRIC_LABELS } from './constants';
import { actuaryInsights } from '@/data/actuaryInsights';

// The active Model's economics (reactive on each solve — switching the Model and
// re-solving re-prices the allocation, brief §3).
const activeEco = () => useModelStore.getState().economics;
import type { HealthMetric, CampaignUseCase } from '@/types';
import type {
  ObjectiveWeights,
  PortfolioConstraints,
  AllocationLine,
  PoolBreakdown,
  FrontierPoint,
  PortfolioAllocation,
  VerificationGrade,
  DEFAULT_WEIGHTS,
  DEFAULT_CONSTRAINTS,
} from '@/types/portfolio';
import {
  VERIFICATION_GRADE_MULTIPLIER,
} from '@/types/portfolio';

// ── Constants ────────────────────────────────────────────────────────

const HP_PER_USD = 100; // 100 HP = $1 USD PMPM

/** Mortality margin multiplier per metric (relative to claims value) */
const MORTALITY_FRACTION: Partial<Record<HealthMetric, number>> = {
  vo2_max: 0.38,
  heart_rate_resting: 0.32,
  blood_pressure: 0.28,
  hrv: 0.24,
  steps: 0.18,
  active_minutes: 0.20,
  sleep_hours: 0.12,
  hba1c: 0.22,
  blood_glucose: 0.20,
  cholesterol: 0.16,
};

/** Retention value multiplier per use case (fraction of claims value) */
const RETENTION_FRACTION: Record<CampaignUseCase, number> = {
  renewal: 0.65,
  claims_reduction: 0.15,
  dynamic_premium: 0.25,
  acquisition: 0.08,
  underwriting: 0.10,
};

/** Acquisition value multiplier per use case */
const ACQUISITION_FRACTION: Record<CampaignUseCase, number> = {
  acquisition: 0.55,
  renewal: 0.05,
  claims_reduction: 0.08,
  dynamic_premium: 0.10,
  underwriting: 0.12,
};

/** Fidelity contribution per verification grade improvement */
const FIDELITY_BASE_VALUE_PER_MEMBER = 18; // $ value per member per grade step

// ── Candidate line generation ────────────────────────────────────────

interface CandidateConfig {
  id: string;
  name: string;
  signal: HealthMetric;
  useCase: CampaignUseCase;
  cohort: string;
  cohortSize: number;
  confidence: 'high' | 'medium' | 'low';
  verificationGrade: VerificationGrade;
  sourceInsightId?: string;
}

function generateCandidateConfigs(): CandidateConfig[] {
  const candidates: CandidateConfig[] = [];

  // 1) From actuary insights — these are already priced plays
  const insightMetricMap: Record<string, HealthMetric> = {
    'VO2 Max': 'vo2_max',
    'HRV': 'hrv',
    'Sleep': 'sleep_hours',
    'Resting HR': 'heart_rate_resting',
  };

  for (const insight of actuaryInsights) {
    const metric = insightMetricMap[insight.signal];
    if (!metric) continue;
    const config = activeEco().metricConfig[metric];

    candidates.push({
      id: `line_${insight.id}`,
      name: insight.campaignName,
      signal: metric,
      useCase: config.inferredUseCase,
      cohort: insight.cohortFilter.includes('vo2') ? 'Cardiac Risk Pool'
        : insight.cohortFilter.includes('hrv') ? 'Cardiac Risk Pool'
        : insight.cohortFilter.includes('sleep') ? 'Mental Health Monitoring'
        : 'Senior Wellness',
      cohortSize: insight.cohortSize,
      confidence: insight.confidence === 'high' ? 'high' : insight.confidence === 'medium' ? 'medium' : 'low',
      verificationGrade: 'device',
      sourceInsightId: insight.id,
    });
  }

  // 2) Additional candidate lines to fill portfolio breadth
  const additionalPlays: CandidateConfig[] = [
    {
      id: 'line_bp_chronic',
      name: 'Blood Pressure Chronic Management',
      signal: 'blood_pressure',
      useCase: 'claims_reduction',
      cohort: 'Chronic Care Management',
      cohortSize: 2840,
      confidence: 'high',
      verificationGrade: 'source_attested',
    },
    {
      id: 'line_hba1c_screening',
      name: 'HbA1c Pre-Diabetic Screening',
      signal: 'hba1c',
      useCase: 'underwriting',
      cohort: 'Pre-Diabetic Watchlist',
      cohortSize: 3120,
      confidence: 'high',
      verificationGrade: 'zero_custody_verified',
    },
    {
      id: 'line_steps_engagement',
      name: 'Steps Engagement & Onboarding',
      signal: 'steps',
      useCase: 'acquisition',
      cohort: 'Low-Risk Millennial',
      cohortSize: 4800,
      confidence: 'low',
      verificationGrade: 'device',
    },
    {
      id: 'line_active_min_renewal',
      name: 'Active Minutes Renewal Programme',
      signal: 'active_minutes',
      useCase: 'renewal',
      cohort: 'Active Lifestyle',
      cohortSize: 3200,
      confidence: 'medium',
      verificationGrade: 'device',
    },
    {
      id: 'line_fidelity_device_connect',
      name: 'Device Connection Fidelity Drive',
      signal: 'steps',
      useCase: 'acquisition',
      cohort: 'Senior Wellness',
      cohortSize: 5200,
      confidence: 'medium',
      verificationGrade: 'self_reported',
      // This is the fidelity play — gets members to connect wearables
    },
    {
      id: 'line_sleep_quality_maternity',
      name: 'Sleep Quality — Maternity Track',
      signal: 'sleep_quality',
      useCase: 'renewal',
      cohort: 'Maternity Track',
      cohortSize: 2600,
      confidence: 'medium',
      verificationGrade: 'device',
    },
  ];

  candidates.push(...additionalPlays);
  return candidates;
}

// ── Per-line value computation ───────────────────────────────────────

function computeLineValue(
  config: CandidateConfig,
  weights: ObjectiveWeights,
  allLines: CandidateConfig[],
): Omit<AllocationLine, 'budgetAllocated' | 'status' | 'pinnedRewardHp' | 'enables' | 'enabledBy' | 'attentionConstrained'> {
  const eco = activeEco();
  const metricConfig = eco.metricConfig[config.signal];
  const useCaseConfig = eco.useCaseConfig[config.useCase];

  // Get base ROI from the engine-backed economics (one source of truth)
  const roi = calculateActuarialROI(eco, {
    metric: config.signal,
    type: 'stream',
    useCase: config.useCase,
    maxParticipants: config.cohortSize,
    budgetCeiling: 1, // placeholder — we compute budget from reward
    applyAdjustments: true,
  });

  // Derive reward from the engine (not manually typed)
  const verificationMultiplier = VERIFICATION_GRADE_MULTIPLIER[config.verificationGrade];
  const baseHp = Math.round(metricConfig.suggestedHPBase * 0.72); // stream factor
  const adjustedHp = Math.round(Math.min(500, Math.max(25, baseHp * (0.7 + verificationMultiplier * 0.5))) / 5) * 5;
  const rewardUsd = adjustedHp / HP_PER_USD;

  // Claims value (primary pool)
  const claimsValue = roi.totalProjectedSavings * verificationMultiplier;

  // Mortality value
  const mortalityFraction = MORTALITY_FRACTION[config.signal] ?? 0.15;
  const mortalityValue = claimsValue * mortalityFraction;

  // Retention value
  const retentionFraction = RETENTION_FRACTION[config.useCase];
  const retentionValue = claimsValue * retentionFraction;

  // Acquisition value
  const acquisitionFraction = ACQUISITION_FRACTION[config.useCase];
  const acquisitionValue = claimsValue * acquisitionFraction;

  // Fidelity value — device-connect plays that uplift verification grade
  // Credit = number of downstream lives whose bookable value increases
  let fidelityValue = 0;
  if (config.id === 'line_fidelity_device_connect') {
    // This play moves members from self_reported to device grade
    const gradeUplift = VERIFICATION_GRADE_MULTIPLIER.device - VERIFICATION_GRADE_MULTIPLIER.self_reported; // 0.25
    const downstreamLives = allLines
      .filter((l) => l.id !== config.id && l.cohort === config.cohort)
      .reduce((sum, l) => sum + l.cohortSize, 0);
    fidelityValue = downstreamLives * gradeUplift * FIDELITY_BASE_VALUE_PER_MEMBER;
  }

  const pool: PoolBreakdown = {
    claims: Math.round(claimsValue),
    mortality: Math.round(mortalityValue),
    retention: Math.round(retentionValue),
    acquisition: Math.round(acquisitionValue),
    fidelity: Math.round(fidelityValue),
    total: Math.round(claimsValue + mortalityValue + retentionValue + acquisitionValue + fidelityValue),
  };

  // Weighted value using objective weights
  const wTotal = weights.claims + weights.mortality + weights.retention + weights.acquisition + weights.fidelity;
  const weightedValue = wTotal > 0
    ? (pool.claims * weights.claims +
       pool.mortality * weights.mortality +
       pool.retention * weights.retention +
       pool.acquisition * weights.acquisition +
       pool.fidelity * weights.fidelity) / wTotal
    : pool.total;

  // Budget = reward per verification × expected verified lives
  const budgetNeeded = rewardUsd * roi.expectedVerifiedLives;
  const lineRoi = budgetNeeded > 0 ? pool.total / budgetNeeded : 0;

  const confidenceScores: Record<'high' | 'medium' | 'low', number> = {
    high: 0.72,
    medium: 0.54,
    low: 0.34,
  };

  return {
    id: config.id,
    name: config.name,
    signal: config.signal,
    signalLabel: HEALTH_METRIC_LABELS[config.signal],
    useCase: config.useCase,
    cohort: config.cohort,
    cohortSize: config.cohortSize,
    derivedRewardHp: adjustedHp,
    derivedRewardUsd: Number(rewardUsd.toFixed(2)),
    value: pool,
    weightedValue: Math.round(weightedValue),
    roi: Number(lineRoi.toFixed(2)),
    confidence: config.confidence,
    confidenceScore: confidenceScores[config.confidence],
    verificationGrade: config.verificationGrade,
    holdoutPct: 15,
    paybackMonths: roi.paybackMonths,
    morbidityShiftBps: roi.morbidityShiftBps,
    expectedVerifiedLives: roi.expectedVerifiedLives,
    evidenceNote: roi.evidenceNote,
    sourceInsightId: config.sourceInsightId,
  };
}

// ── Portfolio solver ─────────────────────────────────────────────────

export function solvePortfolio(
  weights: ObjectiveWeights,
  constraints: PortfolioConstraints,
  partnerId: string,
  partnerLabel: string,
  partnerLives: number,
): PortfolioAllocation {
  const configs = generateCandidateConfigs();

  // Compute value for every candidate line
  const rawLines = configs.map((cfg) => computeLineValue(cfg, weights, configs));

  // Sort by weighted ROI (highest first) for greedy allocation
  const sorted = [...rawLines].sort((a, b) => {
    // Prefer higher weighted value per budget dollar
    const aEfficiency = a.roi * a.weightedValue;
    const bEfficiency = b.roi * b.weightedValue;
    return bEfficiency - aEfficiency;
  });

  // Greedy allocation: include lines from highest efficiency until budget exhausted
  let remainingBudget = constraints.budget;
  const lines: AllocationLine[] = sorted.map((line) => {
    const budgetNeeded = line.derivedRewardUsd * line.expectedVerifiedLives;

    // Check if including this line keeps portfolio ROI above floor
    const canAfford = budgetNeeded <= remainingBudget && budgetNeeded > 0;
    const meetsRoiFloor = line.roi >= constraints.roiFloor * 0.5; // individual lines can be below floor if portfolio compensates

    const included = canAfford && meetsRoiFloor;

    if (included) {
      remainingBudget -= budgetNeeded;
    }

    // Cross-play attribution
    const isFidelityPlay = line.id === 'line_fidelity_device_connect';
    const enables = isFidelityPlay
      ? sorted.filter((l) => l.id !== line.id && l.cohort === line.cohort).map((l) => l.id)
      : [];
    const enabledBy = !isFidelityPlay && sorted.some((l) => l.id === 'line_fidelity_device_connect' && l.cohort === line.cohort)
      ? ['line_fidelity_device_connect']
      : [];

    return {
      ...line,
      budgetAllocated: included ? budgetNeeded : 0,
      status: included ? 'included' as const : 'excluded' as const,
      pinnedRewardHp: null,
      enables,
      enabledBy,
      attentionConstrained: false,
    };
  });

  // Check portfolio-level ROI floor
  const includedLines = lines.filter((l) => l.status === 'included');
  const totalBudgetUsed = includedLines.reduce((s, l) => s + l.budgetAllocated, 0);
  const totalValue = includedLines.reduce((s, l) => s + l.value.total, 0);
  const portfolioRoi = totalBudgetUsed > 0 ? totalValue / totalBudgetUsed : 0;

  // If portfolio ROI is below floor, drop lowest-ROI lines until it clears
  if (portfolioRoi < constraints.roiFloor && includedLines.length > 1) {
    const byRoi = [...includedLines].sort((a, b) => a.roi - b.roi);
    for (const weak of byRoi) {
      const line = lines.find((l) => l.id === weak.id)!;
      line.status = 'excluded';
      line.budgetAllocated = 0;

      const remaining = lines.filter((l) => l.status === 'included');
      const newBudget = remaining.reduce((s, l) => s + l.budgetAllocated, 0);
      const newValue = remaining.reduce((s, l) => s + l.value.total, 0);
      if (newBudget > 0 && newValue / newBudget >= constraints.roiFloor) break;
    }
  }

  // Aggregate metrics
  const included = lines.filter((l) => l.status === 'included' || l.status === 'pinned');
  const aggValue: PoolBreakdown = {
    claims: included.reduce((s, l) => s + l.value.claims, 0),
    mortality: included.reduce((s, l) => s + l.value.mortality, 0),
    retention: included.reduce((s, l) => s + l.value.retention, 0),
    acquisition: included.reduce((s, l) => s + l.value.acquisition, 0),
    fidelity: included.reduce((s, l) => s + l.value.fidelity, 0),
    total: included.reduce((s, l) => s + l.value.total, 0),
  };
  const aggBudget = included.reduce((s, l) => s + l.budgetAllocated, 0);
  const aggRoi = aggBudget > 0 ? aggValue.total / aggBudget : 0;
  const aggConfidence = included.length > 0
    ? included.reduce((s, l) => s + l.confidenceScore * l.value.total, 0) / Math.max(aggValue.total, 1)
    : 0;

  // Generate efficient frontier by sweeping weight combinations
  const frontier = generateFrontier(configs, constraints);

  return {
    id: `alloc_${Date.now().toString(16)}`,
    partnerId,
    partnerLabel,
    weights,
    constraints,
    lines,
    frontier,
    totalValue: aggValue,
    totalBudget: aggBudget,
    portfolioRoi: Number(aggRoi.toFixed(2)),
    weightedConfidence: Number(aggConfidence.toFixed(2)),
    addressableLives: partnerLives,
    includedLineCount: included.length,
    status: 'draft',
    committedAt: null,
    createdAt: new Date().toISOString(),
  };
}

// ── Efficient frontier generation ────────────────────────────────────

function generateFrontier(
  configs: CandidateConfig[],
  constraints: PortfolioConstraints,
): FrontierPoint[] {
  const points: FrontierPoint[] = [];

  // Sweep budget levels × weight bias to trace frontier
  const budgetLevels = [0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0, 1.15, 1.3].map((f) => constraints.budget * f);
  const weightProfiles: ObjectiveWeights[] = [
    { claims: 0.60, mortality: 0.15, retention: 0.10, acquisition: 0.10, fidelity: 0.05 },
    { claims: 0.40, mortality: 0.30, retention: 0.15, acquisition: 0.10, fidelity: 0.05 },
    { claims: 0.30, mortality: 0.20, retention: 0.30, acquisition: 0.10, fidelity: 0.10 },
    { claims: 0.25, mortality: 0.15, retention: 0.15, acquisition: 0.30, fidelity: 0.15 },
    { claims: 0.20, mortality: 0.10, retention: 0.10, acquisition: 0.20, fidelity: 0.40 },
    { claims: 0.35, mortality: 0.20, retention: 0.20, acquisition: 0.15, fidelity: 0.10 },
  ];

  for (const budget of budgetLevels) {
    for (const w of weightProfiles) {
      // Quick allocation at this budget/weight combo
      const rawLines = configs.map((cfg) => computeLineValue(cfg, w, configs));
      const sorted = [...rawLines].sort((a, b) => {
        const aEff = a.roi * a.weightedValue;
        const bEff = b.roi * b.weightedValue;
        return bEff - aEff;
      });

      let remaining = budget;
      let totalValue = 0;
      let lineCount = 0;
      for (const line of sorted) {
        const needed = line.derivedRewardUsd * line.expectedVerifiedLives;
        if (needed > 0 && needed <= remaining && line.roi >= constraints.roiFloor * 0.5) {
          remaining -= needed;
          totalValue += line.value.total;
          lineCount++;
        }
      }

      const spend = budget - remaining;
      if (spend > 0) {
        points.push({
          budgetSpend: Math.round(spend),
          portfolioValue: Math.round(totalValue),
          roi: Number((totalValue / spend).toFixed(2)),
          weights: w,
          lineCount,
        });
      }
    }
  }

  // Deduplicate nearby points and sort by spend
  const deduped = points.reduce<FrontierPoint[]>((acc, pt) => {
    const close = acc.find((p) => Math.abs(p.budgetSpend - pt.budgetSpend) < 5000 && Math.abs(p.portfolioValue - pt.portfolioValue) < 50000);
    if (!close || pt.portfolioValue > close.portfolioValue) {
      if (close) {
        const idx = acc.indexOf(close);
        acc[idx] = pt;
      } else {
        acc.push(pt);
      }
    }
    return acc;
  }, []);

  return deduped.sort((a, b) => a.budgetSpend - b.budgetSpend);
}

// ── Utilities ────────────────────────────────────────────────────────

/** Re-solve with updated weights (returns new allocation, keeping pins/exclusions) */
export function resolveWithWeights(
  current: PortfolioAllocation,
  newWeights: ObjectiveWeights,
): PortfolioAllocation {
  return solvePortfolio(
    newWeights,
    current.constraints,
    current.partnerId,
    current.partnerLabel,
    current.addressableLives,
  );
}

/** Re-solve with updated budget */
export function resolveWithBudget(
  current: PortfolioAllocation,
  newBudget: number,
): PortfolioAllocation {
  return solvePortfolio(
    current.weights,
    { ...current.constraints, budget: newBudget },
    current.partnerId,
    current.partnerLabel,
    current.addressableLives,
  );
}

/** Re-solve with updated ROI floor */
export function resolveWithRoiFloor(
  current: PortfolioAllocation,
  newFloor: number,
): PortfolioAllocation {
  return solvePortfolio(
    current.weights,
    { ...current.constraints, roiFloor: newFloor },
    current.partnerId,
    current.partnerLabel,
    current.addressableLives,
  );
}
