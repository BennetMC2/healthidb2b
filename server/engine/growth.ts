import type {
  AgentDecision,
  GrowthAssumptionItem,
  GrowthBehavior,
  GrowthChannel,
  GrowthDecision,
  GrowthQuarter,
  GrowthResult,
  MemberAgent,
  ResolvedPlan,
  UpsellProduct,
} from "@shared/schema";
import { callLlm, type LlmProvider } from "./llm";
import { ECONOMIC_ASSUMPTIONS, LIFE_ASSUMPTIONS } from "./assumptions";

// ---------------------------------------------------------------------------
// Growth simulation engine — the commercial clock.
//
// Deliberately separate from the actuarial book-health chain. Models
// ADDITIONAL buying only (riders, sum-assured top-ups, second products) and
// program-driven new customers via referral and visibility. Never models
// carrier switching: in HK/SG life books, surrender penalties, re-underwriting
// and agent relationships make mid-policy switching rare, and claiming it
// would not survive a distribution-team review.
//
// Three acquisition channels at deliberately different costs:
//   upsell      — existing relationship, no new acquisition; cheapest
//   referral    — warm intro, commission still paid; discounted CAC
//   program_led — full life-insurance CAC (first-year commission + marketing);
//                 conservative attribution, often barely accretive in year one,
//                 which is honest.
// ---------------------------------------------------------------------------

export const GROWTH_ASSUMPTIONS = {
  // Rider / top-up annual premium as a share of the average in-force annual premium.
  upsellPremiumPctOfBase: 0.35,
  // Value of new business as share of first-year annualised premium (APE proxy).
  // HK/SG listed insurers disclose VNB margins of ~50-65%; we use a conservative 45%.
  vnbMargin: 0.45,
  // Acquisition cost per policy as % of first-year premium, by channel.
  upsellCacPctOfFyp: 0.18, // top-up commission only; relationship already exists
  referralCacPctOfFyp: 0.55, // commission still paid; marketing/lead-gen saved
  programCacPctOfFyp: 1.05, // full first-year commission + marketing allocation
  // Share of referral mentions that convert to a purchased policy within the horizon.
  referralConversion: 0.1,
  // Program-visibility-attributed new policies per year, as a share of book size.
  // Kept very conservative; the Vitality precedent is real but market-specific.
  programLedAnnualLiftPct: 0.0015,
} as const;

export function growthAssumptionItems(): GrowthAssumptionItem[] {
  const a = GROWTH_ASSUMPTIONS;
  return [
    { key: "upsellPremium", label: "Rider / top-up annual premium", value: `${Math.round(a.upsellPremiumPctOfBase * 100)}% of average in-force premium`, source: "Industry rider APE share, HK/SG retail life", tier: "Emerging" },
    { key: "vnbMargin", label: "Value of new business margin", value: `${Math.round(a.vnbMargin * 100)}% of first-year premium`, source: "Public VNB disclosures (AIA, Prudential HK/SG), conservative end", tier: "Proven" },
    { key: "upsellCac", label: "Upsell acquisition cost", value: `${Math.round(a.upsellCacPctOfFyp * 100)}% of first-year premium`, source: "Top-up commission schedules; no new acquisition needed", tier: "Emerging" },
    { key: "referralCac", label: "Referral acquisition cost", value: `${Math.round(a.referralCacPctOfFyp * 100)}% of first-year premium`, source: "Full commission less marketing/lead-gen; warm-intro benchmarks", tier: "Emerging" },
    { key: "programCac", label: "Program-led acquisition cost", value: `${Math.round(a.programCacPctOfFyp * 100)}% of first-year premium`, source: "First-year commission structures + marketing allocation", tier: "Proven" },
    { key: "referralConversion", label: "Referral mention → purchase conversion", value: `${Math.round(a.referralConversion * 100)}% within horizon`, source: "Referral programme benchmarks; financial products convert low", tier: "Emerging" },
    { key: "programLift", label: "Program-attributed new business", value: `${(a.programLedAnnualLiftPct * 100).toFixed(2)}% of book per year`, source: "Emerging — AIA Vitality / Discovery precedent, needs market data", tier: "Emerging" },
    { key: "upsellCounterfactual", label: "Upsell counterfactual", value: "Only the EXCESS over non-engaged members' organic upsell rate is credited", source: "Causal hygiene: engaged members would buy some cover anyway", tier: "Proven" },
  ];
}

// --- LLM growth pass ---------------------------------------------------------

