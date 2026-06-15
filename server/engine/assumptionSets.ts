import type { AssumptionItem, CampaignType, Market, RewardOption, VerificationGrade } from "@shared/schema";
import { signalToClaimsBridgeKey } from "./signalCompatibility";

export type ClaimsCostBasis = "book" | "enrolled" | "engaged" | "rewarded";

export interface ClaimsRiskTierAssumption {
  tier: "low" | "medium" | "high";
  label: string;
  weight: number;
  annualClaims: number;
  deltaMultiplier: number;
  source: string;
}

export interface ClaimsBridgeAssumption {
  annualClaimsDeltaUSD: number;
  annualClaimsDeltaCI: [number, number];
  applicablePrevalence: number;
  attributionFactor: number;
  evidenceHorizonYears: number;
  source: string;
}

export interface DiscountingAssumptions {
  discountRatePct: number;
  valuationHorizonYears: number;
}

export interface CostBasisAssumptions {
  reward: ClaimsCostBasis;
  admin: ClaimsCostBasis;
  platform: ClaimsCostBasis;
}

export interface GroupProductivityAssumptions {
  enabled: boolean;
  groupFraction: number;
  productivityPerMemberUSD: number;
  attributionFactor: number;
  source: string;
}

export interface MortalityMarginAssumptions {
  enabled: boolean;
  // relative all-cause mortality reduction per +1,000 steps/day sustained
  relativeReductionPer1kSteps: number;
  // cap on the total relative reduction credited to the programme
  maxRelativeReduction: number;
  // causal haircut applied to the observational mortality gradient
  attributionFactor: number;
  // mortality relativity of the targeted (least-active) tiers vs book average
  highRiskRelativity: number;
  source: string;
}

export interface LifeInsuranceAssumptions {
  baselineAnnualMortalityRate: number;
  mortalityTableRef: Record<Market, string>;
  sumAssured: number;
  annualPremium: number;
  morbidityValuePctOfMortality: number;
  acquisitionValuePerNewVerifiedMember: number;
  maxLapseImprovement: number;
  baseLapseImprovement: number;
  lapseImprovementPerPersistenceLift: number;
  mortalityMargin: MortalityMarginAssumptions;
}

export interface RewardAllocationAssumptions {
  rewardCatalogue: RewardOption[];
  verificationScore: Record<VerificationGrade, number>;
}

export interface EconomicAssumptions {
  claimsBaseline: Record<CampaignType, number>;
  claimsBaselineByTier: ClaimsRiskTierAssumption[];
  claimsBridge: Record<CampaignType, ClaimsBridgeAssumption>;
  discounting: DiscountingAssumptions;
  costBasis: CostBasisAssumptions;
  groupProductivity: GroupProductivityAssumptions;
  faderPartCreditPct: number;
  rewardFaderCostCreditPct: number;
  // share of the reward face value the insurer actually funds after breakage
  // (unredeemed points) and partner co-funding; 1.0 = full face value.
  rewardCostRatio: number;
  // years that PERSISTING members' claims savings are valued over (still
  // capped by the discounting valuation horizon); faders keep the 1-yr window.
  persistedSavingsYears: number;
  adminCostPmpm: number;
  platformCostPmpm: number;
  lapseReduction: number;
  ltvPerMember: number;
  // Model-level multiplier on realised claims value. 1.0 = evidence floor; a
  // forward/upside model lifts this to price a more optimistic realisation that
  // the per-signal attribution mask (claimsBridge) would otherwise cap. Applied
  // after attribution so it moves the headline claims/ROI per model.
  claimsValueMultiplier: number;
}

export interface VersionedAssumptionSet {
  id: string;
  version: string;
  label: string;
  status: "illustrative" | "draft" | "approved";
  source: string;
  economic: EconomicAssumptions;
  marketWearablePrior: Record<Market, number>;
  lifeInsurance: LifeInsuranceAssumptions;
  rewardAllocation: RewardAllocationAssumptions;
}

