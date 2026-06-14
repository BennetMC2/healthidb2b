import type {
  ResolvedPlan,
  BehaviorRates,
  MonteCarloResult,
  NarrativeReport,
} from "@shared/schema";
import { callLlm, configuredModelLabel } from "./llm";

const MODEL = configuredModelLabel();

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
}
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
// Rewards are stored AND presented as USD/member/MONTH (PMPM) — the canonical
// unit everywhere in the app — with the per-year equivalent as a secondary.
const fmtRewardPmpm = (perMonth: number) =>
  `$${perMonth.toFixed(2)} PMPM (${fmtUSD(perMonth * 12)}/member/year)`;
// a reward band as an illustrative range, e.g. "$5–$12 PMPM"
const fmtBand = (range: [number, number] | null) =>
  range ? `$${range[0].toFixed(2)}–$${range[1].toFixed(2)} PMPM` : `a significant range`;

// Decide a verdict from the numbers (the LLM is asked to honour this so the chip
// and the prose never disagree).
function deriveVerdict(
  finance: MonteCarloResult
): NarrativeReport["verdict"] {
  if (!finance.roiAvailable) {
    if (finance.behaviorChange.p50 < 0.08 || finance.downsideProbability > 0.65) return "needs-more-evidence";
    return "pilot-only";
  }
  if (finance.netValueP50 < 0 || finance.downsideProbability > 0.65) return "do-not-proceed";
  if (finance.downsideProbability > 0.4 || finance.roiP50 < 0.1) return "needs-more-evidence";
  if (finance.roiP50 < 0.35) return "pilot-only";
  if (finance.roiP50 < 1) return "proceed-with-constraints";
  return "scale";
}

const VERDICT_GUIDE: Record<NarrativeReport["verdict"], string> = {
  "do-not-proceed": "Do not proceed under the selected assumptions.",
  "needs-more-evidence": "Needs more evidence before launch.",
  "pilot-only": "Pilot only with tight measurement and stop-loss criteria.",
  "proceed-with-constraints": "Proceed with constraints and assumption monitoring.",
  scale: "Scale only if the assumption set is accepted and governance controls are in place.",
};

// ---------------------------------------------------------------------------
// Token-templated numbers.
//
// The LLM never types a digit. Every number it may cite is exposed as a
// digit-free token ({{NET}}, {{ROI_BAND}}, ...) that the server substitutes
// after generation. If the model output contains ANY literal digit, or an
// unknown token survives substitution, we discard it and use the
// deterministic fallback — so the prose can never contradict the panels.
// ---------------------------------------------------------------------------

type TokenMap = Record<string, string>;

function buildTokens(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  finance: MonteCarloResult
): TokenMap {
  const bc = finance.behaviorChange;
  const opt = finance.rewardOptimization;
  const bd = finance.claimsBreakdown;
  return {
    BOOK: plan.bookSize.toLocaleString(),
    MARKET: plan.marketLabel,
    HORIZON: `${plan.horizonMonths} months`,
    REWARD_YR: fmtRewardPmpm(plan.assumedOfferPmpm),
    BC: pct(bc.p50),
    BC_RANGE: `${pct(bc.p5)}–${pct(bc.p95)}`,
    MEMBERS: `~${Math.round(finance.behaviorChangeMembers.p50).toLocaleString()}`,
    ENROLMENT: pct(behavior.enrollmentRate),
    PERSISTENCE: pct(behavior.persistenceRate),
    GROSS: fmtUSD(finance.valueCreatedP50),
    CLAIMS: fmtUSD(finance.claimsSavingsP50),
    PRODUCTIVITY: fmtUSD(bd.productivityValue ?? 0),
    RETENTION: fmtUSD(finance.retentionValueP50),
    REWARD_COST: fmtUSD(finance.rewardToSustainP50),
    ADMIN_COST: fmtUSD(finance.adminCostP50),
    PLATFORM_COST: fmtUSD(finance.platformCostP50),
    COSTS: fmtUSD(finance.totalCostP50),
    NET: fmtUSD(finance.netValueP50),
    ROI: pct(finance.roiP50),
    ROI_BAND: `${pct(finance.roiP5)} / ${pct(finance.roiP50)} / ${pct(finance.roiP95)}`,
    DOWNSIDE: `${(finance.downsideProbability * 100).toFixed(0)}%`,
    NET_RANGE: `${fmtUSD(finance.netValue.p5)} to ${fmtUSD(finance.netValue.p95)}`,
    NET_POSITIVE_RANGE: fmtBand(opt.viableRewardRange),
    WORKS_WELL_BAND: fmtBand(opt.workWellRange),
    BREAK_EVEN: fmtUSD(finance.maxAllInCostP50),
    BREAK_EVEN_PER_MEMBER: `$${finance.maxRewardPmpmP50.toFixed(2)} PMPM/changed member`,
  };
}

