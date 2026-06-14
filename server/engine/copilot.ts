import { callLlm, type LlmProvider } from "./llm";

// ---------------------------------------------------------------------------
// Results co-pilot: grounded Q&A over a completed simulation run.
//
// The client sends a compact CONTEXT JSON built from the run's canonical
// numbers (the same display selector the panels read from). The co-pilot is
// words-only on top of those numbers — the same philosophy as the narrative:
// it may cite and explain figures present in the context, but it must never
// invent or extrapolate new metrics. Enforcement is via the system prompt,
// low temperature, and a context that contains everything worth citing.
// ---------------------------------------------------------------------------

export type CopilotTurn = { role: "user" | "assistant"; content: string };

const MAX_TURNS = 12;
const MAX_TURN_CHARS = 2000;
const MAX_QUESTION_CHARS = 2000;
const MAX_CONTEXT_CHARS = 22000;

const COPILOT_ANTHROPIC_MODEL = process.env.COPILOT_ANTHROPIC_MODEL || "claude-haiku-4-5";
// Prefer Anthropic (Haiku) when a key is present, mirroring the agent pipeline.
const COPILOT_PROVIDER_ORDER: LlmProvider[] = process.env.ANTHROPIC_API_KEY
  ? ["anthropic", "groq", "glm"]
  : ["groq", "glm", "anthropic"];

const SYSTEM = `You are the results co-pilot inside the HealthID incentive simulator, answering questions from an insurance executive or actuary about ONE completed simulation run. The CONTEXT JSON below the question contains every number this run computed.

HARD GROUNDING RULES — these are non-negotiable:
1. Cite ONLY numbers that appear in CONTEXT. You may round them, convert fractions to percentages, and do simple arithmetic on them (e.g. cost per improved member) — but if you derive a figure, name the context inputs you used.
2. NEVER invent, guess or extrapolate a metric that is not in CONTEXT. If asked about a reward level, look it up in rewardCurve; if it is not there, say the user should drag the reward lever or re-run rather than guessing.
3. These are model projections under the selected assumptions — calibrated planning estimates, NOT validated results. Say so plainly whenever asked about reliability, and point at the relevant assumption (with its source) when one drives the answer.
4. Be intellectually honest: flag downside probability, wide bands and heuristic-mode degradation when they matter. Never oversell.
5. Be concise — under 150 words unless the user explicitly asks for depth. Plain English. No markdown headings; short sentences or "-" bullets only.
6. Answer only questions about this simulation, its assumptions, methodology or the underlying evidence. Politely decline anything else.

Return ONLY a compact JSON object: {"answer": "<your answer>"} — no prose around it, no markdown fences.`;

export function sanitizeHistory(raw: unknown): CopilotTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: CopilotTurn[] = [];
  for (const item of raw) {
    const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
    const content = typeof item?.content === "string" ? item.content.trim().slice(0, MAX_TURN_CHARS) : "";
    if (!role || !content) continue;
    turns.push({ role, content });
  }
  return turns.slice(-MAX_TURNS);
}

// Serialize the client-built context, shedding the bulkiest optional sections
// if the payload is oversized so the prompt stays within provider limits.
export function clampContext(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "{}";
  const ctx = { ...(raw as Record<string, unknown>) };
  let json = JSON.stringify(ctx);
  for (const droppable of ["assumptions", "rewardCurve", "claimsBreakdown"]) {
    if (json.length <= MAX_CONTEXT_CHARS) break;
    delete ctx[droppable];
    json = JSON.stringify(ctx);
  }
  return json.slice(0, MAX_CONTEXT_CHARS);
}

export function buildCopilotPrompt(question: string, history: CopilotTurn[], contextJson: string): string {
  const convo = history.length
    ? `CONVERSATION SO FAR:\n${history.map((t) => `${t.role === "user" ? "USER" : "CO-PILOT"}: ${t.content}`).join("\n")}\n\n`
    : "";
  return `${convo}CONTEXT (canonical numbers from this run — the only citable figures):\n${contextJson}\n\nUSER QUESTION: ${question}`;
}

function parseAnswer(text: string): string {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s !== -1 && e > s) {
    try {
      const parsed = JSON.parse(cleaned.slice(s, e + 1));
      if (typeof parsed?.answer === "string" && parsed.answer.trim()) return parsed.answer.trim();
    } catch {
      /* fall through to raw text */
    }
  }
  return cleaned;
}

export async function answerCopilotQuestion(input: {
  question: string;
  history?: unknown;
  context?: unknown;
}): Promise<{ answer: string; model: string; provider: string }> {
  const question = String(input.question || "").trim().slice(0, MAX_QUESTION_CHARS);
  if (!question) throw new Error("question is required");
  const history = sanitizeHistory(input.history);
  const contextJson = clampContext(input.context);

  const result = await callLlm({
    system: SYSTEM,
    prompt: buildCopilotPrompt(question, history, contextJson),
    maxTokens: 700,
    temperature: 0.3,
    providerOrder: COPILOT_PROVIDER_ORDER,
    providerModels: { anthropic: COPILOT_ANTHROPIC_MODEL },
  });
  const answer = parseAnswer(result.text).slice(0, 4000);
  if (!answer) throw new Error("co-pilot returned an empty answer");
  return { answer, model: result.model, provider: result.provider };
}
