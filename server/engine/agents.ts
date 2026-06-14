import type {
  MemberAgent,
  AgentDecision,
  Decision,
  ResolvedPlan,
  BehaviorRates,
  BehaviorSegment,
  RewardCurveShape,
  DoseResponseArm,
} from "@shared/schema";
import { callLlm, configuredModelLabel, type LlmProvider } from "./llm";
import { getSignal } from "./registry";

const GROQ_AGENT_MODEL = process.env.GROQ_AGENT_MODEL || "llama-3.1-8b-instant";
const GLM_AGENT_MODEL = process.env.GLM_AGENT_MODEL || "glm-4.5-flash";
const ANTHROPIC_AGENT_MODEL = process.env.ANTHROPIC_AGENT_MODEL || "claude-haiku-4-5";

// Primary agent provider: Anthropic (Haiku) when a key is present — highest
// reliability and persona quality — then Groq, then GLM as failover. Override
// with AGENT_PRIMARY_PROVIDER=groq|glm|anthropic.
const AGENT_PRIMARY = ((): LlmProvider => {
  const forced = process.env.AGENT_PRIMARY_PROVIDER as LlmProvider | undefined;
  if (forced === "groq" || forced === "glm" || forced === "anthropic") return forced;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GLM_API_KEY) return "glm";
  return "groq";
})();
const AGENT_PROVIDER_ORDER: LlmProvider[] =
  AGENT_PRIMARY === "anthropic"
    ? ["anthropic", "groq", "glm"]
    : AGENT_PRIMARY === "glm"
      ? ["glm", "groq", "anthropic"]
      : ["groq", "glm", "anthropic"];
export const AGENT_MODEL =
  AGENT_PRIMARY === "anthropic"
    ? ANTHROPIC_AGENT_MODEL
    : AGENT_PRIMARY === "glm"
      ? GLM_AGENT_MODEL
      : process.env.GROQ_API_KEY
        ? GROQ_AGENT_MODEL
        : configuredModelLabel();
const FAILOVER_KEYS = [process.env.ANTHROPIC_API_KEY, process.env.GROQ_API_KEY, process.env.GLM_API_KEY].filter(Boolean).length;
export const AGENT_PROVIDER_LABEL = FAILOVER_KEYS > 1 ? `${AGENT_MODEL} with provider failover` : AGENT_MODEL;

function signalBehaviour(plan: ResolvedPlan): { task: string; intensity: string; signalList: string } {
  const defs = (plan.signals?.length ? plan.signals : [plan.primarySignal ?? plan.campaign]).map(getSignal);
  const primary = getSignal(plan.primarySignal ?? plan.campaign);
  return {
    task: defs.map((s) => s.behaviourLever).join(" Combined with: "),
    intensity: `0 = no real change in ${primary.outcome}; 0.5 = partial or inconsistent improvement; 1 = large, sustained improvement in the selected signal set`,
    signalList: defs.map((s) => `${s.displayName} (${s.evidenceTier}, trust ${s.trustCeiling})`).join(", "),
  };
}

// The reward THIS agent is actually shown: its synthetic-RCT arm when arms
// are active, otherwise the run-level offer.
function effectiveOffer(agent: MemberAgent, plan: ResolvedPlan): number {
  return agent.armRewardPmpm ?? plan.assumedOfferPmpm;
}

// Vary how the incentive is framed per agent so reasoning doesn't all open on
// the dollar amount. The cash value is identical; only the wording differs.
// A $0 reward is framed honestly — no cash, only the programme itself — so the
// zero arm of the synthetic RCT measures intrinsic motivation, not confusion.
function rewardFraming(reward: number, variant: number): string {
  if (reward <= 0) {
    const z = [
      `no cash reward — just the app, the coaching and your own health goals`,
      `no financial incentive this time; the programme itself (tracking, coaching, insights) is the offer`,
      `nothing paid out — you'd be doing this for your health, not for money`,
    ];
    return z[variant % z.length];
  }
  const v = [
    `a reward worth about US$${reward}/month (gift cards or a premium rebate) for staying engaged`,
    `a small monthly perk — roughly US$${reward} in gift cards / premium credit — if you keep it up`,
    `up to ~US$${reward} a month back as a premium discount or vouchers while you stay active`,
    `a modest incentive (around US$${reward}/mo in rebates or rewards points) tied to staying engaged`,
    `points/vouchers adding up to about US$${reward} a month if you stick with it`,
  ];
  return v[variant % v.length];
}