const GROQ_MODEL = process.env.GROQ_AGENT_MODEL || "llama-3.1-8b-instant";
const GLM_MODEL = process.env.GLM_AGENT_MODEL || "glm-4.5-flash";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_AGENT_MODEL || "claude-haiku-4-5";
const PROVIDER_ORDER: LlmProvider[] = process.env.ANTHROPIC_API_KEY
  ? ["anthropic", "groq", "glm"]
  : process.env.GLM_API_KEY
    ? ["glm", "groq", "anthropic"]
    : ["groq", "glm", "anthropic"];
const GROWTH_MODEL = PROVIDER_ORDER[0] === "anthropic" ? ANTHROPIC_MODEL : PROVIDER_ORDER[0] === "glm" ? GLM_MODEL : GROQ_MODEL;

const GROWTH_SYSTEM = `You are role-playing ONE specific ordinary insurance plan member. Their insurer runs a wellness rewards programme; you are told whether this person engaged with it. Now decide two COMMERCIAL questions as THIS person would:

1) ADDITIONAL BUYING: would this person buy MORE cover from this same insurer in the next 12 months — a critical-illness rider, a sum-assured top-up, or a savings plan — when their advisor or the app offers it? Rules of real life:
- Most people do NOT buy more insurance in any given year. Base rates are low.
- Additional buying follows life events (new baby, new flat/mortgage, a health scare, a parent's illness) and affordability — not enthusiasm for an app.
- High financial pressure means almost no chance of adding premium, however engaged.
- A member who genuinely engaged and feels healthier trusts the insurer more and is somewhat warmer to an offer; a member who ignored the programme is unchanged.
- NOBODY switches insurer here. This is additional cover with the existing insurer only.

2) REFERRAL: would this person actively recommend the programme to friends or family? Genuinely pleased, engaged members mention it to 1-2 people; most members mention it to nobody. Cynics and non-starters do not refer.

Decide from THIS person's life, family situation, income and engagement outcome. Return only compact JSON, no prose, no markdown fences.`;

