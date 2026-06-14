import type { Market } from "@shared/schema";

// ---------------------------------------------------------------------------
// Structured persona source data. Every dimension carries the constraints
// needed to keep generated members coherent: occupations have market-specific
// labels, age ranges, income bands, physical-activity levels and schedule
// pressure; districts have population weights and income profiles; family,
// health-history and attitude options are gated by age, sex, job type and
// traits so a persona never contradicts itself.
// ---------------------------------------------------------------------------

export type IncomeBand = "low" | "middle" | "high";
export type ActivityLevel = "sedentary" | "light" | "active" | "physical";

type MarketLabel = string | Record<Market, string>;

export function marketLabel(label: MarketLabel, market: Market): string {
  return typeof label === "string" ? label : label[market];
}

export interface OccupationProfile {
  label: MarketLabel;
  minAge: number;
  maxAge: number;
  income: IncomeBand;
  activity: ActivityLevel;
  /** added to the time-pressure mean (long hours, shifts, early starts) */
  timeBias?: number;
  /** added to the tech-savvy mean */
  techBias?: number;
  /** probability the holder is female (default 0.5) */
  femaleShare?: number;
}

export const OCCUPATIONS: OccupationProfile[] = [
  { label: { HK: "MTR train captain", SG: "SMRT train captain" }, minAge: 24, maxAge: 55, income: "middle", activity: "light", timeBias: 0.1, femaleShare: 0.2 },
  { label: "secondary-school teacher", minAge: 24, maxAge: 60, income: "middle", activity: "light", timeBias: 0.1, femaleShare: 0.6 },
  { label: "freelance graphic designer", minAge: 23, maxAge: 45, income: "middle", activity: "sedentary", techBias: 0.15 },
  { label: "hospital nurse on rotating shifts", minAge: 23, maxAge: 58, income: "middle", activity: "active", timeBias: 0.18, femaleShare: 0.8 },
  { label: "investment-bank analyst", minAge: 23, maxAge: 34, income: "high", activity: "sedentary", timeBias: 0.22, techBias: 0.08 },
  { label: { HK: "dim-sum restaurant owner", SG: "hawker stall owner" }, minAge: 35, maxAge: 68, income: "middle", activity: "physical", timeBias: 0.2 },
  { label: "construction site foreman", minAge: 30, maxAge: 60, income: "middle", activity: "physical", femaleShare: 0.06 },
  { label: { HK: "civil servant in the Housing Department", SG: "civil servant at HDB" }, minAge: 25, maxAge: 60, income: "middle", activity: "sedentary", timeBias: -0.05 },
  { label: { HK: "taxi driver", SG: "Grab driver" }, minAge: 28, maxAge: 68, income: "low", activity: "sedentary", timeBias: 0.1, femaleShare: 0.1 },
  { label: "retail assistant at a mall cosmetics counter", minAge: 20, maxAge: 45, income: "low", activity: "light", femaleShare: 0.8 },
  { label: "software engineer at a fintech", minAge: 23, maxAge: 45, income: "high", activity: "sedentary", techBias: 0.2, femaleShare: 0.3 },
  { label: "accountant at a Big-Four firm", minAge: 23, maxAge: 50, income: "high", activity: "sedentary", timeBias: 0.18 },
  { label: "logistics warehouse supervisor", minAge: 28, maxAge: 58, income: "middle", activity: "physical", timeBias: 0.08, femaleShare: 0.2 },
  { label: "kindergarten principal", minAge: 35, maxAge: 62, income: "middle", activity: "light", femaleShare: 0.85 },
  { label: "physiotherapist", minAge: 25, maxAge: 55, income: "middle", activity: "active", femaleShare: 0.6 },
  { label: "insurance claims adjuster", minAge: 25, maxAge: 58, income: "middle", activity: "sedentary" },
  { label: "barista and part-time student", minAge: 18, maxAge: 26, income: "low", activity: "light", techBias: 0.1 },
  { label: { HK: "container-terminal crane operator", SG: "PSA port crane operator" }, minAge: 28, maxAge: 58, income: "middle", activity: "light", timeBias: 0.12, femaleShare: 0.05 },
  { label: "hotel concierge", minAge: 22, maxAge: 55, income: "low", activity: "light", timeBias: 0.08 },
  { label: { HK: "wet-market fishmonger", SG: "wet-market stallholder" }, minAge: 35, maxAge: 70, income: "low", activity: "physical", timeBias: 0.15 },
  { label: "air-cargo dispatcher", minAge: 25, maxAge: 55, income: "middle", activity: "light", timeBias: 0.1 },
  { label: "university research assistant", minAge: 22, maxAge: 34, income: "low", activity: "sedentary", techBias: 0.1 },
  { label: "social worker", minAge: 24, maxAge: 58, income: "middle", activity: "light", femaleShare: 0.7 },
  { label: "pharmacist", minAge: 25, maxAge: 58, income: "middle", activity: "light", femaleShare: 0.6 },
  { label: "real-estate agent", minAge: 25, maxAge: 60, income: "middle", activity: "light", timeBias: 0.1 },
  { label: "airline cabin crew", minAge: 21, maxAge: 45, income: "middle", activity: "active", timeBias: 0.15, femaleShare: 0.7 },
  { label: "licensed electrician", minAge: 22, maxAge: 60, income: "middle", activity: "physical", femaleShare: 0.04 },
  { label: "data-entry clerk at a clinic", minAge: 20, maxAge: 55, income: "low", activity: "sedentary", femaleShare: 0.7 },
  { label: "boutique gym personal trainer", minAge: 21, maxAge: 40, income: "middle", activity: "physical", techBias: 0.05 },
  { label: "stay-at-home parent doing gig translation", minAge: 28, maxAge: 50, income: "low", activity: "light", timeBias: 0.12, femaleShare: 0.8 },
  { label: "semi-retired tailor", minAge: 55, maxAge: 75, income: "low", activity: "light" },
  { label: "night-shift security guard", minAge: 35, maxAge: 70, income: "low", activity: "light", timeBias: 0.12, femaleShare: 0.12 },
];