function decisionFrom(enrolled: boolean, weeksEngaged: number, persisted: boolean, horizonWeeks: number): Decision {
  if (!enrolled) return "nonstarter";
  if (weeksEngaged >= horizonWeeks * 0.4) return "engaged";
  return "dropped";
}

const SYSTEM = `You are role-playing ONE specific ordinary insurance plan member invited to an insurer wellness campaign. Decide as THIS person would, not as an idealized health-optimizer.

HOW REAL PEOPLE DECIDE:
- Weigh BOTH motives: the money on offer AND the person's own wish to be healthier — more energy, a health scare, family, vanity, a doctor's warning. Some people would do this for free; some won't do it for any reward; many sit in between.
- Low motivation, high time pressure, low tech comfort, or no wearable usually means no enrolment — good intentions lose to busy weeks.
- Enthusiasm fades. Sticking with it for a year is the exception, not the rule, unless the habit pays off in how the person feels.
- A bigger reward mostly moves marginal, price-driven members. Money rarely converts someone with zero interest, and the already-committed were in anyway.
- Judge whether the asked behaviour is FEASIBLE for this person's job, schedule and health. Someone already on their feet all day gains little from a step target; rotating or night shifts make sleep-regularity goals nearly impossible; chronic pain or a heart condition limits intense effort; a desk worker has the most step headroom but maybe the least time.

Decide from THIS person's life and traits. Do not aim for any particular average — the population statistics emerge from many individual decisions.

VOICE: first person, concrete to the member's life, short, varied. Do not start with "As a", "Being", "Honestly", or the reward amount.

Return only compact JSON, no prose, no markdown fences.`;