function rngFor(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

const PRODUCTS: UpsellProduct[] = ["ci_rider", "top_up", "savings_plan", "none"];

function sanitizeProduct(p: any): UpsellProduct {
  return PRODUCTS.includes(p) ? p : "none";
}

const ENGAGEMENT_LABEL: Record<string, string> = {
  engaged: "engaged consistently and completed the programme",
  enrolled: "enrolled but engaged only lightly",
  dropped: "enrolled then dropped off after a few weeks",
  nonstarter: "did not enrol at all",
};

function buildGrowthBatchPrompt(pairs: { agent: MemberAgent; engagement: string }[], plan: ResolvedPlan): string {
  const lines = pairs
    .map(
      ({ agent, engagement }) =>
        `#${agent.id}: ${agent.age}${agent.sex} job=${agent.occupation} area=${agent.district} family=${agent.family} income=${agent.incomeBand ?? "middle"} health=${agent.healthHistory} attitude=${agent.attitude} traits(m/c/tp/ts/ha/fp)=${agent.motivation}/${agent.conscientiousness}/${agent.timePressure}/${agent.techSavvy}/${agent.healthAnxiety}/${agent.financialPressure} programme_outcome=${ENGAGEMENT_LABEL[engagement] ?? engagement}`
    )
    .join("\n\n");
  return `Context: ${plan.marketLabel} life insurer; wellness programme rewarding ${plan.campaignLabel}. Each member's programme_outcome is what actually happened.

Decide independently for each member.

MEMBERS
${lines}

Return JSON exactly. Compact array rows:
{
  "decisions": [
    [<id>, <upsell_likelihood 0..1, realistic and LOW for most>, <"ci_rider"|"top_up"|"savings_plan"|"none">, <referral_likelihood 0..1>, <expected_referrals int 0-3>, "<max 10 words, first person>"]
  ]
}

One row for every member id: ${pairs.map((p) => p.agent.id).join(", ")}.`;
}

function parseJsonValue(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const objStart = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
  if (start === -1) throw new Error("no json");
  const end = cleaned[start] === "[" ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
  if (end === -1) throw new Error("no json end");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function growthFromRaw(raw: any, agent: MemberAgent, engagement: AgentDecision["decision"]): GrowthDecision {
  const rng = rngFor(agent.id * 7919 + 17);
  const upsellLikelihood = clamp01(Number(raw.upsell_likelihood) || 0);
  const referralLikelihood = clamp01(Number(raw.referral_likelihood) || 0);
  const expectedReferrals = Math.max(0, Math.min(3, Math.round(Number(raw.expected_referrals) || 0)));
  const boughtUpsell = rng() < upsellLikelihood;
  const referralsMade = rng() < referralLikelihood ? Math.max(1, expectedReferrals) : 0;
  return {
    agentId: agent.id,
    engagement,
    upsellLikelihood,
    upsellProduct: boughtUpsell ? sanitizeProduct(raw.product ?? raw.upsell_product) : "none",
    boughtUpsell,
    referralLikelihood,
    expectedReferrals,
    referralsMade,
    reasoning: String(raw.reasoning ?? "").slice(0, 240) || "(no reasoning returned)",
    agent,
    mode: "llm",
  };
}

export function heuristicGrowthDecision(agent: MemberAgent, engagement: AgentDecision["decision"], reason: string): GrowthDecision {
  const rng = rngFor(agent.id * 7919 + 17);
  const engagedBoost = engagement === "engaged" ? 0.08 : engagement === "dropped" ? 0.02 : 0;
  const lifeStage = agent.age >= 28 && agent.age <= 46 ? 0.04 : 0; // family-formation years
  const upsellLikelihood = clamp01(0.04 + engagedBoost + lifeStage + agent.healthAnxiety * 0.05 - agent.financialPressure * 0.08);
  const referralLikelihood = engagement === "engaged" ? clamp01(0.2 + agent.motivation * 0.3) : engagement === "dropped" ? 0.06 : 0.02;
  const expectedReferrals = referralLikelihood > 0.3 ? 2 : referralLikelihood > 0.1 ? 1 : 0;
  const boughtUpsell = rng() < upsellLikelihood;
  const product: UpsellProduct = !boughtUpsell ? "none" : agent.healthAnxiety > 0.55 ? "ci_rider" : agent.age < 38 ? "savings_plan" : "top_up";
  return {
    agentId: agent.id,
    engagement,
    upsellLikelihood,
    upsellProduct: product,
    boughtUpsell,
    referralLikelihood,
    expectedReferrals,
    referralsMade: rng() < referralLikelihood ? Math.max(1, expectedReferrals) : 0,
    reasoning: "(heuristic fallback — model call unavailable)",
    agent,
    mode: "heuristic",
    fallbackReason: reason,
  };
}

export async function runGrowthBatch(
  pairs: { agent: MemberAgent; engagement: AgentDecision["decision"] }[],
  plan: ResolvedPlan
): Promise<GrowthDecision[]> {
  if (pairs.length === 0) return [];
  try {
    const msg = await callLlm({
      maxTokens: Math.min(4200, 220 + pairs.length * 60),
      temperature: 0.9,
      model: GROWTH_MODEL,
      maxRetries: 0,
      providerOrder: PROVIDER_ORDER,
      providerModels: { glm: GLM_MODEL, groq: GROQ_MODEL, anthropic: ANTHROPIC_MODEL },
      system: GROWTH_SYSTEM,
      prompt: buildGrowthBatchPrompt(pairs, plan),
    });
    const parsed = parseJsonValue(msg.text);
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.decisions) ? parsed.decisions : [];
    const byId = new Map<number, any>();
    for (const row of rows) {
      if (Array.isArray(row)) {
        byId.set(Number(row[0]), {
          upsell_likelihood: row[1],
          product: row[2],
          referral_likelihood: row[3],
          expected_referrals: row[4],
          reasoning: row[5],
        });
      } else if (row && typeof row === "object") {
        const id = Number(row.agent_id ?? row.id);
        if (Number.isFinite(id)) byId.set(id, row);
      }
    }
    return pairs.map(({ agent, engagement }) => {
      const raw = byId.get(agent.id);
      if (!raw) return heuristicGrowthDecision(agent, engagement, "batch response omitted this agent");
      try {
        return growthFromRaw(raw, agent, engagement);
      } catch (err: any) {
        return heuristicGrowthDecision(agent, engagement, String(err?.message ?? "invalid row").slice(0, 160));
      }
    });
  } catch (err: any) {
    const reason = String(err?.message ?? "growth model call unavailable").slice(0, 400);
    return pairs.map(({ agent, engagement }) => heuristicGrowthDecision(agent, engagement, reason));
  }
}

// --- aggregation -------------------------------------------------------------

function propCI(p: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (center - margin) / denom), Math.min(1, (center + margin) / denom)];
}