export interface DistrictProfile {
  name: string;
  /** rough relative residential population weight */
  weight: number;
  income: IncomeBand | "mixed";
}

export const DISTRICTS: Record<Market, DistrictProfile[]> = {
  HK: [
    { name: "Sham Shui Po", weight: 0.06, income: "low" },
    { name: "Kwun Tong", weight: 0.09, income: "low" },
    { name: "Wong Tai Sin", weight: 0.05, income: "low" },
    { name: "Tin Shui Wai", weight: 0.04, income: "low" },
    { name: "Mong Kok", weight: 0.05, income: "mixed" },
    { name: "Tuen Mun", weight: 0.07, income: "mixed" },
    { name: "Yuen Long", weight: 0.08, income: "mixed" },
    { name: "Sha Tin", weight: 0.09, income: "middle" },
    { name: "Tai Po", weight: 0.05, income: "middle" },
    { name: "Tsuen Wan", weight: 0.06, income: "middle" },
    { name: "Tseung Kwan O", weight: 0.06, income: "middle" },
    { name: "North Point", weight: 0.04, income: "middle" },
    { name: "Kennedy Town", weight: 0.03, income: "high" },
    { name: "Quarry Bay", weight: 0.04, income: "high" },
    { name: "Wan Chai", weight: 0.03, income: "high" },
    { name: "Happy Valley", weight: 0.02, income: "high" },
    { name: "Sai Kung", weight: 0.03, income: "high" },
  ],
  SG: [
    { name: "Bedok", weight: 0.07, income: "middle" },
    { name: "Tampines", weight: 0.07, income: "middle" },
    { name: "Jurong West", weight: 0.07, income: "middle" },
    { name: "Woodlands", weight: 0.07, income: "mixed" },
    { name: "Yishun", weight: 0.06, income: "mixed" },
    { name: "Hougang", weight: 0.06, income: "middle" },
    { name: "Sengkang", weight: 0.07, income: "middle" },
    { name: "Punggol", weight: 0.05, income: "middle" },
    { name: "Ang Mo Kio", weight: 0.05, income: "mixed" },
    { name: "Toa Payoh", weight: 0.04, income: "mixed" },
    { name: "Clementi", weight: 0.04, income: "middle" },
    { name: "Bukit Batok", weight: 0.04, income: "middle" },
    { name: "Pasir Ris", weight: 0.04, income: "middle" },
    { name: "Queenstown", weight: 0.03, income: "mixed" },
    { name: "Serangoon", weight: 0.04, income: "middle" },
    { name: "Bishan", weight: 0.03, income: "high" },
    { name: "Bukit Timah", weight: 0.02, income: "high" },
    { name: "Tanjong Pagar", weight: 0.02, income: "high" },
  ],
};

// How strongly an occupation's income band pulls toward each district profile.
export const DISTRICT_INCOME_MATCH: Record<IncomeBand, Record<IncomeBand | "mixed", number>> = {
  low: { low: 1.7, mixed: 1.2, middle: 0.8, high: 0.1 },
  middle: { low: 0.7, mixed: 1.1, middle: 1.3, high: 0.5 },
  high: { low: 0.1, mixed: 0.7, middle: 0.9, high: 2.2 },
};

export interface FamilyProfile {
  label: MarketLabel;
  minAge: number;
  maxAge: number;
  /** added to the time-pressure mean (young kids, caregiving, single parenting) */
  timeBias?: number;
}

export const FAMILY: FamilyProfile[] = [
  { label: "single, lives alone", minAge: 22, maxAge: 78 },
  { label: "married with two young kids", minAge: 28, maxAge: 46, timeBias: 0.14 },
  { label: "lives with elderly parents and is a primary caregiver", minAge: 30, maxAge: 60, timeBias: 0.15 },
  { label: "newly married, no children yet", minAge: 24, maxAge: 38 },
  { label: "single parent of a teenager", minAge: 34, maxAge: 55, timeBias: 0.16 },
  { label: "empty-nester, kids at university overseas", minAge: 48, maxAge: 70, timeBias: -0.05 },
  { label: "shares a flat with two roommates", minAge: 21, maxAge: 34 },
  { label: "married, partner works overseas during the week", minAge: 28, maxAge: 55, timeBias: 0.08 },
  { label: "divorced, co-parenting on weekends", minAge: 32, maxAge: 56, timeBias: 0.06 },
  { label: "lives with spouse and a toddler plus a domestic helper", minAge: 28, maxAge: 45, timeBias: 0.08 },
  { label: { HK: "engaged, saving for a first flat", SG: "engaged, saving for a BTO flat" }, minAge: 24, maxAge: 36, timeBias: 0.04 },
  { label: "widowed, lives with adult son", minAge: 58, maxAge: 80 },
];