function rngFor(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPrompt(agent: MemberAgent, plan: ResolvedPlan, horizonWeeks: number): string {
  const beh = signalBehaviour(plan);
  const offer = effectiveOffer(agent, plan);
  const framing = rewardFraming(offer, agent.id);
  return `PERSONA (member #${agent.id})
- ${agent.personaBlurb}
- Owns a wearable already: ${agent.wearableOwner ? "yes" : "no"}
- Latent traits (0-1): motivation ${agent.motivation}, conscientiousness ${agent.conscientiousness}, time-pressure ${agent.timePressure}, tech-savvy ${agent.techSavvy}, health-anxiety ${agent.healthAnxiety}, financial-pressure ${agent.financialPressure}

CAMPAIGN OFFER (${plan.marketLabel})
- Type: ${plan.campaignLabel}
- Signals: ${beh.signalList}
- What it asks of you: ${beh.task}
- Support: an AI health companion in the insurer's app — personalised coaching, plain-language insights from your own data, and reminders that adapt to your week
- Incentive: ${framing}
- Duration considered: ${plan.horizonMonths} months (${horizonWeeks} weeks)

As THIS exact person, decide what realistically happens — weighing both the incentive and how much YOU actually want to be healthier. Be honest about whether the busy reality of this life leaves room for it.

If you DO engage, judge effort_intensity (0..1) — how hard you actually work the target behaviour: ${beh.intensity}.

Also judge reward_sensitivity: how much would a BIGGER reward change THIS person's decision? (1.0 = the incentive is the deciding factor; 0.0 = money is irrelevant — they're either already in or will never bother regardless.)

Return JSON exactly:
{"enroll_likelihood": <0..1 realistic probability THIS persona signs up>, "weeks_engaged_if_enrolled": <int 0-${horizonWeeks}>, "persist_likelihood_if_enrolled": <0..1 chance still active at 12mo>, "effort_intensity": <0..1 adherence/effort if engaged, 0 if not>, "avg_step_increase": <int daily steps gained if engaged AND steps is one selected signal, else 0>, "reward_sensitivity": <0..1>, "reasoning": "<1-2 sentence FIRST-PERSON line in THIS person's distinct voice; do NOT open by quoting the reward amount>"}`;
}

function parseJson(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function parseJsonValue(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const objStart = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  const start =
    objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
  if (start === -1) throw new Error("no json");
  const end = cleaned[start] === "[" ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
  if (end === -1) throw new Error("no json end");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callModel(agent: MemberAgent, plan: ResolvedPlan, horizonWeeks: number, nudge: string): Promise<any> {
  const msg = await callLlm({
    maxTokens: 260,
    temperature: 1,
    model: AGENT_MODEL,
    system: SYSTEM + nudge,
    prompt: buildPrompt(agent, plan, horizonWeeks),
  });
  return parseJson(msg.text);
}

function decisionFromRaw(
  raw: any,
  agent: MemberAgent,
  plan: ResolvedPlan,
  horizonWeeks: number,
  reasoningOverride?: string
): AgentDecision {
  const rng = rngFor(agent.id * 911 + Math.round((effectiveOffer(agent, plan) + plan.bookSize) % 9973));
  const enrollP = Math.max(0, Math.min(1, Number(raw.enroll_likelihood)));
  const enrolled = rng() < enrollP;
  const weeksIf = Math.max(0, Math.min(horizonWeeks, Math.round(Number(raw.weeks_engaged_if_enrolled) || 0)));
  const persistP = Math.max(0, Math.min(1, Number(raw.persist_likelihood_if_enrolled) || 0));
  const persisted = enrolled && rng() < persistP;
  const weeksEngaged = enrolled
    ? persisted
      ? Math.max(weeksIf, Math.round(horizonWeeks * 0.7))
      : Math.min(Math.max(weeksIf, 1), Math.round(horizonWeeks * 0.55))
    : 0;
  const stepInc = Math.max(0, Math.round(Number(raw.avg_step_increase) || 0));
  const rewardSensitivity = Math.max(0, Math.min(1, Number(raw.reward_sensitivity) ?? 0.5));
  const effortIntensity = enrolled ? clamp01(Number(raw.effort_intensity) || 0) : 0;
  const reasoning = String(reasoningOverride ?? raw.reasoning ?? "").slice(0, 320);
  return {
    agentId: agent.id,
    decision: decisionFrom(enrolled, weeksEngaged, persisted, horizonWeeks),
    enrolled,
    weeksEngaged,
    persisted12mo: persisted,
    avgStepIncrease: enrolled && plan.signals?.includes("steps") ? stepInc : 0,
    effortIntensity,
    rewardSensitivity,
    enrollLikelihood: enrollP,
    persistLikelihood: persistP,
    armRewardPmpm: effectiveOffer(agent, plan),
    reasoning: reasoning || "(LLM returned no reasoning)",
    agent,
    mode: "llm",
  };
}

function heuristicDecision(
  agent: MemberAgent,
  plan: ResolvedPlan,
  horizonWeeks: number,
  reason: string
): AgentDecision {
  // Intrinsic motives (motivation, tech comfort, owning a wearable) carry the
  // base; the reward adds a monotone nudge that matters most for financially
  // pressured members — so even the fallback exhibits a dose-response.
  const offer = effectiveOffer(agent, plan);
  const rewardNudge = Math.min(1, offer / 60) * (0.06 + 0.12 * agent.financialPressure);
  const enroll =
    agent.motivation * 0.5 + agent.techSavvy * 0.2 + (agent.wearableOwner ? 0.2 : 0) - agent.timePressure * 0.2 + rewardNudge;
  const enrolled = enroll > 0.45;
  const weeks = enrolled ? Math.round(horizonWeeks * (0.3 + agent.conscientiousness * 0.6)) : 0;
  const persisted = enrolled && agent.conscientiousness > 0.55;
  return {
    agentId: agent.id,
    decision: decisionFrom(enrolled, weeks, persisted, horizonWeeks),
    enrolled,
    weeksEngaged: weeks,
    persisted12mo: persisted,
    avgStepIncrease: enrolled && plan.signals?.includes("steps") ? Math.round(800 + agent.motivation * 1400) : 0,
    effortIntensity: enrolled ? clamp01(0.35 + agent.conscientiousness * 0.45 + agent.motivation * 0.2) : 0,
    rewardSensitivity: clamp01(0.7 - agent.motivation * 0.4 + agent.financialPressure * 0.3),
    enrollLikelihood: clamp01(enroll),
    persistLikelihood: clamp01(agent.conscientiousness),
    armRewardPmpm: offer,
    reasoning: "(heuristic fallback — model call unavailable)",
    agent,
    mode: "heuristic",
    fallbackReason: reason,
  };
}

export async function runAgent(
  agent: MemberAgent,
  plan: ResolvedPlan,
  isSimilar?: (text: string) => boolean
): Promise<AgentDecision> {
  const horizonWeeks = Math.round(plan.horizonMonths * 4.33);
  try {
    let raw = await callModel(agent, plan, horizonWeeks, "");
    let reasoning = String(raw.reasoning || "").slice(0, 320);
    // Lightweight de-duplication: if this reasoning reads near-identical to an
    // already-seen one, regenerate once with an explicit instruction to differ.
    if (isSimilar && isSimilar(reasoning)) {
      try {
        const raw2 = await callModel(
          agent,
          plan,
          horizonWeeks,
          "\n\nIMPORTANT: Your previous phrasing was too similar to other members. Rewrite the reasoning in a markedly different voice, length and structure — lean hard on this person's specific job, district and situation."
        );
        const r2 = String(raw2.reasoning || "").slice(0, 320);
        if (r2 && !isSimilar(r2)) {
          raw = raw2;
          reasoning = r2;
        }
      } catch {
        /* keep first attempt */
      }
    }

    return decisionFromRaw(raw, agent, plan, horizonWeeks, reasoning);
  } catch (err: any) {
    return heuristicDecision(
      agent,
      plan,
      horizonWeeks,
      err?.message ? String(err.message).slice(0, 180) : "model call unavailable"
    );
  }
}

function buildBatchPrompt(agents: MemberAgent[], plan: ResolvedPlan, horizonWeeks: number): string {
  const beh = signalBehaviour(plan);
  const personaLines = agents
    .map((agent) => {
      const framing = rewardFraming(effectiveOffer(agent, plan), agent.id);
      return `#${agent.id}: ${agent.age}${agent.sex} steps=${agent.baselineSteps} wearable=${agent.wearableOwner ? "Y" : "N"} job=${agent.occupation} area=${agent.district} family=${agent.family} health=${agent.healthHistory} attitude=${agent.attitude} traits=${agent.motivation}/${agent.conscientiousness}/${agent.timePressure}/${agent.techSavvy}/${agent.healthAnxiety}/${agent.financialPressure} incentive=${framing}`;
    })
    .join("\n\n");

  return `Decide independently for each member. Each member's "incentive=" field is THEIR offer — incentives may differ between members; judge each one against the incentive that member was actually given, weighing both the money and that member's own wish to be healthier.

Offer: ${plan.marketLabel}; ${plan.campaignLabel}; signals=${beh.signalList}; task=${beh.task}; support=AI health companion app (personalised coaching, insights from the member's own data, adaptive reminders); horizon=${plan.horizonMonths}mo/${horizonWeeks}wk; effort=${beh.intensity}

MEMBERS
${personaLines}

Return JSON exactly. Use compact array rows to reduce tokens:
{
  "decisions": [
    [<id>, <enroll_likelihood 0..1>, <weeks_engaged_if_enrolled 0-${horizonWeeks}>, <persist_likelihood_if_enrolled 0..1>, <effort_intensity 0..1>, <avg_step_increase if steps else 0>, <reward_sensitivity 0..1>, "<max 10 words, first-person, concrete>"]
  ]
}

Return one decision for every member id: ${agents.map((a) => a.id).join(", ")}.`;
}

function rawFromBatchRow(row: any): any {
  if (!Array.isArray(row)) return row;
  return {
    agent_id: row[0],
    enroll_likelihood: row[1],
    weeks_engaged_if_enrolled: row[2],
    persist_likelihood_if_enrolled: row[3],
    effort_intensity: row[4],
    avg_step_increase: row[5],
    reward_sensitivity: row[6],
    reasoning: row[7],
  };
}

export async function runAgentBatch(agents: MemberAgent[], plan: ResolvedPlan): Promise<AgentDecision[]> {
  const horizonWeeks = Math.round(plan.horizonMonths * 4.33);
  if (agents.length === 0) return [];
  try {
    const msg = await callLlm({
      maxTokens: Math.min(4200, 260 + agents.length * 75),
      temperature: 0.9,
      model: AGENT_MODEL,
      maxRetries: 0,
      providerOrder: AGENT_PROVIDER_ORDER,
      providerModels: { glm: GLM_AGENT_MODEL, groq: GROQ_AGENT_MODEL, anthropic: ANTHROPIC_AGENT_MODEL },
      system:
        SYSTEM +
        "\n\nBatch mode: role-play each member individually. Return only the requested JSON object with decisions array.",
      prompt: buildBatchPrompt(agents, plan, horizonWeeks),
    });
    const parsed = parseJsonValue(msg.text);
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.decisions) ? parsed.decisions : [];
    const byId = new Map<number, any>();
    for (const row of rows) {
      const raw = rawFromBatchRow(row);
      const id = Number(raw?.agent_id ?? raw?.agentId ?? raw?.id);
      if (Number.isFinite(id)) byId.set(id, raw);
    }
    return agents.map((agent) => {
      const raw = byId.get(agent.id);
      if (!raw) {
        return heuristicDecision(agent, plan, horizonWeeks, "batch model response omitted this agent");
      }
      try {
        return decisionFromRaw(raw, agent, plan, horizonWeeks);
      } catch (err: any) {
        return heuristicDecision(
          agent,
          plan,
          horizonWeeks,
          err?.message ? String(err.message).slice(0, 180) : "invalid batch model decision"
        );
      }
    });
  } catch (err: any) {
    const reason = err?.message ? String(err.message).slice(0, 500) : "batch model call unavailable";
    return agents.map((agent) => heuristicDecision(agent, plan, horizonWeeks, reason));
  }
}

export async function runAgentBatchStrict(agents: MemberAgent[], plan: ResolvedPlan): Promise<AgentDecision[]> {
  const horizonWeeks = Math.round(plan.horizonMonths * 4.33);
  if (agents.length === 0) return [];
  const msg = await callLlm({
    maxTokens: Math.min(4200, 260 + agents.length * 75),
    temperature: 0.9,
    model: AGENT_MODEL,
    maxRetries: 0,
    providerOrder: AGENT_PROVIDER_ORDER,
    providerModels: { glm: GLM_AGENT_MODEL, groq: GROQ_AGENT_MODEL, anthropic: ANTHROPIC_AGENT_MODEL },
    system:
      SYSTEM +
      "\n\nBatch mode: role-play each member individually. Return only the requested JSON object with decisions array.",
    prompt: buildBatchPrompt(agents, plan, horizonWeeks),
  });
  const parsed = parseJsonValue(msg.text);
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.decisions) ? parsed.decisions : [];
  const byId = new Map<number, any>();
  for (const row of rows) {
    const raw = rawFromBatchRow(row);
    const id = Number(raw?.agent_id ?? raw?.agentId ?? raw?.id);
    if (Number.isFinite(id)) byId.set(id, raw);
  }
  return agents.map((agent) => {
    const raw = byId.get(agent.id);
    if (!raw) throw new Error(`batch model response omitted agent ${agent.id}`);
    return decisionFromRaw(raw, agent, plan, horizonWeeks);
  });
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

// ---------------------------------------------------------------------------
// Similarity guard — a lightweight token-overlap detector used to flag near
// duplicate reasoning lines so they can be regenerated. Not semantic, but fast
// and good enough to catch templated repetition.
// ---------------------------------------------------------------------------
export function makeSimilarityGuard(threshold = 0.62) {
  const seen: Set<string>[] = [];
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  return {
    isSimilar(text: string): boolean {
      if (!text || text.length < 12) return false;
      const tok = tokenize(text);
      const tokArr = Array.from(tok);
      for (const s of seen) {
        const sArr = Array.from(s);
        const inter = tokArr.filter((w) => s.has(w)).length;
        const union = new Set(tokArr.concat(sArr)).size || 1;
        if (inter / union >= threshold) return true;
      }
      return false;
    },
    add(text: string) {
      seen.push(tokenize(text));
    },
  };
}

// Wilson-style proportion CI
function propCI(p: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (center - margin) / denom), Math.min(1, (center + margin) / denom)];
}