export const DEFAULT_ASSUMPTION_SET: VersionedAssumptionSet = {
  id: "healthid-life-v0",
  version: "0.1.0",
  label: "HealthID illustrative life-insurance assumptions",
  status: "illustrative",
  source: "Prototype assumption set compiled from HealthID research dossier; replace with actuary-approved client assumptions.",
  economic: {
    claimsBaseline: {
      steps: 1450,
      vo2max: 1650,
      sleep: 980,
      bp_screening: 1900,
      hba1c_screening: 2100,
    },
    claimsBaselineByTier: [
      {
        tier: "low",
        label: "Low-risk / already active",
        weight: 0.55,
        annualClaims: 650,
        deltaMultiplier: 0.35,
        source: "Illustrative skewed claims tier; replace with insurer claims distribution.",
      },
      {
        tier: "medium",
        label: "Moderate-risk / modifiable",
        weight: 0.3,
        annualClaims: 1800,
        deltaMultiplier: 1,
        source: "Illustrative skewed claims tier; replace with insurer claims distribution.",
      },
      {
        tier: "high",
        label: "High-risk / low activity",
        weight: 0.15,
        annualClaims: 6500,
        deltaMultiplier: 2.4,
        source: "Illustrative skewed claims tier; replace with insurer claims distribution.",
      },
    ],
    claimsBridge: {
      steps: {
        annualClaimsDeltaUSD: 840,
        annualClaimsDeltaCI: [350, 1800],
        applicablePrevalence: 0.62,
        attributionFactor: 0.6,
        evidenceHorizonYears: 1,
        source: "Claims-denominated bridge from Nasir 2016 MEPS exercise-cost gradient and CDC/employee-claims exercise-frequency evidence; not a mortality multiplier.",
      },
      vo2max: {
        annualClaimsDeltaUSD: 1100,
        annualClaimsDeltaCI: [450, 2300],
        applicablePrevalence: 0.44,
        attributionFactor: 0.6,
        evidenceHorizonYears: 1,
        source: "Claims-denominated CRF bridge mapped conservatively to physical-activity medical-cost gradients pending client CRF claims calibration.",
      },
      sleep: {
        annualClaimsDeltaUSD: 400,
        annualClaimsDeltaCI: [120, 900],
        applicablePrevalence: 0.32,
        attributionFactor: 0.55,
        evidenceHorizonYears: 1,
        source: "Claims-denominated sleep regularity bridge from insomnia HRU/expenditure literature, using a small regularity fraction rather than full insomnia treatment savings.",
      },
      bp_screening: {
        annualClaimsDeltaUSD: 390,
        annualClaimsDeltaCI: [120, 720],
        applicablePrevalence: 0.24,
        attributionFactor: 0.65,
        evidenceHorizonYears: 20,
        source: "Claims-denominated BP bridge from CDC SMBP long-horizon savings and SPRINT cost-effectiveness evidence, annualised and prevalence-gated.",
      },
      hba1c_screening: {
        annualClaimsDeltaUSD: 429,
        annualClaimsDeltaCI: [180, 736],
        applicablePrevalence: 0.11,
        attributionFactor: 0.65,
        evidenceHorizonYears: 1,
        source: "Claims-denominated HbA1c bridge: 1% HbA1c reduction linked to all-cause and diabetes-related annual cost deltas in Diabetes Therapy / CMRO evidence.",
      },
    },
    discounting: {
      discountRatePct: 0.05,
      valuationHorizonYears: 3,
    },
    costBasis: {
      reward: "rewarded",
      admin: "engaged",
      platform: "book",
    },
    groupProductivity: {
      enabled: true,
      groupFraction: 0.5,
      productivityPerMemberUSD: 300,
      attributionFactor: 0.6,
      source: "Illustrative group-book productivity stream for absenteeism / presenteeism; disable for individual-only books and replace with employer-specific productivity evidence.",
    },
    faderPartCreditPct: 0.4,
    rewardFaderCostCreditPct: 0.5,
    rewardCostRatio: 1,
    persistedSavingsYears: 1,
    adminCostPmpm: 0,
    platformCostPmpm: 0,
    lapseReduction: 0.02,
    ltvPerMember: 2600,
    claimsValueMultiplier: 1,
  },
  marketWearablePrior: {
    HK: 0.21,
    SG: 0.27,
  },
  lifeInsurance: {
    baselineAnnualMortalityRate: 0.0028,
    mortalityTableRef: {
      HK: "HK illustrative insured-life mortality table hook v0.1",
      SG: "SG illustrative insured-life mortality table hook v0.1",
    },
    sumAssured: 150000,
    annualPremium: 1800,
    morbidityValuePctOfMortality: 0.28,
    acquisitionValuePerNewVerifiedMember: 220,
    maxLapseImprovement: 0.04,
    baseLapseImprovement: 0.006,
    lapseImprovementPerPersistenceLift: 0.08,
    mortalityMargin: {
      enabled: true,
      relativeReductionPer1kSteps: 0.09,
      maxRelativeReduction: 0.2,
      attributionFactor: 0.3,
      highRiskRelativity: 1.5,
      source: "Illustrative mortality-margin stream; replace with client mortality table and actuary-approved improvement assumptions.",
    },
  },
  rewardAllocation: {
    verificationScore: {
      self_reported: 0.2,
      device_reported: 0.45,
      source_attested: 0.65,
      multi_signal_checked: 0.8,
      zero_custody_verified: 0.95,
    },
    rewardCatalogue: [
      {
        id: "status-points",
        label: "Cash-value reward with status boost",
        archetype: "points_status",
        insurerCostPmpm: 1.5,
        memberPerceivedValuePmpm: 4,
        timing: "monthly",
        requiresWearable: true,
        verificationRequirement: "device_reported",
      },
      {
        id: "cash-equivalent",
        label: "Direct cash-equivalent monthly reward",
        archetype: "cash_equivalent",
        insurerCostPmpm: 12,
        memberPerceivedValuePmpm: 12,
        timing: "monthly",
        requiresWearable: false,
        verificationRequirement: "device_reported",
      },
      {
        id: "premium-discount",
        label: "Premium-credit cash-value reward",
        archetype: "premium_discount",
        insurerCostPmpm: 10,
        memberPerceivedValuePmpm: 14,
        timing: "annual",
        requiresWearable: true,
        verificationRequirement: "source_attested",
      },
      {
        id: "device-financing",
        label: "Wearable-access cash-value reward",
        archetype: "device_financing",
        insurerCostPmpm: 18,
        memberPerceivedValuePmpm: 28,
        timing: "monthly",
        requiresWearable: false,
        verificationRequirement: "source_attested",
      },
      {
        id: "clinical-follow-up",
        label: "Clinical follow-up cash-value reward",
        archetype: "clinical_follow_up",
        insurerCostPmpm: 8,
        memberPerceivedValuePmpm: 11,
        timing: "instant",
        requiresWearable: false,
        verificationRequirement: "multi_signal_checked",
      },
      {
        id: "team-challenge",
        label: "Team cash-pool challenge reward",
        archetype: "social_team_challenge",
        insurerCostPmpm: 4,
        memberPerceivedValuePmpm: 7,
        timing: "weekly",
        requiresWearable: true,
        verificationRequirement: "device_reported",
      },
      {
        id: "charity-reward",
        label: "Member-directed cash-value reward",
        archetype: "charity_reward",
        insurerCostPmpm: 3,
        memberPerceivedValuePmpm: 5,
        timing: "monthly",
        requiresWearable: false,
        verificationRequirement: "device_reported",
      },
    ],
  },
};

