import type { Market } from "@shared/schema";

export interface GlobalLifeSegment {
  id: string;
  label: string;
  ageBand: string;
  minAge: number;
  maxAge: number;
  weight: number;
  baselineSteps: number;
  mortalityPer1k: number;
  wearableOwnership: number;
  digitalReadiness: number;
  modifiabilityIndex: number;
  mortalityRiskIndex: number;
  rewardSensitivity: number;
  evidenceScope: "global" | "country" | "client";
  source: string;
}

const GLOBAL_SEGMENTS: GlobalLifeSegment[] = [
  {
    id: "young-active-digital",
    label: "Young active digital member",
    ageBand: "25-34",
    minAge: 25,
    maxAge: 34,
    weight: 0.2,
    baselineSteps: 7200,
    mortalityPer1k: 0.35,
    wearableOwnership: 0.62,
    digitalReadiness: 0.82,
    modifiabilityIndex: 0.28,
    mortalityRiskIndex: 0.72,
    rewardSensitivity: 0.34,
    evidenceScope: "global",
    source: "Illustrative global segment from WHO activity, GSMA/DataReportal digital-readiness and wearable-adoption research.",
  },
  {
    id: "midlife-sedentary-price-sensitive",
    label: "Midlife sedentary price-sensitive member",
    ageBand: "35-49",
    minAge: 35,
    maxAge: 49,
    weight: 0.24,
    baselineSteps: 4700,
    mortalityPer1k: 1.35,
    wearableOwnership: 0.34,
    digitalReadiness: 0.58,
    modifiabilityIndex: 0.78,
    mortalityRiskIndex: 1.45,
    rewardSensitivity: 0.82,
    evidenceScope: "global",
    source: "Illustrative global high-modifiability life segment; replace weights with client book distribution.",
  },
  {
    id: "midlife-high-stress-sleep-risk",
    label: "High-stress sleep-risk professional",
    ageBand: "35-54",
    minAge: 35,
    maxAge: 54,
    weight: 0.16,
    baselineSteps: 5600,
    mortalityPer1k: 1.65,
    wearableOwnership: 0.52,
    digitalReadiness: 0.72,
    modifiabilityIndex: 0.55,
    mortalityRiskIndex: 1.22,
    rewardSensitivity: 0.5,
    evidenceScope: "global",
    source: "Illustrative global sleep/stress modifiability segment informed by wearable sleep-risk literature.",
  },
  {
    id: "older-cardio-metabolic-risk",
    label: "Older cardio-metabolic risk member",
    ageBand: "50-64",
    minAge: 50,
    maxAge: 64,
    weight: 0.18,
    baselineSteps: 4300,
    mortalityPer1k: 4.2,
    wearableOwnership: 0.38,
    digitalReadiness: 0.48,
    modifiabilityIndex: 0.62,
    mortalityRiskIndex: 1.75,
    rewardSensitivity: 0.52,
    evidenceScope: "global",
    source: "Illustrative global cardio-metabolic risk segment; replace with mortality table and screening data.",
  },
  {
    id: "privacy-sensitive-moderate-risk",
    label: "Privacy-sensitive moderate-risk member",
    ageBand: "30-59",
    minAge: 30,
    maxAge: 59,
    weight: 0.12,
    baselineSteps: 5800,
    mortalityPer1k: 1.8,
    wearableOwnership: 0.46,
    digitalReadiness: 0.58,
    modifiabilityIndex: 0.58,
    mortalityRiskIndex: 1.12,
    rewardSensitivity: 0.44,
    evidenceScope: "global",
    source: "Illustrative privacy/data-sharing cohort for zero-custody reward design.",
  },
  {
    id: "non-wearable-access-gap",
    label: "Non-wearable access-gap member",
    ageBand: "35-64",
    minAge: 35,
    maxAge: 64,
    weight: 0.1,
    baselineSteps: 5000,
    mortalityPer1k: 2.4,
    wearableOwnership: 0.08,
    digitalReadiness: 0.42,
    modifiabilityIndex: 0.66,
    mortalityRiskIndex: 1.25,
    rewardSensitivity: 0.72,
    evidenceScope: "global",
    source: "Illustrative access-gap segment; device financing or phone-only path required.",
  },
];

const MARKET_STEP_ADJUSTMENT: Record<Market, number> = {
  HK: -150,
  SG: 300,
};

const MARKET_WEARABLE_ADJUSTMENT: Record<Market, number> = {
  HK: -0.04,
  SG: 0.02,
};

export function globalLifeSegments(market: Market): GlobalLifeSegment[] {
  return GLOBAL_SEGMENTS.map((segment) => ({
    ...segment,
    baselineSteps: Math.max(1800, Math.round(segment.baselineSteps + MARKET_STEP_ADJUSTMENT[market])),
    wearableOwnership: Math.min(0.95, Math.max(0.03, segment.wearableOwnership + MARKET_WEARABLE_ADJUSTMENT[market])),
    evidenceScope: "global",
  }));
}