function meanCI(values: number[]): [number, number] {
  const n = values.length;
  if (n === 0) return [0, 0];
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n - 1));
  const se = sd / Math.sqrt(n);
  return [mean - 1.96 * se, mean + 1.96 * se];
}

// ---------------------------------------------------------------------------
// Heterogeneity aggregates — the part of the model only the agents can supply.
// ---------------------------------------------------------------------------

// Reward→engagement curve SHAPE from per-agent likelihood × sensitivity:
//   at reward→0   an agent keeps engaging with prob p_i·(1−s_i)  (money-indifferent share)
//   at reward→∞   an agent engages with prob p_i + (1−p_i)·s_i   (money was the constraint)
// Expressed as ratios of the observed engagement level so calibration of the
// LEVEL doesn't destroy the agent-derived SHAPE.
function deriveRewardCurveShape(decisions: AgentDecision[]): RewardCurveShape | undefined {
  const withLik = decisions.filter((d) => d.enrollLikelihood != null);
  if (withLik.length < 8) return undefined;
  let pSum = 0;
  let floorSum = 0;
  let capSum = 0;
  for (const d of withLik) {
    const p = Math.min(1, Math.max(0, d.enrollLikelihood!));
    const s = Math.min(1, Math.max(0, d.rewardSensitivity));
    pSum += p;
    floorSum += p * (1 - s);
    capSum += p + (1 - p) * s;
  }
  if (pSum <= 1e-6) return undefined;
  return {
    floorShare: Math.min(1, floorSum / pSum),
    capShare: Math.max(1, capSum / pSum),
  };
}

