// ---------------------------------------------------------------------------
// Engine constants — key economic parameters from the active assumption set,
// shared between server engine and client cockpit. Derived from
// EVIDENCE_ASSUMPTION_SET v1.0.0 in server/engine/assumptionSets.ts.
// ---------------------------------------------------------------------------

/** Active assumption set metadata */
export const ENGINE_ASSUMPTION_SET_META = {
  id: "healthid-life-v1-evidence",
  version: "1.0.0",
  label: "HealthID evidence-anchored assumptions (HK/SG)",
  status: "draft" as const,
  source: "Evidence pass (June 2026): published RCTs, meta-analyses, regulator statistics.",
};

/** Claims baselines per signal type (USD/member/year) */
export const ENGINE_CLAIMS_BASELINE: Record<string, number> = {
  steps: 900,
  vo2max: 900,
  sleep: 880,
  bp_screening: 950,
  hba1c_screening: 1000,
};

/** Claims bridge parameters — the core economic link between behaviour change
 *  and claims savings. Each entry carries its evidence citation. */
export interface ClaimsBridgeParam {
  annualClaimsDeltaUSD: number;
  annualClaimsDeltaCI: [number, number];
  applicablePrevalence: number;
  attributionFactor: number;
  evidenceHorizonYears: number;
  source: string;
}

export const ENGINE_CLAIMS_BRIDGE: Record<string, ClaimsBridgeParam> = {
  steps: {
    annualClaimsDeltaUSD: 120,
    annualClaimsDeltaCI: [50, 280],
    applicablePrevalence: 0.62,
    attributionFactor: 0.3,
    evidenceHorizonYears: 1,
    source: "Patel 2011 AJHP (Discovery insured book, n=304k); Carlson 2015 PCVD gradient. Prevalence: AIA Healthiest Workplace.",
  },
  vo2max: {
    annualClaimsDeltaUSD: 90,
    annualClaimsDeltaCI: [40, 180],
    applicablePrevalence: 0.44,
    attributionFactor: 0.3,
    evidenceHorizonYears: 1,
    source: "Myers 2018 VETS (5.6%/MET); Bachmann 2015 JACC (6.7%/MET) — relative effect imported.",
  },
  sleep: {
    annualClaimsDeltaUSD: 200,
    annualClaimsDeltaCI: [80, 350],
    applicablePrevalence: 0.12,
    attributionFactor: 0.3,
    evidenceHorizonYears: 1,
    source: "Ozminkowski 2007 Sleep insomnia excess-cost gradient; prevalence cut to HK/SG epidemiology.",
  },
  bp_screening: {
    annualClaimsDeltaUSD: 60,
    annualClaimsDeltaCI: [0, 150],
    applicablePrevalence: 0.24,
    attributionFactor: 0.35,
    evidenceHorizonYears: 3,
    source: "CDC Community Guide SMBP review; Bress 2017 NEJM SPRINT CEA.",
  },
  hba1c_screening: {
    annualClaimsDeltaUSD: 400,
    annualClaimsDeltaCI: [250, 750],
    applicablePrevalence: 0.05,
    attributionFactor: 0.35,
    evidenceHorizonYears: 1,
    source: "CMRO 2020 $429/$736; Wagner 2001 JAMA; Juarez 2013 gradient.",
  },
};

/** Key economic parameters from the evidence assumption set */
export const ENGINE_ECONOMICS = {
  discountRatePct: 0.05,
  valuationHorizonYears: 3,
  faderPartCreditPct: 0.4,
  rewardCostRatio: 0.7,
  persistedSavingsYears: 3,
  lapseReduction: 0.01,
  ltvPerMember: 1400,
} as const;

/** Signal ID → claims bridge key mapping (mirrors server/engine/signalCompatibility.ts) */
export function signalToClaimsBridgeKey(signalId: string): string {
  if (signalId === "hba1c") return "hba1c_screening";
  if (signalId === "bp") return "bp_screening";
  if (signalId === "sleep_regularity") return "sleep";
  if (signalId === "glucose_tir") return "hba1c_screening";
  if (signalId === "resting_hr" || signalId === "hrv" || signalId === "respiratory_rate") return "vo2max";
  if (signalId === "gait_speed") return "steps";
  if (signalId === "sleep" || signalId === "bp_screening" || signalId === "hba1c_screening") return signalId;
  if (signalId === "steps" || signalId === "vo2max") return signalId;
  return "vo2max";
}