export function aggregateGrowth(decisions: GrowthDecision[]): GrowthBehavior {
  const n = decisions.length;
  const engaged = decisions.filter((d) => d.engagement === "engaged");
  const other = decisions.filter((d) => d.engagement !== "engaged");
  const upsellEngaged = engaged.filter((d) => d.boughtUpsell).length / Math.max(1, engaged.length);
  const upsellOther = other.filter((d) => d.boughtUpsell).length / Math.max(1, other.length);
  const referrers = engaged.filter((d) => d.referralsMade > 0).length;
  const mentions = engaged.reduce((s, d) => s + d.referralsMade, 0);
  const mixCounts = new Map<UpsellProduct, number>();
  for (const d of decisions) {
    if (d.boughtUpsell && d.upsellProduct !== "none") mixCounts.set(d.upsellProduct, (mixCounts.get(d.upsellProduct) ?? 0) + 1);
  }
  const bought = Array.from(mixCounts.values()).reduce((s, c) => s + c, 0);
  return {
    sampleSize: n,
    engagedShare: engaged.length / Math.max(1, n),
    upsellRateEngaged: upsellEngaged,
    upsellRateEngagedCI: propCI(upsellEngaged, Math.max(1, engaged.length)),
    upsellRateOther: upsellOther,
    referralRate: referrers / Math.max(1, engaged.length),
    referralsPerEngaged: mentions / Math.max(1, engaged.length),
    productMix: Array.from(mixCounts.entries()).map(([product, count]) => ({
      product,
      count,
      pct: count / Math.max(1, bought),
    })),
  };
}

// --- financial bridge + quarterly P&L ----------------------------------------

export interface GrowthEvalInput {
  bookSize: number;
  market: ResolvedPlan["market"];
  horizonMonths: number;
  rewardPmpm: number;
  enrolledShare: number; // share of book enrolled in the programme
  behavior: GrowthBehavior;
}