// ===========================================================================
// EVIDENCE ASSUMPTION SET v1 — June 2026 evidence pass.
// Every constant carries a citation. Three structural corrections vs v0:
//  1. Claims deltas re-based to a LOCAL claims base (HK group ≈ US$850–950
//     claims/member/yr from HK IA premium data × 58–64% loss ratios; SG IP
//     ≈ US$410 claims/life, Singapore Actuarial Society Nov 2024).
//  2. Attribution cut 0.6 → ~0.3: the two best RCTs (Jones/Molitor/Reif,
//     QJE 2019; Song & Baicker, JAMA 2019 + 3-yr follow-up) found NO causal
//     short-run claims effect from programme offers — observational
//     differentials are mostly selection.
//  3. Retention/lapse re-based to programme-level (not tier-differential)
//     evidence: RGA cites ~15% relative lapse improvement on a ~5–6%/yr
//     baseline → ~1pp absolute, not 2pp.
// ===========================================================================
export const EVIDENCE_ASSUMPTION_SET: VersionedAssumptionSet = {
  id: "healthid-life-v1-evidence",
  version: "1.0.0",
  label: "HealthID evidence-anchored assumptions (HK/SG)",
  status: "draft",
  source:
    "Evidence pass (June 2026): published RCTs, meta-analyses, regulator statistics (HK IA, ASHK HKA22, LIA, SAS) and insured-book cohort studies. Draft pending actuary sign-off; see EVIDENCE_DOSSIER.md and the Evidence tab for full citations.",
  economic: {
    // Local claims bases: HK group medical claims ≈ US$750–1,250/member/yr
    // (GUM/Howden premium index × IA loss ratios); SG IP claims S$548/life
    // (SAS Nov 2024). Campaign keys differ only by pathway-cost mix.
    claimsBaseline: {
      steps: 900,
      vo2max: 900,
      sleep: 880,
      bp_screening: 950,
      hba1c_screening: 1000,
    },
    // Published claims concentration: top ~5% of members drive ~50% of spend
    // (KFF / MEPS Brief #540 / JAMA Netw Open 2021 trends). Mean ≈ US$915.
    claimsBaselineByTier: [
      {
        tier: "low",
        label: "Low-risk / already active",
        weight: 0.8,
        annualClaims: 300,
        deltaMultiplier: 0.35,
        source: "KFF/MEPS claims-concentration evidence: bottom 50% of spenders ≈ 3% of claims; calibrated to HK group base (mean ≈ US$915/member/yr).",
      },
      {
        tier: "medium",
        label: "Moderate-risk / modifiable",
        weight: 0.15,
        annualClaims: 1500,
        deltaMultiplier: 1,
        source: "KFF/MEPS claims-concentration evidence calibrated to HK group base.",
      },
      {
        tier: "high",
        label: "High-risk / low activity",
        weight: 0.05,
        annualClaims: 9000,
        deltaMultiplier: 2.4,
        source: "Top ~5% of members ≈ 50% of claims (KFF, MEPS Brief #540, PMC8441588). Behaviour-change reach in this tier capped per Patel 2010 engagement-threshold finding.",
      },
    ],
    claimsBridge: {
      steps: {
        annualClaimsDeltaUSD: 120,
        annualClaimsDeltaCI: [50, 280],
        applicablePrevalence: 0.62,
        attributionFactor: 0.3,
        evidenceHorizonYears: 1,
        source:
          "6–8% of baseline claims per effectively treated member: Patel 2011 AJHP (Discovery insured book, n=304k, longitudinal — became-active −6% hospital costs); Sci Rep 2021 Japan fixed-effects panel (¥16–28/step/yr); Carlson 2015 PCVD gradient as ceiling. Prevalence: AIA Healthiest Workplace — >60% of HK/SG employees insufficiently active.",
      },
      vo2max: {
        annualClaimsDeltaUSD: 90,
        annualClaimsDeltaCI: [40, 180],
        applicablePrevalence: 0.44,
        attributionFactor: 0.3,
        evidenceHorizonYears: 1,
        source:
          "~5–6% of claims per MET gained × ~1 MET achievable/yr: Myers 2018 VETS (5.6%/MET); Bachmann 2015 JACC (6.7%/MET) — relative effect imported, NOT the US-Medicare absolute dollars. Overlaps the steps pathway; do not sum.",
      },
      sleep: {
        annualClaimsDeltaUSD: 200,
        annualClaimsDeltaCI: [80, 350],
        applicablePrevalence: 0.12,
        attributionFactor: 0.3,
        evidenceHorizonYears: 1,
        source:
          "10–20% of the insomnia excess-cost gradient (Ozminkowski 2007 Sleep ≈ $2,300–2,500/yr US base; Wickwire 2019), prevalence cut to clinical insomnia ~10–15% (HK/SG epidemiology) — v0 double-counted by pairing broad prevalence with the full delta. No direct sleep-regularity cost literature exists; proxy mapping disclosed.",
      },
      bp_screening: {
        annualClaimsDeltaUSD: 60,
        annualClaimsDeltaCI: [0, 150],
        applicablePrevalence: 0.24,
        attributionFactor: 0.35,
        evidenceHorizonYears: 3,
        source:
          "BP control is cost-EFFECTIVE, not cost-saving, on a 1–3yr claims window: CDC Community Guide SMBP review (median −$148 to +$3/person-yr); Bress 2017 NEJM SPRINT CEA (+$12,796 lifetime cost, $28–47k/QALY). Larger savings only on ≥5yr horizons.",
      },
      hba1c_screening: {
        annualClaimsDeltaUSD: 400,
        annualClaimsDeltaCI: [250, 750],
        applicablePrevalence: 0.05,
        attributionFactor: 0.35,
        evidenceHorizonYears: 1,
        source:
          "Best-evidenced parameter: sustained 1% HbA1c reduction → ~2% all-cause / 13% diabetes-related cost reduction (CMRO 2020 $429/$736; Wagner 2001 JAMA $685–950/yr, savings concentrated at baseline ≥10%; Juarez 2013 Hawai'i +$2,700 gradient). Prevalence cut 0.11 → 0.05: only poorly controlled diabetics achieving a sustained 1-pt drop generate these savings.",
      },
    },
    discounting: {
      discountRatePct: 0.05,
      valuationHorizonYears: 3,
    },
    costBasis: {
      reward: "rewarded",
      admin: "engaged",
      platform: "book",
    },
    groupProductivity: {
      enabled: true,
      groupFraction: 0.5,
      productivityPerMemberUSD: 250,
      attributionFactor: 0.4,
      source:
        "1–2 causal absence days/yr × HK median wage ≈ US$110–240 (Loeppke 2009 JOEM 2.3× multiplier and AIA/RAND Healthiest Workplace 77 lost days/yr are survey presenteeism — reported as context, NOT monetised). Attribution 0.4 given Illinois RCT / Song & Baicker absenteeism nulls.",
    },
    // Decay evidence: gain-framed cash loses ~60% of lift by 3mo post-reward,
    // ~85% by 6mo (Mantzari 2015 meta-analysis; TRIPPA 12-mo full erosion).
    // Faders therefore get 40% part-credit during the horizon.
    faderPartCreditPct: 0.4,
    rewardFaderCostCreditPct: 0.5,
    // Points/voucher rewards: industry loyalty-programme redemption is 67–69%
    // (31–33% breakage; IFRS 15 requires insurers to book only expected
    // redemption), and wellness ecosystems co-fund 5–15% via partners
    // (Discovery Vitality partner model). 0.7 = breakage-only, no partner
    // co-funding credited. Set to 1.0 for pure-cash rewards.
    rewardCostRatio: 0.7,
    // Wagner 2001 JAMA: sustained behaviour change shows claims savings in
    // years 1–4, not year 1 only. PERSISTING members' savings are valued over
    // 3 years (still PV-discounted and capped by the valuation horizon);
    // faders keep the 1-year evidence window per Mantzari decay.
    persistedSavingsYears: 3,
    adminCostPmpm: 0,
    platformCostPmpm: 0,
    // Programme-level lapse improvement: RGA-cited Discovery experience ≈15%
    // relative on a 5–6%/yr base (SOA/LIMRA 2015–22) → ~1pp absolute. The
    // famous 50–67% differentials are top-tier vs bottom-tier SELECTION.
    lapseReduction: 0.01,
    // LTV: AIA FY2024 VONB margin 54.5% × realistic protection ANP → ~US$900–1,800.
    ltvPerMember: 1400,
    claimsValueMultiplier: 1,
  },
  // Rakuten Insight / Statista 2022: HK ~42% smartwatch (~64% any wearable);
  // SG ~27% smartwatch (~45–69% any wearable). v0 understated HK.
  marketWearablePrior: {
    HK: 0.36,
    SG: 0.3,
  },
  lifeInsurance: {
    // ASHK HKA22 (2014–21, 13 insurers, >60M life-years): crude insured-lives
    // mortality ≈ 1.75/1,000; working-age book sits ~0.8–2.0/1,000.
    baselineAnnualMortalityRate: 0.0015,
    mortalityTableRef: {
      HK: "ASHK HKA22 insured-lives study (crude ≈1.75‰) — replace with client table",
      SG: "SG insured-lives proxy from HKA22 + LIA experience — replace with client table",
    },
    // HK IA Table L2 2024: avg in-force sum assured ≈ HK$659k ≈ US$84.5k;
    // LIA Protection Gap 2022: ~S$110k/policy. Premium: term ≈ US$770/yr,
    // blended protection+rider book labelled.
    sumAssured: 95000,
    annualPremium: 1500,
    morbidityValuePctOfMortality: 0.28,
    acquisitionValuePerNewVerifiedMember: 220,
    // Causal credit ~0.3–0.5 applied to tier differentials (Illinois RCT).
    maxLapseImprovement: 0.025,
    baseLapseImprovement: 0.004,
    lapseImprovementPerPersistenceLift: 0.06,
    // Mortality margin: Paluch 2022 Lancet Public Health pooled meta-analysis
    // (15 cohorts, n=47,471) — ~HR 0.91 per +1,000 steps/day, i.e. ~9% lower
    // all-cause mortality, saturating by quartile (Q4 HR ≈ 0.47 overall cap;
    // we cap programme credit at 20% relative). Attribution 0.3 mirrors the
    // claims-bridge causal haircut (observational gradient, healthy-user
    // bias). High-risk relativity 1.5: least-active tiers carry above-book
    // mortality (HKA22 crude 1.75‰ spans ~0.8–2.0‰ working-age).
    mortalityMargin: {
      enabled: true,
      relativeReductionPer1kSteps: 0.09,
      maxRelativeReduction: 0.2,
      attributionFactor: 0.3,
      highRiskRelativity: 1.5,
      source:
        "Paluch 2022 Lancet Public Health (HR ≈0.91 per +1,000 steps/day, 15-cohort meta-analysis) × 0.3 causal attribution; baseline ASHK HKA22 insured-lives mortality; sum assured HK IA Table L2 2024.",
    },
  },
  rewardAllocation: DEFAULT_ASSUMPTION_SET.rewardAllocation,
};

