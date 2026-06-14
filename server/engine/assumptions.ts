import type { AssumptionItem, CampaignType, Market } from "@shared/schema";
import { activeAssumptionSet, assumptionSetRegister } from "./assumptionSets";

export const ECONOMIC_ASSUMPTIONS = activeAssumptionSet().economic;

export const LIFE_ASSUMPTIONS = activeAssumptionSet().lifeInsurance;

export const MARKET_WEARABLE_PRIOR: Record<Market, number> = activeAssumptionSet().marketWearablePrior;

export function assumptionRegister(campaign: CampaignType, market: Market): AssumptionItem[] {
  return assumptionSetRegister(campaign, market);
}
