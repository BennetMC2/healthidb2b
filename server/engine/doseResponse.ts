import type { CampaignType, DoseResponseParam } from "@shared/schema";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function gaussian(rng: () => number, mean: number, sd: number) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
}

function sdFromCI(ci: [number, number]) {
  return Math.max(1e-4, (ci[1] - ci[0]) / (2 * 1.96));
}

export const DOSE_RESPONSE_MODULE = {
  moduleName: "default-dose-response",
  moduleVersion: "0.2.0",
};

// Published central clinical effects + 95% CI. These are retained for the
// separate life-insurance / evidence path only. Health-claims dollars are
// calculated by the claims-denominated bridge in claimsBridge.ts.
export const DOSE_RESPONSE_PARAMS: DoseResponseParam[] = [
  {
    campaign: "steps",
    label: "Steps → all-cause mortality evidence",
    effectP50: 0.13,
    effectCI: [0.08, 0.18],
    source: "Paluch 2022, Lancet Public Health: each +1,000 steps/day ≈ 12–15% lower all-cause mortality, saturating ~+4,000.",
  },
  {
    campaign: "vo2max",
    label: "VO2max / CRF → mortality",
    effectP50: 0.09,
    effectCI: [0.05, 0.15],
    source: "Mandsager 2018, JAMA Netw Open: higher cardiorespiratory fitness strongly lowers long-term mortality, no upper limit.",
  },
  {
    campaign: "sleep",
    label: "Sleep regularity → CV/metabolic evidence",
    effectP50: 0.05,
    effectCI: [0.02, 0.09],
    source: "Cappuccio 2010, Sleep: abnormal sleep duration raises all-cause mortality; regularity a modest CV/metabolic target.",
  },
  {
    campaign: "bp_screening",
    label: "Intensive BP control → CV events",
    effectP50: 0.11,
    effectCI: [0.06, 0.2],
    source: "SPRINT 2015, NEJM: intensive systolic control (<120) cut major CV events ~25% among the detected/treated.",
  },
  {
    campaign: "hba1c_screening",
    label: "Glycaemic control → diabetes complications",
    effectP50: 0.1,
    effectCI: [0.05, 0.18],
    source: "UKPDS-class evidence: improved glycaemic control reduces microvascular complications and downstream claims.",
  },
];

export function drParam(campaign: CampaignType): DoseResponseParam {
  return DOSE_RESPONSE_PARAMS.find((p) => p.campaign === campaign)!;
}

export function doseSaturation(campaign: CampaignType, effortIntensity: number, stepLift: number): number {
  const eff = clamp(effortIntensity, 0, 1);
  if (campaign === "steps" && stepLift > 0) {
    const stepSat = 1 - Math.exp(-Math.max(0, stepLift) / 1500);
    return clamp(0.5 * stepSat + 0.5 * eff, 0, 1);
  }
  return eff;
}

export function sampleDoseResponse(
  campaign: CampaignType,
  effortIntensity: number,
  stepLift: number,
  rng: () => number
): number {
  const p = drParam(campaign);
  const sd = sdFromCI(p.effectCI);
  const drawn = clamp(gaussian(rng, p.effectP50, sd), p.effectCI[0] * 0.5, p.effectCI[1] * 1.3);
  const sat = doseSaturation(campaign, effortIntensity, stepLift);
  return clamp(drawn * sat, 0, 0.25);
}