function segmentStats(id: string, label: string, members: AgentDecision[]): BehaviorSegment | null {
  const n = members.length;
  if (n < 5) return null; // too small to say anything
  const enrolled = members.filter((d) => d.enrolled).length;
  const engaged = members.filter((d) => d.decision === "engaged").length;
  const sens = members.reduce((s, d) => s + d.rewardSensitivity, 0) / n;
  return {
    id,
    label,
    n,
    enrollmentRate: enrolled / n,
    engagedRate: engaged / n,
    meanRewardSensitivity: sens,
  };
}

function deriveSegments(decisions: AgentDecision[]): BehaviorSegment[] {
  const segments: (BehaviorSegment | null)[] = [];
  segments.push(
    segmentStats("wearable-owner", "Already owns a wearable", decisions.filter((d) => d.agent.wearableOwner)),
    segmentStats("no-wearable", "No wearable today", decisions.filter((d) => !d.agent.wearableOwner)),
    segmentStats("under-40", "Under 40", decisions.filter((d) => d.agent.age < 40)),
    segmentStats("40-plus", "40 and over", decisions.filter((d) => d.agent.age >= 40)),
    segmentStats(
      "financially-pressured",
      "High financial pressure",
      decisions.filter((d) => d.agent.financialPressure >= 0.6)
    ),
    segmentStats(
      "time-pressured",
      "High time pressure",
      decisions.filter((d) => d.agent.timePressure >= 0.6)
    )
  );
  return segments.filter((s): s is BehaviorSegment => s !== null);
}

