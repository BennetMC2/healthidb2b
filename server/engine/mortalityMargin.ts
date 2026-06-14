import { ECONOMIC_ASSUMPTIONS, LIFE_ASSUMPTIONS } from "./assumptions";
import { presentValueRecurringAnnual } from "./discounting";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const MORTALITY_MARGIN_MODULE = {
  moduleName: "life-mortality-margin",
  moduleVersion: "0.1.0",
};

export interface MortalityMarginEvaluation {
  enabled: boolean;
  value: number;
  baselineAnnualMortalityRate: number;
  sumAssured: number;
  // achieved relative all-cause mortality reduction credited to the programme
  relativeMortalityReduction: number;
  attributionFactor: number;
  highRiskRelativity: number;
  avoidedDeathsPerYear: number;
  source: string;
}

// Avoided death-claim payouts on the life book from the steps→mortality
// gradient (Paluch 2022), structured exactly like the claims bridge:
//   annual margin = treated × q_x × relativity × relReduction × attribution
//                   × doseAchievement × sumAssured
// then present-valued over the campaign horizon. Conservative by design:
// the relative reduction is per +1,000 ACHIEVED steps/day, capped, and the
// observational gradient takes the same 0.3 causal haircut as claims.
export function evaluateMortalityMargin(
  effectiveTreated: number,
  stepLift: number,
  doseAchievement: number,
  horizonMonths: number,
  targeted: boolean
): MortalityMarginEvaluation {
  const a = LIFE_ASSUMPTIONS.mortalityMargin;
  const base = {
    enabled: a.enabled,
    value: 0,
    baselineAnnualMortalityRate: LIFE_ASSUMPTIONS.baselineAnnualMortalityRate,
    sumAssured: LIFE_ASSUMPTIONS.sumAssured,
    relativeMortalityReduction: 0,
    attributionFactor: a.attributionFactor,
    highRiskRelativity: targeted ? a.highRiskRelativity : 1,
    avoidedDeathsPerYear: 0,
    source: a.source,
  };
  if (!a.enabled || effectiveTreated <= 0 || stepLift <= 0) return base;

  const relativeReduction = clamp((stepLift / 1000) * a.relativeReductionPer1kSteps, 0, a.maxRelativeReduction);
  const relativity = targeted ? a.highRiskRelativity : 1;
  const avoidedDeathsPerYear =
    Math.max(0, effectiveTreated) *
    LIFE_ASSUMPTIONS.baselineAnnualMortalityRate *
    relativity *
    relativeReduction *
    a.attributionFactor *
    clamp(doseAchievement, 0, 1);
  const years = horizonMonths / 12;
  const value = presentValueRecurringAnnual(
    avoidedDeathsPerYear * LIFE_ASSUMPTIONS.sumAssured,
    years,
    ECONOMIC_ASSUMPTIONS.discounting.discountRatePct
  );
  return {
    ...base,
    value,
    relativeMortalityReduction: relativeReduction,
    avoidedDeathsPerYear,
  };
}
