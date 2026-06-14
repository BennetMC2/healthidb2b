import type { SimState } from "./sim";
import { API_BASE } from "./sim";
import { buildDisplayResult } from "./displayResult";

export type CopilotMessage = { role: "user" | "assistant"; content: string };

const round = (n: number, dp = 4) => Math.round(n * 10 ** dp) / 10 ** dp;

// Compact, canonical context for the co-pilot — built from the SAME selector
// the panels read from, so the co-pilot can never cite a number the page
// doesn't show. Everything here is a computed run output, not LLM text.
export function buildCopilotContext(state: SimState, selectedReward: number | null): Record<string, unknown> | null {
  const finance = state.finance;
  if (!finance) return null;
  const plan = state.plan;
  const display = buildDisplayResult(finance, plan, selectedReward);
  const hero = state.calibratedBehavior ?? state.behavior;
  const m = state.methodology;
  const opt = finance.rewardOptimization;

  return {
    plan: plan
      ? {
          campaign: plan.campaignLabel,
          market: plan.marketLabel,
          bookSize: plan.bookSize,
          horizonMonths: plan.horizonMonths,
          agentSampleSize: plan.sampleSize,
          signals: plan.signals,
          targetHighRisk: !!plan.targetHighRisk,
          incentiveDesign: plan.incentiveDesign ?? null,
        }
      : null,
    selectedReward: {
      rewardPmpm: display.rewardPmpm,
      atRunReward: display.atRunReward,
      economicsConfigured: display.economicsConfigured,
      note: display.atRunReward
        ? "values are the deterministic median-scenario spine; bands are Monte Carlo P5-P95"
        : "lever is off the run reward; values are read off the simulated reward-response surface",
    },
    headline: {
      behaviorChangeFraction: round(display.behaviorFrac),
      behaviorBandP5P95: display.behaviorBandFrac,
      membersImproved: display.membersImproved,
      grossValueUsd: Math.round(display.grossUsd),
      claimsSavingsUsd: Math.round(display.claimsUsd),
      productivityValueUsd: Math.round(display.productivityUsd),
      retentionValueUsd: Math.round(display.retentionUsd),
      mortalityMarginUsd: Math.round(display.mortalityUsd),
      rewardCostUsd: Math.round(display.rewardCostUsd),
      adminCostUsd: Math.round(display.adminCostUsd),
      platformCostUsd: Math.round(display.platformCostUsd),
      totalCostUsd: Math.round(display.totalCostUsd),
      netValueUsd: Math.round(display.netUsd),
      netBandUsd: display.netBandUsd?.map((n) => Math.round(n)) ?? null,
      roiNetOverCost: display.roi != null ? round(display.roi) : null,
      roiBand: display.roiBand?.map((n) => round(n)) ?? null,
      probabilityNetNegative: display.downsideFrac != null ? round(display.downsideFrac) : null,
    },
    behaviour: hero
      ? {
          enrollmentRate: round(hero.enrollmentRate),
          persistenceRate12mo: round(hero.persistenceRate),
          behaviorChangeRate: round(hero.behaviorChangeRate),
          behaviorChangeCI: hero.behaviorChangeCI.map((n) => round(n)),
          agentSampleSize: hero.sampleSize,
          observedRewardArms: hero.doseResponseArms?.map((a) => ({
            rewardPmpm: a.rewardPmpm,
            n: a.n,
            engagedRate: round(a.engagedRate),
            isOfferArm: a.isOfferArm,
          })),
        }
      : null,
    calibration: state.calibration
      ? {
          method: state.calibration.method,
          priorWeight: round(state.calibration.shrinkage),
          divergenceFindings: state.calibration.divergenceFindings ?? [],
        }
      : null,
    claimsBreakdown: finance.claimsBreakdown,
    verdict: state.narrative
      ? {
          verdict: state.narrative.verdict,
          recommendation: state.narrative.recommendation,
          drivers: state.narrative.drivers,
          confidence: state.narrative.confidence,
        }
      : null,
    guardrails: finance.guardrails,
    sensitivityTopDrivers: finance.tornado.slice(0, 6),
    rewardCurve: opt.roiCurve.map((p) => ({
      rewardPmpm: p.reward,
      behaviorChange: round(p.behaviorChange),
      netValueUsd: Math.round(p.netValue),
      roi: round(p.roi, 3),
    })),
    rewardOptimization: {
      optimalRewardPmpm: opt.optimalReward,
      netPositiveRewardRangePmpm: opt.viableRewardRange,
      worksWellRangePmpm: opt.workWellRange,
      curveShapeSource: opt.shapeSource,
    },
    run: {
      decisionMode: state.mode,
      monteCarloIterations: finance.iterations,
      caveat: m?.caveat,
    },
    assumptions: m?.assumptions?.map((a) => ({
      label: a.label,
      value: a.value,
      unit: a.unit,
      source: a.source.slice(0, 220),
    })),
  };
}

export async function askCopilot(
  question: string,
  history: CopilotMessage[],
  context: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history, context }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Co-pilot request failed (${res.status})`);
  }
  const data = await res.json();
  const answer = String(data?.answer || "").trim();
  if (!answer) throw new Error("Co-pilot returned an empty answer.");
  return answer;
}