export function evaluateGrowth(input: GrowthEvalInput, seed: number, iterations = 3000): GrowthResult {
  const A = GROWTH_ASSUMPTIONS;
  const basePremium = LIFE_ASSUMPTIONS.annualPremium;
  const rewardCostRatio = ECONOMIC_ASSUMPTIONS.rewardCostRatio;
  const horizonQuarters = Math.max(4, Math.ceil(input.horizonMonths / 3));
  const yearsInHorizon = horizonQuarters / 4;
  const b = input.behavior;

  const engagedMembers = input.bookSize * b.engagedShare;
  // Counterfactual hygiene: only the EXCESS upsell over non-engaged members'
  // organic rate is credited to the programme.
  const incrementalUpsellRate = Math.max(0, b.upsellRateEngaged - b.upsellRateOther);
  const upsellSampleN = Math.max(1, Math.round(b.sampleSize * b.engagedShare));

  const point = (upsellRate: number, mentionsPer: number, conversion: number, programLift: number, cacScale: number) => {
    const upsellPolicies = engagedMembers * upsellRate;
    const upsellPremium = basePremium * A.upsellPremiumPctOfBase;
    const upsellValue = upsellPolicies * upsellPremium * A.vnbMargin;
    const upsellCac = upsellPolicies * upsellPremium * A.upsellCacPctOfFyp * cacScale;

    const referralPolicies = engagedMembers * mentionsPer * conversion;
    const referralValue = referralPolicies * basePremium * A.vnbMargin;
    const referralCac = referralPolicies * basePremium * A.referralCacPctOfFyp * cacScale;

    const programPolicies = input.bookSize * programLift * yearsInHorizon;
    const programValue = programPolicies * basePremium * A.vnbMargin;
    const programCac = programPolicies * basePremium * A.programCacPctOfFyp * cacScale;

    const rewardCost = input.enrolledShare * input.bookSize * input.rewardPmpm * input.horizonMonths * rewardCostRatio;
    return {
      upsellPolicies, upsellValue, upsellCac,
      referralPolicies, referralValue, referralCac,
      programPolicies, programValue, programCac,
      rewardCost,
      net: upsellValue - upsellCac + referralValue - referralCac + programValue - programCac - rewardCost,
    };
  };

  // Central estimate
  const c = point(incrementalUpsellRate, b.referralsPerEngaged, A.referralConversion, A.programLedAnnualLiftPct, 1);

  // Monte Carlo over the soft parameters
  const rng = rngFor(seed || 1);
  const nets: number[] = [];
  const upsellSe = Math.sqrt(Math.max(1e-9, (incrementalUpsellRate * (1 - incrementalUpsellRate)) / upsellSampleN));
  for (let i = 0; i < iterations; i++) {
    const u = Math.max(0, incrementalUpsellRate + gaussian(rng) * upsellSe);
    const m = Math.max(0, b.referralsPerEngaged * (0.7 + rng() * 0.6));
    const conv = 0.06 + rng() * 0.08; // 6-14%
    const lift = 0.0005 + rng() * 0.002; // 0.05-0.25% of book per year
    const cacScale = 0.85 + rng() * 0.3;
    nets.push(point(u, m, conv, lift, cacScale).net);
  }
  nets.sort((a, z) => a - z);
  const q = (p: number) => nets[Math.min(nets.length - 1, Math.max(0, Math.floor(p * nets.length)))];

  const channels: GrowthChannel[] = [
    {
      id: "upsell",
      label: "Upsell to engaged members",
      policies: c.upsellPolicies,
      annualPremium: c.upsellPolicies * basePremium * A.upsellPremiumPctOfBase,
      newBusinessValue: c.upsellValue,
      acquisitionCost: c.upsellCac,
      cacPerPolicy: c.upsellPolicies > 0 ? c.upsellCac / c.upsellPolicies : 0,
      netValue: c.upsellValue - c.upsellCac,
      evidence: "Emerging — incremental over non-engaged organic rate, agent-derived",
    },
    {
      id: "referral",
      label: "Referral-driven new customers",
      policies: c.referralPolicies,
      annualPremium: c.referralPolicies * basePremium,
      newBusinessValue: c.referralValue,
      acquisitionCost: c.referralCac,
      cacPerPolicy: c.referralPolicies > 0 ? c.referralCac / c.referralPolicies : 0,
      netValue: c.referralValue - c.referralCac,
      evidence: "Emerging — agent-derived referral intent × benchmark conversion",
    },
    {
      id: "program_led",
      label: "Program-led acquisition (visibility)",
      policies: c.programPolicies,
      annualPremium: c.programPolicies * basePremium,
      newBusinessValue: c.programValue,
      acquisitionCost: c.programCac,
      cacPerPolicy: c.programPolicies > 0 ? c.programCac / c.programPolicies : 0,
      netValue: c.programValue - c.programCac,
      evidence: "Emerging — Vitality precedent; full CAC applied, conservative attribution",
    },
  ];

  // Quarterly phasing: rewards from Q1 (ramped), commercial value lands from Q2.
  const quarters: GrowthQuarter[] = [];
  let cumulative = 0;
  const sellQuarters = Math.max(1, horizonQuarters - 1);
  for (let qi = 1; qi <= horizonQuarters; qi++) {
    const rampFactor = qi === 1 ? 0.6 : 1; // enrolment ramps during Q1
    const rewardCost = (c.rewardCost / (horizonQuarters - 0.4)) * rampFactor;
    const share = qi === 1 ? 0 : 1 / sellQuarters;
    const upsellValue = (c.upsellValue - c.upsellCac) * share;
    const referralValue = (c.referralValue - c.referralCac) * share;
    const programLedValue = (c.programValue - c.programCac) * share;
    const newPolicies = (c.upsellPolicies + c.referralPolicies + c.programPolicies) * share;
    const netCash = upsellValue + referralValue + programLedValue - rewardCost;
    cumulative += netCash;
    quarters.push({
      quarter: qi,
      rewardCost,
      upsellValue,
      referralValue,
      programLedValue,
      newPolicies,
      netCash,
      cumulativeNetCash: cumulative,
    });
  }
  const paybackQuarter = quarters.find((qq) => qq.cumulativeNetCash >= 0)?.quarter ?? null;

  return {
    bookSize: input.bookSize,
    market: input.market,
    horizonQuarters,
    rewardPmpm: input.rewardPmpm,
    enrolledShare: input.enrolledShare,
    engagedShare: b.engagedShare,
    channels,
    quarters,
    paybackQuarter,
    totalNewPolicies: c.upsellPolicies + c.referralPolicies + c.programPolicies,
    totalNewAnnualPremium: channels.reduce((s, ch) => s + ch.annualPremium, 0),
    totalRewardCost: c.rewardCost,
    netValueP5: q(0.05),
    netValueP50: q(0.5),
    netValueP95: q(0.95),
    downsideProbability: nets.filter((v) => v < 0).length / nets.length,
    iterations,
    assumptions: growthAssumptionItems(),
    caveat:
      "Commercial clock only — kept separate from the actuarial book-health ROI. Upsell is credited only above the organic baseline; referral and program-led acquisition use conservative conversion and full life-insurance CAC. Acquisition lift assumptions are Emerging-tier and should be replaced with the insurer's own channel data before any business case.",
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
