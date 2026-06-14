import { ECONOMIC_ASSUMPTIONS } from "./assumptions";
import { presentValueRecurringAnnual } from "./discounting";

export const GROUP_PRODUCTIVITY_MODULE = {
  moduleName: "group-productivity",
  moduleVersion: "0.1.0",
};

export interface GroupProductivityEvaluation {
  enabled: boolean;
  value: number;
  groupTreated: number;
  groupFraction: number;
  productivityPerMemberUSD: number;
  attributionFactor: number;
  source: string;
}

export function evaluateGroupProductivity(effectiveTreated: number, horizonMonths: number): GroupProductivityEvaluation {
  const a = ECONOMIC_ASSUMPTIONS.groupProductivity;
  if (!a.enabled) {
    return {
      enabled: false,
      value: 0,
      groupTreated: 0,
      groupFraction: a.groupFraction,
      productivityPerMemberUSD: a.productivityPerMemberUSD,
      attributionFactor: a.attributionFactor,
      source: a.source,
    };
  }
  const groupTreated = Math.max(0, effectiveTreated) * Math.min(1, Math.max(0, a.groupFraction));
  const years = horizonMonths / 12;
  const annualValue = groupTreated * a.productivityPerMemberUSD * Math.min(1, Math.max(0, a.attributionFactor));
  return {
    enabled: true,
    value: presentValueRecurringAnnual(annualValue, years, ECONOMIC_ASSUMPTIONS.discounting.discountRatePct),
    groupTreated,
    groupFraction: a.groupFraction,
    productivityPerMemberUSD: a.productivityPerMemberUSD,
    attributionFactor: a.attributionFactor,
    source: a.source,
  };
}