export interface HealthHistoryProfile {
  text: string;
  minAge?: number;
  maxAge?: number;
  sex?: "M" | "F";
  /** only plausible for desk-bound work */
  requiresSedentary?: boolean;
  /** >0: more likely in high-mortality segments; <0: more likely in low-risk segments */
  riskBias?: number;
}

export const HEALTH_HISTORY: HealthHistoryProfile[] = [
  { text: "no chronic conditions, rarely sees a doctor", maxAge: 52, riskBias: -1 },
  { text: "borderline high blood pressure flagged at last checkup", minAge: 35, riskBias: 0.8 },
  { text: "type-2 diabetes in the family, slightly elevated HbA1c", minAge: 30, riskBias: 0.8 },
  { text: "recovered from a sports knee injury two years ago", maxAge: 48, riskBias: -0.3 },
  { text: "mild asthma, otherwise active" },
  { text: "overweight per BMI, trying to lose 8kg", riskBias: 0.5 },
  { text: "chronic lower-back pain from desk work", minAge: 28, requiresSedentary: true, riskBias: 0.2 },
  { text: "high cholesterol, on statins", minAge: 42, riskBias: 1 },
  { text: "history of poor sleep and stress", riskBias: 0.2 },
  { text: "former smoker, quit 3 years ago", minAge: 30, riskBias: 0.6 },
  { text: "generally fit, runs a 10K occasionally", maxAge: 60, riskBias: -1 },
  { text: "recovering from burnout, doctor advised more movement", minAge: 25, maxAge: 55 },
  { text: "gestational diabetes in last pregnancy", sex: "F", minAge: 26, maxAge: 45, riskBias: 0.4 },
  { text: "no issues but a recent scare prompted a checkup", minAge: 35, riskBias: 0.3 },
];

type TraitKey = "motivation" | "conscientiousness" | "timePressure" | "techSavvy" | "healthAnxiety" | "financialPressure";

export interface AttitudeProfile {
  text: string;
  /** trait affinities: positive = more likely when the trait is high */
  affinity?: Partial<Record<TraitKey, number>>;
  /** only plausible for already-active members */
  minSteps?: number;
  /** only plausible when the health history is genuinely concerning */
  requiresRiskyHistory?: boolean;
}

export const ATTITUDE: AttitudeProfile[] = [
  { text: "skeptical of insurer 'free' offers, assumes a catch", affinity: { motivation: -0.5 } },
  { text: "loves gadgets and quantified-self tracking", affinity: { techSavvy: 1 } },
  { text: "too busy to think about it, will probably ignore the email", affinity: { timePressure: 1, motivation: -0.3 } },
  { text: "genuinely wants to get healthier but lacks a system", affinity: { motivation: 0.9 } },
  { text: "competitive — motivated by leaderboards and streaks", affinity: { motivation: 0.4, techSavvy: 0.4 } },
  { text: "privacy-conscious, wary of sharing health data" },
  { text: "price-driven, will do it only if the cash is worth the hassle", affinity: { financialPressure: 1 } },
  { text: "already exercises and resents being told to", affinity: { motivation: 0.5 }, minSteps: 7000 },
  { text: "guilt-prone about health, easily nudged by reminders", affinity: { healthAnxiety: 0.8 } },
  { text: "cynical that rewards are too small to bother", affinity: { motivation: -0.4, financialPressure: -0.4 } },
  { text: "early-adopter who tries every new app then drops it", affinity: { techSavvy: 0.7, conscientiousness: -0.6 } },
  { text: "pragmatic — will engage if it fits the existing routine", affinity: { conscientiousness: 0.6 } },
  { text: "anxious about a recent diagnosis, looking for structure", affinity: { healthAnxiety: 1 }, requiresRiskyHistory: true },
  { text: "indifferent; signs up and forgets immediately", affinity: { motivation: -0.8 } },
];

/** baseline daily-step shift implied by what the job physically demands */
export const ACTIVITY_STEP_ADJUSTMENT: Record<ActivityLevel, number> = {
  sedentary: -900,
  light: 0,
  active: 900,
  physical: 2300,
};

/** financial-pressure mean implied by the occupation's income band */
export const INCOME_FINANCIAL_PRESSURE_MEAN: Record<IncomeBand, number> = {
  low: 0.68,
  middle: 0.5,
  high: 0.3,
};

/** wearable-ownership shift implied by disposable income */
export const INCOME_WEARABLE_ADJUSTMENT: Record<IncomeBand, number> = {
  low: -0.06,
  middle: 0,
  high: 0.08,
};
