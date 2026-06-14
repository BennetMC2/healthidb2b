import type { Backtest, CampaignType } from "@shared/schema";
import { maybeSignal } from "./registry";
import { signalToClaimsBridgeKey } from "./signalCompatibility";

export const LIFE_BACKTEST_MODULE = {
  moduleName: "default-life-backtest",
  moduleVersion: "0.2.0",
};

export interface BacktestExpectedRates {
  enrollmentRate: number;
  persistenceRate: number;
  claimsDeltaPct: number;
  rewardPerMemberPerMonth: number;
}

export interface BacktestComparisonInput {
  observed: Backtest;
  expected?: Partial<BacktestExpectedRates>;
}

export interface BacktestResidual {
  metric: "enrollment" | "persistence" | "claims_delta" | "reward_pmpm";
  expected: number;
  observed: number;
  residual: number;
  residualPctOfExpected: number | null;
  severity: "ok" | "watch" | "drift";
}

export interface BacktestComparisonResult {
  validationStatus: "insufficient_data" | "within_tolerance" | "watch" | "drift";
  residuals: BacktestResidual[];
  recommendedUpdates: string[];
}

const DEFAULT_EXPECTED_BY_CAMPAIGN: Record<CampaignType, BacktestExpectedRates> = {
  steps: { enrollmentRate: 0.24, persistenceRate: 0.36, claimsDeltaPct: 0.03, rewardPerMemberPerMonth: 4 },
  vo2max: { enrollmentRate: 0.2, persistenceRate: 0.3, claimsDeltaPct: 0.035, rewardPerMemberPerMonth: 6 },
  sleep: { enrollmentRate: 0.18, persistenceRate: 0.28, claimsDeltaPct: 0.018, rewardPerMemberPerMonth: 4 },
  bp_screening: { enrollmentRate: 0.16, persistenceRate: 0.34, claimsDeltaPct: 0.025, rewardPerMemberPerMonth: 5 },
  hba1c_screening: { enrollmentRate: 0.15, persistenceRate: 0.32, claimsDeltaPct: 0.028, rewardPerMemberPerMonth: 5 },
};

export function expectedBacktestRates(campaign: string): BacktestExpectedRates {
  const signal = maybeSignal(campaign);
  const key = signal ? signalToClaimsBridgeKey(signal.signalId) : "vo2max";
  return DEFAULT_EXPECTED_BY_CAMPAIGN[key];
}

export function compareLifeBacktest({ observed, expected }: BacktestComparisonInput): BacktestComparisonResult {
  const base = { ...expectedBacktestRates(observed.campaign), ...(expected ?? {}) };
  const residuals: BacktestResidual[] = [
    residual("enrollment", base.enrollmentRate, observed.observedEnrollment / 10000),
    residual("persistence", base.persistenceRate, observed.observedPersistence / 10000),
    residual("claims_delta", base.claimsDeltaPct, observed.observedClaimsDeltaPct / 10000),
    residual("reward_pmpm", base.rewardPerMemberPerMonth, observed.rewardPerMemberPerMonth),
  ];
  const worst = residuals.some((r) => r.severity === "drift")
    ? "drift"
    : residuals.some((r) => r.severity === "watch")
      ? "watch"
      : "within_tolerance";

  return {
    validationStatus: observed.bookSize > 0 ? worst : "insufficient_data",
    residuals,
    recommendedUpdates: recommendations(residuals),
  };
}

function residual(metric: BacktestResidual["metric"], expected: number, observed: number): BacktestResidual {
  const delta = observed - expected;
  const residualPctOfExpected = expected === 0 ? null : delta / Math.abs(expected);
  const abs = Math.abs(residualPctOfExpected ?? delta);
  const severity = abs >= 0.35 ? "drift" : abs >= 0.18 ? "watch" : "ok";
  return {
    metric,
    expected,
    observed,
    residual: delta,
    residualPctOfExpected,
    severity,
  };
}

function recommendations(residuals: BacktestResidual[]) {
  const updates: string[] = [];
  if (residuals.some((r) => r.metric === "enrollment" && r.severity !== "ok")) {
    updates.push("Review reward-response enrolment elasticity before using this campaign as calibration evidence.");
  }
  if (residuals.some((r) => r.metric === "persistence" && r.severity !== "ok")) {
    updates.push("Review persistence/drop-off assumptions and whether reward timing matched the modelled design.");
  }
  if (residuals.some((r) => r.metric === "claims_delta" && r.severity !== "ok")) {
    updates.push("Review claims/morbidity bridge and lag assumptions with an actuary before updating the assumption set.");
  }
  if (residuals.some((r) => r.metric === "reward_pmpm" && r.severity !== "ok")) {
    updates.push("Confirm reward cost basis; observed incentive spend differs materially from expected design.");
  }
  return updates.length ? updates : ["Observed campaign is within tolerance against current planning defaults; keep accumulating evidence before recalibration."];
}
