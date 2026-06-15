import type { AssumptionItem, CampaignType, Market } from "@shared/schema";
import type { EconomicAssumptions, LifeInsuranceAssumptions } from "./assumptionSets";
import { assumptionSetRegister } from "./assumptionSets";
import { currentSet, liveProxy } from "./modelContext";

// These read the active request's Model (brief §3 "switch model → numbers
// change"). Outside a request they fall back to the Model 1 evidence floor, so
// existing behaviour is preserved. All `.foo` / spread call-sites are unchanged.
export const ECONOMIC_ASSUMPTIONS: EconomicAssumptions = liveProxy(() => currentSet().economic);

export const LIFE_ASSUMPTIONS: LifeInsuranceAssumptions = liveProxy(() => currentSet().lifeInsurance);

export const MARKET_WEARABLE_PRIOR: Record<Market, number> = liveProxy(() => currentSet().marketWearablePrior);

export function assumptionRegister(campaign: CampaignType, market: Market): AssumptionItem[] {
  return assumptionSetRegister(campaign, market, currentSet());
}
