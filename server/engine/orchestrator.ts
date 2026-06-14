import type { Market, ResolvedPlan, SignalId } from "@shared/schema";
import { HP_PER_USD } from "@shared/schema";
import { callLlm, configuredModelLabel } from "./llm";
import { allSignals, FUSIONS, getFusion, getSignal, maybeSignal, primarySignalFor } from "./registry";

export const ORCHESTRATOR_MODEL = configuredModelLabel();

export const DEFAULT_ASSUMED_OFFER_PMPM = 12;

const PARSE_SYSTEM = `You are the planning step of an AI actuarial agent for HealthID. Select one or more verified health signals from the live Signal Registry. You may select a fusion/composite when the goal needs corroboration. Do not invent signal IDs. Do not set reward; reward is derived downstream. Return only compact JSON.`;

function registryBrief() {
  return allSignals()
    .map((s) => `${s.signalId}: ${s.displayName}; category=${s.category}; tier=${s.evidenceTier}; lever=${s.behaviourLever}`)
    .join("\n");
}

function fusionBrief() {
  return FUSIONS.map((f) => `${f.fusionId}: ${f.displayName}; components=${f.components.map((c) => `${c.signalId}:${c.weight}`).join(",")}`)
    .join("\n");
}

function parsePrompt(goal: string): string {
  return `GOAL: "${goal}"

SIGNAL REGISTRY
${registryBrief()}

FUSIONS
${fusionBrief()}

Return JSON exactly:
{
  "signals": ["signalId", "..."],
  "fusion": "fusionId or empty string",
  "primarySignal": "signalId",
  "market": "HK" or "SG",
  "bookSize": integer number of members (infer from goal, else 100000),
  "horizonMonths": integer (default 12),
  "targetHighRisk": true ONLY if the goal explicitly targets least-active / sedentary / high-risk / unhealthy members rather than the whole book, else false,
  "objective": "one-sentence restatement of the insurer's business outcome"
}

Rules:
- If the goal explicitly names registry signals (e.g. "Reward verified improvement in VO2 Max, Steps and Sleep Regularity"), select exactly those named signals — all of them, nothing else.
- Choose multiple signals when the business outcome is broad.
- Cardio/CVD/fitness/resilience should prefer vo2max plus resting_hr and hrv; use cardio_autonomic_index when corroboration is needed.
- Diabetes/metabolic risk should use hba1c and glucose_tir.
- Recovery/resilience should use sleep_regularity, hrv and resting_hr; use recovery_resilience_index for group/employer resilience.
- Frailty/fall risk should use gait_speed and may include steps, but gait_speed is primary.
- Only make steps primary when the user explicitly asks for steps, walking volume, or step count.
- Unknown but insurance-relevant goals should select a sensible category set, not a single step challenge.
- Respect explicit market, book size and horizon.`;
}

function jsonFrom(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(s, e + 1));
}