const substituteTokens = (text: string, tokens: TokenMap) =>
  text.replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (m, name: string) => tokens[name] ?? m);

// any literal digit before substitution = the model typed a number itself
const hasLiteralDigit = (text: string) => /\d/.test(text);
// any surviving {{ after substitution = unknown token
const hasUnresolvedToken = (text: string) => /\{\{/.test(text);

function buildFactsBlock(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  finance: MonteCarloResult,
  tokens: TokenMap
): string {
  const primary = plan.signalDefinitions?.find((s) => s.signalId === plan.primarySignal) ?? plan.signalDefinitions?.[0];
  const outcome = primary?.outcome ?? "the target health signal";
  const signalNames = plan.signalDefinitions?.map((s) => `${s.displayName} (${s.evidenceTier})`).join(", ") ?? plan.campaignLabel;
  const hasProductivity = (finance.claimsBreakdown.productivityValue ?? 0) > 0;
  const grossLine = hasProductivity
    ? `GROSS VALUE: {{GROSS}} (= ${tokens.GROSS}) = clinical claims savings {{CLAIMS}} (= ${tokens.CLAIMS}) + productivity value {{PRODUCTIVITY}} (= ${tokens.PRODUCTIVITY}) + retention value {{RETENTION}} (= ${tokens.RETENTION}).`
    : `GROSS VALUE: {{GROSS}} (= ${tokens.GROSS}) = clinical claims savings {{CLAIMS}} (= ${tokens.CLAIMS}) + retention value {{RETENTION}} (= ${tokens.RETENTION}).`;
  const common = [
    `Signal plan: ${signalNames} for a {{BOOK}}-member (= ${tokens.BOOK}) ${plan.marketLabel} book over {{HORIZON}} (= ${tokens.HORIZON}). The primary clinical target is ${outcome}; frame "behaviour change" as improvement in ${outcome}, NOT steps unless steps is selected.`,
    finance.roiAvailable
      ? `ALL numbers below were computed at the configured reward of {{REWARD_YR}} (= ${tokens.REWARD_YR}). CAUSAL CHAIN (state it in this order): configured reward -> engagement -> behaviour change -> gross value -> configured costs -> net value. Costs include incentive/reward, admin and platform cost. ROI is net value divided by total cost.`
      : `CAUSAL CHAIN (state it in this order): wearable programme -> engagement -> behaviour change -> gross value -> break-even incentive budget. ROI is NOT available because reward, admin and platform costs were not configured.`,
    `Behaviour-change (HERO): {{BC}} (= ${tokens.BC}) of the book meaningfully improves their ${outcome} (simulation range {{BC_RANGE}} = ${tokens.BC_RANGE}); {{MEMBERS}} (= ${tokens.MEMBERS}) members.`,
    `Enrolment {{ENROLMENT}} (= ${tokens.ENROLMENT}), 12-month persistence {{PERSISTENCE}} (= ${tokens.PERSISTENCE}).`,
    grossLine,
  ];
  if (!finance.roiAvailable) {
    return [
      ...common,
      `INCENTIVE ECONOMICS: not configured. Do NOT mention ROI, net ROI, payback, total cost, or downside probability as an economic result.`,
      `BREAK-EVEN: maximum all-in programme budget is {{BREAK_EVEN}} (= ${tokens.BREAK_EVEN}). Before non-reward costs, this is about {{BREAK_EVEN_PER_MEMBER}} (= ${tokens.BREAK_EVEN_PER_MEMBER}).`,
      `Reward planning curve is exploratory only; it is not the selected business case until the user configures reward/admin/platform costs.`,
    ].join("\n");
  }
  return [
    ...common,
    `COSTS: reward {{REWARD_COST}} (= ${tokens.REWARD_COST}) + admin {{ADMIN_COST}} (= ${tokens.ADMIN_COST}) + platform {{PLATFORM_COST}} (= ${tokens.PLATFORM_COST}) = {{COSTS}} (= ${tokens.COSTS}).`,
    `NET ECONOMICS: net value {{NET}} (= ${tokens.NET}). ROI band low/central/high is {{ROI_BAND}} (= ${tokens.ROI_BAND}); downside probability {{DOWNSIDE}} (= ${tokens.DOWNSIDE}). Net value simulation range: {{NET_RANGE}} (= ${tokens.NET_RANGE}).`,
    `NET-POSITIVE reward range (net value at or above zero): {{NET_POSITIVE_RANGE}} (= ${tokens.NET_POSITIVE_RANGE}). WORKS-WELL band (within four-fifths of peak net value): {{WORKS_WELL_BAND}} (= ${tokens.WORKS_WELL_BAND}). Keep these two bands distinct. If there is no net-positive range, say the design is uneconomic under current assumptions.`,
  ].join("\n");
}

const SYSTEM = `You are the lead actuary at a health-tech insurer (HealthID) writing the executive read-out of a wellness-campaign simulation. You are precise, commercially sharp, and intellectually honest — you never oversell, and you flag downside plainly.

Write for a busy insurance executive. Plain English, no jargon dumps, no markdown, no hedging filler. Be specific and decisive.

CRITICAL NUMBER RULE: you must NEVER write a digit (0-9) yourself. Every number must be cited via its {{TOKEN}} exactly as given in the facts (the "= value" after each token is for your reasoning only). Spell small counts in words ("three drivers"), and refer to estimates as "central estimate" or "simulation range" rather than writing things like P50. Any literal digit in your output will cause it to be discarded.

Return ONLY a compact JSON object, no prose around it, no markdown fences.`;

function parseJson(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("no json");
  return JSON.parse(cleaned.slice(s, e + 1));
}

export async function generateNarrative(
  plan: ResolvedPlan,
  behavior: BehaviorRates,
  finance: MonteCarloResult
): Promise<NarrativeReport> {
  const verdict = deriveVerdict(finance);
  const tokens = buildTokens(plan, behavior, finance);
  const facts = buildFactsBlock(plan, behavior, finance, tokens);
  const atRewardPmpm = plan.assumedOfferPmpm;
  const atRewardPerYear = atRewardPmpm * 12;

  const prompt = `Here are the simulation results for this campaign. Write the executive read-out.

RESULTS (cite numbers ONLY via the {{TOKENS}}; the values in parentheses are for your reasoning, never to be copied)
${facts}

VERDICT (already determined from the numbers — your prose MUST be consistent with it): ${verdict} — ${VERDICT_GUIDE[verdict]}

Write a JSON object with exactly these keys:
{
  "headline": "${finance.roiAvailable ? "<one line: behaviour-change {{BC}}, net value {{NET}}, ROI band {{ROI_BAND}}, and verdict.>" : "<one line: behaviour-change {{BC}}, gross value {{GROSS}}, and 'ROI not yet available'.>"}",
  "summary": "${finance.roiAvailable ? "<2-4 sentences. Walk configured reward {{REWARD_YR}} -> engagement -> behaviour change -> gross value -> costs -> net value. Include {{GROSS}} with its components, {{COSTS}}, {{NET}}, ROI band {{ROI_BAND}} and downside probability {{DOWNSIDE}}.>" : "<2-4 sentences. Walk wearable programme -> engagement -> behaviour change -> gross value. Explicitly say incentive economics are not configured, so ROI is unavailable. Include break-even all-in budget {{BREAK_EVEN}}.>"}",
  "recommendation": "${finance.roiAvailable ? "<1-2 sentences: action using the verdict. Do not advocate bigger rewards by default. Mention whether the scenario should be rejected, piloted, constrained, or scaled.>" : "<1-2 sentences: recommend configuring incentive economics before any proceed/do-not-proceed decision on ROI. Mention whether the behaviour case merits a pilot/design step.>"}",
  "drivers": ["<short driver 1>", "<short driver 2>", "<short driver 3>"],
  "confidence": "<1 sentence: where this estimate is softest (e.g. behaviour-change band, dose-response CI, that it is a calibrated planning estimate not yet backtested)>"
}`;

  try {
    const msg = await callLlm({
      maxTokens: 700,
      temperature: 0.6,
      system: SYSTEM,
      prompt,
    });
    const raw = parseJson(msg.text);
    const fields = {
      headline: String(raw.headline || "").slice(0, 240),
      summary: String(raw.summary || "").slice(0, 900),
      recommendation: String(raw.recommendation || "").slice(0, 600),
      confidence: String(raw.confidence || "").slice(0, 400),
      drivers: Array.isArray(raw.drivers)
        ? raw.drivers.slice(0, 4).map((d: any) => String(d).slice(0, 160))
        : [],
    };
    const allText = [fields.headline, fields.summary, fields.recommendation, fields.confidence, ...fields.drivers];
    if (allText.some((t) => !t) || fields.drivers.length === 0) throw new Error("missing fields");
    // digit guard: the model typed a number itself — numbers may drift, discard
    if (allText.some(hasLiteralDigit)) throw new Error("digit guard");
    const sub = (t: string) => substituteTokens(t, tokens);
    const out = {
      headline: sub(fields.headline),
      summary: sub(fields.summary),
      recommendation: sub(fields.recommendation),
      confidence: sub(fields.confidence),
      drivers: fields.drivers.map(sub),
    };
    if ([out.headline, out.summary, out.recommendation, out.confidence, ...out.drivers].some(hasUnresolvedToken)) {
      throw new Error("unresolved token");
    }
    return { ...out, verdict, atRewardPerYear, atRewardPmpm };
  } catch {
    return fallback(plan, finance, verdict);
  }
}

// Deterministic, numbers-driven fallback if the model call fails or trips the
// digit guard — every figure comes straight from the reconciled spine.
function fallback(
  plan: ResolvedPlan,
  finance: MonteCarloResult,
  verdict: NarrativeReport["verdict"]
): NarrativeReport {
  const bc = finance.behaviorChange;
  const opt = finance.rewardOptimization;
  const net = finance.netValueP50;
  const atRewardPmpm = plan.assumedOfferPmpm;
  const atRewardPerYear = atRewardPmpm * 12;
  const prod = finance.claimsBreakdown.productivityValue ?? 0;
  const grossComponents =
    prod > 0
      ? `${fmtUSD(finance.claimsSavingsP50)} of clinical claims savings, ${fmtUSD(prod)} of productivity value and ${fmtUSD(finance.retentionValueP50)} of retention value`
      : `${fmtUSD(finance.claimsSavingsP50)} of clinical claims savings plus ${fmtUSD(finance.retentionValueP50)} of retention value`;
  if (!finance.roiAvailable) {
    return {
      headline: `${pct(bc.p50)} behaviour change; gross value ${fmtUSD(finance.valueCreatedP50)}; ROI not yet available.`,
      summary: `Under the selected assumptions, ${pct(bc.p50)} of the ${plan.bookSize.toLocaleString()}-member ${plan.marketLabel} book meaningfully improves (simulation range ${pct(
        bc.p5
      )}–${pct(bc.p95)}). Gross value is ${fmtUSD(finance.valueCreatedP50)} — ${grossComponents}. Reward, admin and platform costs have not been configured, so net ROI is unavailable; the break-even all-in budget is ${fmtUSD(finance.maxAllInCostP50)}.`,
      recommendation: `Configure the incentive design before making an ROI decision. ${VERDICT_GUIDE[verdict]}`,
      verdict,
      atRewardPerYear,
      atRewardPmpm,
      drivers: [
        `Behaviour change ${pct(bc.p50)} (simulation range ${pct(bc.p5)}–${pct(bc.p95)})`,
        `Gross value ${fmtUSD(finance.valueCreatedP50)} before incentive, admin and platform costs`,
        `Break-even all-in programme budget ${fmtUSD(finance.maxAllInCostP50)}`,
      ],
      confidence: `Impact-only planning estimate — ROI requires configured reward, admin and platform costs plus validation against observed programme data.`,
    };
  }
  return {
    headline: `${pct(bc.p50)} behaviour change; net value ${fmtUSD(net)}; ROI band ${pct(finance.roiP5)} / ${pct(finance.roiP50)} / ${pct(finance.roiP95)}.`,
    summary: `At the configured reward of ${fmtRewardPmpm(plan.assumedOfferPmpm)}, ${pct(bc.p50)} of the ${plan.bookSize.toLocaleString()}-member ${plan.marketLabel} book meaningfully improves (simulation range ${pct(
      bc.p5
    )}–${pct(bc.p95)}). Gross value is ${fmtUSD(finance.valueCreatedP50)} — ${grossComponents}. Costs are ${fmtUSD(finance.totalCostP50)}, leaving net value ${fmtUSD(net)} with ROI band ${pct(finance.roiP5)} / ${pct(finance.roiP50)} / ${pct(finance.roiP95)} and ${(finance.downsideProbability * 100).toFixed(0)}% downside probability.`,
    recommendation: `${VERDICT_GUIDE[verdict]} ${opt.viableRewardRange ? `The net-positive reward range is roughly ${fmtBand(opt.viableRewardRange)}.` : `No tested reward level is net-positive under the selected assumptions.`}`,
    verdict,
    atRewardPerYear,
    atRewardPmpm,
    drivers: [
      `Behaviour change ${pct(bc.p50)} (simulation range ${pct(bc.p5)}–${pct(bc.p95)})`,
      `Gross value ${fmtUSD(finance.valueCreatedP50)} minus total cost ${fmtUSD(finance.totalCostP50)} = net ${fmtUSD(net)}`,
      `Downside probability ${(finance.downsideProbability * 100).toFixed(0)}%; net-positive reward range ${fmtBand(opt.viableRewardRange)}`,
    ],
    confidence: `Illustrative planning estimate — validate assumptions and observed programme data before using for pricing, reserving or committee approval.`,
  };
}