// Observed synthetic-RCT arms: group decisions by the reward each agent was
// actually shown. The $0 arm is the empirical intrinsic-motivation floor.
function deriveDoseResponseArms(decisions: AgentDecision[], offerPmpm: number): DoseResponseArm[] | undefined {
  const byArm = new Map<number, AgentDecision[]>();
  for (const d of decisions) {
    if (d.armRewardPmpm == null) return undefined; // arms not active for this run
    byArm.set(d.armRewardPmpm, [...(byArm.get(d.armRewardPmpm) ?? []), d]);
  }
  if (byArm.size < 2) return undefined;
  const rewards = Array.from(byArm.keys()).sort((a, b) => a - b);
  const offerArm = rewards.reduce((best, r) => (Math.abs(r - offerPmpm) < Math.abs(best - offerPmpm) ? r : best));
  return rewards.map((rewardPmpm) => {
    const ds = byArm.get(rewardPmpm)!;
    const engaged = ds.filter((d) => d.decision === "engaged").length;
    const enrolled = ds.filter((d) => d.enrolled).length;
    const engagedRate = engaged / Math.max(1, ds.length);
    return {
      rewardPmpm,
      n: ds.length,
      enrollmentRate: enrolled / Math.max(1, ds.length),
      engagedRate,
      engagedCI: propCI(engagedRate, ds.length),
      isOfferArm: rewardPmpm === offerArm,
    };
  });
}