function numberFromGoal(g: string): number {
  const sizeMatch = g.match(
    /([\d.]+)\s*(k|thousand|m|million)?(?:\s+(?:hk|hong kong|sg|singapore))?\s*(member|members|book|lives|life)/
  );
  if (sizeMatch) {
    let n = parseFloat(sizeMatch[1]);
    if (/k|thousand/.test(sizeMatch[2] || "")) n *= 1000;
    if (/m|million/.test(sizeMatch[2] || "")) n *= 1000000;
    return Math.round(n);
  }
  const kMatch = g.match(/([\d.]+)\s*k\b/);
  return kMatch ? Math.round(parseFloat(kMatch[1]) * 1000) : 100000;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Signals the user named explicitly (by display name, short name or id) are a
// hard constraint on the plan: the signal-library "use in goal" flow and any
// hand-typed signal list must survive parsing verbatim, never collapsed to a
// single category heuristic or re-interpreted by the planning model.
export function explicitSignalsFromGoal(goal: string): SignalId[] {
  const g = goal.toLowerCase();
  const found: { id: SignalId; idx: number }[] = [];
  for (const s of allSignals()) {
    const aliases = [s.displayName, s.shortName, s.signalId, s.signalId.replace(/_/g, " ")];
    let first = -1;
    for (const alias of aliases) {
      const m = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(alias.toLowerCase())}(?:$|[^a-z0-9])`).exec(g);
      if (m && (first < 0 || m.index < first)) first = m.index;
    }
    if (first >= 0) found.push({ id: s.signalId, idx: first });
  }
  return found.sort((a, b) => a.idx - b.idx).map((f) => f.id);
}

function heuristicSignals(goal: string): { signals: SignalId[]; fusion?: SignalId; primarySignal: SignalId } {
  const explicit = explicitSignalsFromGoal(goal);
  if (explicit.length) {
    return { signals: explicit, primarySignal: explicit[0] };
  }
  const g = goal.toLowerCase();
  if (/diabet|hba1c|sugar|glucose|metabolic|pre-?diabet/.test(g)) {
    return { signals: ["hba1c", "glucose_tir"], primarySignal: "hba1c" };
  }
  if (/frailty|fall|senior|gait|walking-speed|walking speed/.test(g)) {
    return { signals: ["gait_speed", "steps"], primarySignal: "gait_speed" };
  }
  if (/sleep|recovery|resilience|burnout|stress|hrv/.test(g)) {
    return { signals: ["sleep_regularity", "hrv", "resting_hr"], fusion: "recovery_resilience_index", primarySignal: "sleep_regularity" };
  }
  if (/cardiac|heart|cvd|cardio|vo2|fitness|premium|underwriting|re-price|reprice|risk/.test(g)) {
    return { signals: ["vo2max", "resting_hr", "hrv", "respiratory_rate"], fusion: "cardio_autonomic_index", primarySignal: "vo2max" };
  }
  if (/blood pressure|\bbp\b|hypertension/.test(g)) {
    return { signals: ["bp", "resting_hr"], primarySignal: "bp" };
  }
  if (/step count|steps|walking volume|walk/.test(g)) {
    return { signals: ["steps", "vo2max"], primarySignal: "steps" };
  }
  if (/acqui|open pool|verified|trust|proof|clinically/.test(g)) {
    return { signals: ["hba1c", "bp", "vo2max"], primarySignal: "hba1c" };
  }
  return { signals: ["vo2max", "resting_hr", "hrv"], fusion: "cardio_autonomic_index", primarySignal: "vo2max" };
}

function heuristicTargetHighRisk(goal: string): boolean {
  return /high[- ]?risk|least[- ]?active|inactive|sedentary|low[- ]?activity|unhealthy|worst[- ]?risk|chronic/.test(
    goal.toLowerCase()
  );
}

function sanitizeSignals(rawSignals: unknown, fallback: SignalId[]): SignalId[] {
  const arr = Array.isArray(rawSignals) ? rawSignals : [];
  const valid = arr.map(String).filter((id) => !!maybeSignal(id));
  const deduped = Array.from(new Set(valid));
  return deduped.length ? deduped : fallback;
}

function buildPlan(p: {
  signals: SignalId[];
  fusion?: SignalId;
  primarySignal?: SignalId;
  market: Market;
  bookSize: number;
  horizonMonths: number;
  targetHighRisk?: boolean;
  objective: string;
}): ResolvedPlan {
  const validSignals = sanitizeSignals(p.signals, ["vo2max", "resting_hr", "hrv"]);
  const primary = maybeSignal(p.primarySignal) && validSignals.includes(p.primarySignal!) ? getSignal(p.primarySignal!) : primarySignalFor(validSignals);
  const fusion = getFusion(p.fusion);
  const defs = validSignals.map(getSignal);
  const probeReward = defs.reduce((sum, s) => sum + s.probeReward, 0) / Math.max(1, defs.length);
  return {
    signals: validSignals,
    fusion: fusion?.fusionId,
    primarySignal: primary.signalId,
    campaign: primary.signalId,
    campaignLabel: primary.displayName,
    signalDefinitions: defs,
    fusionDefinition: fusion,
    market: p.market,
    marketLabel: p.market === "SG" ? "Singapore" : "Hong Kong",
    bookSize: Math.max(1000, Math.round(p.bookSize)),
    horizonMonths: Math.max(1, Math.round(p.horizonMonths)),
    sampleSize: 100,
    targetHighRisk: !!p.targetHighRisk,
    objective: p.objective,
    probeReward,
    probeRewardHp: probeReward * HP_PER_USD,
    assumedOfferPmpm: probeReward,
  };
}

export function resolvePlanHeuristic(goal: string): ResolvedPlan {
  const g = goal.toLowerCase();
  const selected = heuristicSignals(goal);
  const market: Market = /singapore|sg\b/.test(g) ? "SG" : "HK";
  const horizonMatch = g.match(/([\d]+)\s*(?:month|mo)\b/);
  const horizon = horizonMatch ? parseInt(horizonMatch[1], 10) : 12;
  return buildPlan({
    ...selected,
    market,
    bookSize: numberFromGoal(g),
    horizonMonths: horizon,
    targetHighRisk: heuristicTargetHighRisk(goal),
    objective: goal,
  });
}

export async function resolvePlan(goal: string, sampleSize: number): Promise<ResolvedPlan> {
  let plan: ResolvedPlan;
  try {
    const msg = await callLlm({
      maxTokens: 420,
      system: PARSE_SYSTEM,
      prompt: parsePrompt(goal),
    });
    const raw = jsonFrom(msg.text) as {
      signals?: unknown;
      fusion?: unknown;
      primarySignal?: unknown;
      market?: unknown;
      bookSize?: unknown;
      horizonMonths?: unknown;
      targetHighRisk?: unknown;
      objective?: unknown;
    };
    const fallback = heuristicSignals(goal);
    // Explicitly named signals override whatever the planning model picked:
    // the user's selection is a hard constraint, not a suggestion.
    const explicit = explicitSignalsFromGoal(goal);
    const signals = explicit.length ? explicit : sanitizeSignals(raw.signals, fallback.signals);
    const candidateFusion = typeof raw.fusion === "string" && getFusion(raw.fusion) ? raw.fusion : fallback.fusion;
    // An explicit signal selection only carries a fusion when every component
    // is actually in the plan — otherwise the corroboration credit is unearned.
    const fusion =
      explicit.length && candidateFusion && !getFusion(candidateFusion)!.components.every((c) => signals.includes(c.signalId))
        ? undefined
        : candidateFusion;
    const primarySignal =
      typeof raw.primarySignal === "string" && signals.includes(raw.primarySignal)
        ? raw.primarySignal
        : signals.includes(fallback.primarySignal)
          ? fallback.primarySignal
          : signals[0];
    plan = buildPlan({
      signals,
      fusion,
      primarySignal,
      market: raw.market === "SG" ? "SG" : "HK",
      bookSize: Number(raw.bookSize) || 100000,
      horizonMonths: Number(raw.horizonMonths) || 12,
      targetHighRisk: raw.targetHighRisk === true || heuristicTargetHighRisk(goal),
      objective: String(raw.objective || goal),
    });
    plan.parseMode = "llm";
    plan.llmModel = msg.model;
  } catch (err: unknown) {
    plan = resolvePlanHeuristic(goal);
    plan.parseMode = "heuristic";
    plan.llmModel = ORCHESTRATOR_MODEL;
    plan.fallbackReason = err instanceof Error ? err.message.slice(0, 180) : "plan parser model call unavailable";
  }
  // Cap matches MAX_AGENT_SAMPLE in routes.ts — clamping lower here silently
  // defeats the ≥200-agent synthetic-RCT reward arms.
  plan.sampleSize = Math.max(12, Math.min(600, sampleSize || 100));
  return plan;
}