export function activeAssumptionSet() {
  return EVIDENCE_ASSUMPTION_SET;
}

export function assumptionSetRegister(
  campaign: CampaignType,
  market: Market,
  set: VersionedAssumptionSet = activeAssumptionSet(),
): AssumptionItem[] {
  const key = signalToClaimsBridgeKey(campaign);
  return [
    {
      key: "assumptionSetVersion",
      label: "Assumption set version",
      value: `${set.id}@${set.version}`,
      unit: "version",
      source: set.source,
      geography: market,
      editable: false,
    },
    {
      key: "baselineAnnualMortalityRate",
      label: "Baseline annual mortality rate",
      value: set.lifeInsurance.baselineAnnualMortalityRate,
      unit: "fraction/year",
      source: "Illustrative life-insurance default; replace with mortality table / insured book experience.",
      geography: market,
      editable: true,
    },
    {
      key: "mortalityTableRef",
      label: "Mortality table reference",
      value: set.lifeInsurance.mortalityTableRef[market],
      unit: "table/version",
      source: "Regional mortality-table hook for actuary-owned replacement by market.",
      geography: market,
      editable: true,
    },
    {
      key: "sumAssured",
      label: "Average sum assured",
      value: set.lifeInsurance.sumAssured,
      unit: "USD",
      source: "Illustrative product economics default.",
      geography: market,
      editable: true,
    },
    {
      key: "annualPremium",
      label: "Average annual premium",
      value: set.lifeInsurance.annualPremium,
      unit: "USD/member/year",
      source: "Illustrative product economics default.",
      geography: market,
      editable: true,
    },
    {
      key: "claimsBaseline",
      label: "Annual health claims baseline per member",
      value: set.economic.claimsBaseline[key],
      unit: "USD/member/year",
      source: "Legacy display baseline only. Claims savings now use the claims-denominated bridge and risk-tiered baseline below.",
      geography: market,
      editable: true,
    },
    {
      key: "claimsBridgeAnnualDelta",
      label: "Claims bridge annual cost delta",
      value: set.economic.claimsBridge[key].annualClaimsDeltaUSD,
      unit: "USD/applicable-treated-member/year",
      source: set.economic.claimsBridge[key].source,
      geography: market,
      editable: true,
    },
    {
      key: "claimsBridgeApplicablePrevalence",
      label: "Applicable claims-pathway prevalence",
      value: set.economic.claimsBridge[key].applicablePrevalence,
      unit: "fraction",
      source: "Share of effectively treated members assumed to have the relevant avoidable-cost pathway.",
      geography: market,
      editable: true,
    },
    {
      key: "claimsBridgeAttributionFactor",
      label: "Programme attribution factor",
      value: set.economic.claimsBridge[key].attributionFactor,
      unit: "fraction",
      source: "Counterfactual / selection-bias haircut: share of the observed association treated as causal programme impact.",
      geography: market,
      editable: true,
    },
    {
      key: "discountRatePct",
      label: "Present-value discount rate",
      value: set.economic.discounting.discountRatePct,
      unit: "fraction/year",
      source: "Illustrative valuation rate for discounting future benefits and costs to t=0.",
      geography: market,
      editable: true,
    },
    {
      key: "valuationHorizonYears",
      label: "Valuation horizon",
      value: set.economic.discounting.valuationHorizonYears,
      unit: "years",
      source: "Benefits and recurring costs are reconciled onto this present-value horizon unless the evidence horizon is shorter.",
      geography: market,
      editable: true,
    },
    {
      key: "faderPartCreditPct",
      label: "Part-credit for members who fade",
      value: set.economic.faderPartCreditPct,
      unit: "fraction",
      source: "Partial-exposure dosing assumption for members who engage but do not persist through the horizon.",
      geography: market,
      editable: true,
    },
    {
      key: "rewardCostRatio",
      label: "Reward cost ratio (breakage / partner funding)",
      value: set.economic.rewardCostRatio,
      unit: "fraction of face value",
      source:
        "Loyalty-programme redemption 67–69% (31–33% breakage; IFRS 15 books expected redemption only). Set to 1.0 for pure-cash rewards.",
      geography: market,
      editable: true,
    },
    {
      key: "persistedSavingsYears",
      label: "Persisting-member savings window",
      value: set.economic.persistedSavingsYears,
      unit: "years (PV-discounted, capped by valuation horizon)",
      source: "Wagner 2001 JAMA: sustained behaviour change shows claims savings in years 1–4; faders keep the 1-year window.",
      geography: market,
      editable: true,
    },
    {
      key: "mortalityRelativeReduction",
      label: "Mortality reduction per +1,000 steps/day",
      value: set.lifeInsurance.mortalityMargin.relativeReductionPer1kSteps,
      unit: `relative reduction; capped at ${(set.lifeInsurance.mortalityMargin.maxRelativeReduction * 100).toFixed(0)}%`,
      source: set.lifeInsurance.mortalityMargin.source,
      geography: market,
      editable: true,
    },
    {
      key: "mortalityAttributionFactor",
      label: "Mortality-margin attribution factor",
      value: set.lifeInsurance.mortalityMargin.attributionFactor,
      unit: "fraction",
      source: "Causal haircut on the observational steps-mortality gradient (healthy-user bias), mirroring the claims-bridge attribution.",
      geography: market,
      editable: true,
    },
    {
      key: "mortalityHighRiskRelativity",
      label: "Targeted-tier mortality relativity",
      value: set.lifeInsurance.mortalityMargin.highRiskRelativity,
      unit: "× book-average mortality",
      source: "Least-active tiers carry above-book mortality (ASHK HKA22 working-age range ~0.8–2.0‰); applied only when targeting high-risk members.",
      geography: market,
      editable: true,
    },
    {
      key: "costBasisReward",
      label: "Reward cost basis",
      value: set.economic.costBasis.reward,
      unit: "basis",
      source: "Configurable denominator for PMPM reward spend.",
      geography: market,
      editable: true,
    },
    {
      key: "costBasisAdmin",
      label: "Admin cost basis",
      value: set.economic.costBasis.admin,
      unit: "basis",
      source: "Configurable denominator for PMPM administration cost.",
      geography: market,
      editable: true,
    },
    {
      key: "costBasisPlatform",
      label: "Platform cost basis",
      value: set.economic.costBasis.platform,
      unit: "basis",
      source: "Configurable denominator for PMPM platform cost.",
      geography: market,
      editable: true,
    },
    {
      key: "groupProductivityEnabled",
      label: "Group productivity stream",
      value: set.economic.groupProductivity.enabled ? "enabled" : "disabled",
      unit: "toggle",
      source: set.economic.groupProductivity.source,
      geography: market,
      editable: true,
    },
    {
      key: "groupProductivityFraction",
      label: "Group book fraction",
      value: set.economic.groupProductivity.groupFraction,
      unit: "fraction",
      source: "Share of the simulated book treated as group/employer business for optional productivity value.",
      geography: market,
      editable: true,
    },
    {
      key: "groupProductivityPerMember",
      label: "Productivity value per treated group member",
      value: set.economic.groupProductivity.productivityPerMemberUSD,
      unit: "USD/member/year",
      source: "Illustrative absenteeism / presenteeism planning value; not double-counted with claims savings.",
      geography: market,
      editable: true,
    },
    ...set.economic.claimsBaselineByTier.map((tier) => ({
      key: `claimsTier_${tier.tier}`,
      label: `${tier.label} claims tier`,
      value: tier.annualClaims,
      unit: `USD/member/year; weight ${(tier.weight * 100).toFixed(0)}%; delta multiplier ${tier.deltaMultiplier}`,
      source: tier.source,
      geography: market,
      editable: true,
    })),
    {
      key: "wearableOwnership",
      label: "Wearable ownership prior",
      value: set.marketWearablePrior[market],
      unit: "fraction",
      source: "Illustrative prototype market prior.",
      geography: market,
      editable: true,
    },
  ];
}