// When synthetic-RCT arms ran, the HEADLINE rates must describe the offer arm
// only (agents who saw the run's actual reward); blending arms would mix
// different treatments into one number. The arms themselves are attached as
// doseResponseArms so the reward-response curve can be fit through observed
// points.
export function aggregateBehavior(decisions: AgentDecision[], offerPmpm?: number): BehaviorRates {
  if (offerPmpm != null) {
    const arms = deriveDoseResponseArms(decisions, offerPmpm);
    if (arms && arms.length >= 2) {
      const offerArm = arms.find((a) => a.isOfferArm)!;
      const offerDecisions = decisions.filter((d) => d.armRewardPmpm === offerArm.rewardPmpm);
      const base = aggregateCore(offerDecisions);
      return { ...base, doseResponseArms: arms };
    }
  }
  return aggregateCore(decisions);
}

function aggregateCore(decisions: AgentDecision[]): BehaviorRates {
  const n = decisions.length;
  const enrolledList = decisions.filter((d) => d.enrolled);
  const enrollmentRate = enrolledList.length / Math.max(1, n);
  const persistedAmongEnrolled =
    enrolledList.filter((d) => d.persisted12mo).length / Math.max(1, enrolledList.length);
  const lifted = decisions.filter((d) => d.enrolled && d.avgStepIncrease > 0);
  const lifts = lifted.map((d) => d.avgStepIncrease);
  const meanLift = lifts.length ? lifts.reduce((s, v) => s + v, 0) / lifts.length : 0;
  const weeks = enrolledList.map((d) => d.weeksEngaged);
  const meanWeeks = weeks.length ? weeks.reduce((s, v) => s + v, 0) / weeks.length : 0;

  // Campaign-agnostic adherence intensity among those who actually engaged
  // (decision === "engaged"). This is the real dose the population delivered for
  // THIS campaign; it drives the dose-response for every campaign type. A genuine
  // zero (nobody engaged) stays zero — it is NOT masked behind a default.
  const engagedList = decisions.filter((d) => d.decision === "engaged");
  const efforts = engagedList.map((d) => d.effortIntensity).filter((v) => v > 0);
  const meanEffortIntensity = efforts.length ? efforts.reduce((s, v) => s + v, 0) / efforts.length : 0;

  // HERO metric — behaviour change: share of the FULL sample who engaged
  // (enrolled AND stuck with it long enough to plausibly change behaviour).
  const behaviorChanged = decisions.filter((d) => d.decision === "engaged").length;
  const behaviorChangeRate = behaviorChanged / Math.max(1, n);

  const sensitivities = decisions.map((d) => d.rewardSensitivity);
  const meanRewardSensitivity = sensitivities.reduce((s, v) => s + v, 0) / Math.max(1, n);

  const counts: Record<Decision, number> = { enrolled: 0, engaged: 0, dropped: 0, nonstarter: 0 };
  decisions.forEach((d) => {
    counts[d.decision]++;
  });
  const archetypeMix = (Object.keys(counts) as Decision[])
    .filter((k) => k !== "enrolled")
    .map((decision) => ({
      decision,
      count: counts[decision],
      pct: counts[decision] / Math.max(1, n),
    }));

  return {
    enrollmentRate,
    enrollmentCI: propCI(enrollmentRate, n),
    persistenceRate: persistedAmongEnrolled,
    persistenceCI: propCI(persistedAmongEnrolled, Math.max(1, enrolledList.length)),
    meanStepLift: meanLift,
    stepLiftCI: meanLift ? (meanCI(lifts) as [number, number]) : [0, 0],
    meanEffortIntensity,
    effortIntensityCI: efforts.length
      ? (meanCI(efforts).map((v) => Math.min(1, Math.max(0, v))) as [number, number])
      : [0, 0],
    meanWeeksEngaged: meanWeeks,
    behaviorChangeRate,
    behaviorChangeCI: propCI(behaviorChangeRate, n),
    meanRewardSensitivity,
    sampleSize: n,
    archetypeMix,
    segments: deriveSegments(decisions),
    rewardCurveShape: deriveRewardCurveShape(decisions),
  };
}
