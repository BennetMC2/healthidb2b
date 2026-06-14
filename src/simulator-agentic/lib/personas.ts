import type { AgentDecision, MemberAgent, ResolvedPlan, SignalDef, TrustTier } from "@shared/schema";

export interface PersonaSignal {
  signalId: string;
  displayName: string;
  value: string;
  evidenceTier: string;
  trustTier: TrustTier;
  source: string;
}

export interface SyntheticPersona {
  id: number;
  handle: string;
  label: string;
  agent: MemberAgent;
  decision: AgentDecision | null;
  incomeBand: string;
  trustTier: TrustTier;
  dataSources: string[];
  signals: PersonaSignal[];
  contribution: string;
  quote: string;
  locationPoint: { x: number; y: number };
}

// Market- and sex-appropriate given names so a Singapore cohort doesn't read
// like a Midwest focus group. SG names reflect its Chinese/Malay/Indian mix.
const FIRST: Record<"HK" | "SG", { M: string[]; F: string[] }> = {
  HK: {
    M: ["Ka-Ho", "Wai-Ming", "Chun-Hei", "Kelvin", "Jason", "Tsz-Lok", "Ho-Yin", "Marco", "Ronald", "Cyrus", "Ming-Hin", "Eric"],
    F: ["Hoi-Ching", "Ka-Yan", "Wing-Sze", "Mei-Ling", "Vivian", "Queenie", "Tsz-Ying", "Fiona", "Carmen", "Janice", "Sum-Yi", "Rainbow"],
  },
  SG: {
    M: ["Wei Ming", "Jun Hao", "Faizal", "Arjun", "Marcus", "Zhi Wei", "Rajesh", "Daniel", "Hafiz", "Kai Xiang", "Suresh", "Yong Sheng"],
    F: ["Hui Ling", "Mei Xin", "Nurul", "Priya", "Grace", "Siti", "Xin Yi", "Aisyah", "Shalini", "Rachel", "Li Ting", "Farah"],
  },
};
const INCOME = ["modest", "middle", "upper-middle", "affluent"];
const INCOME_BAND_LABEL: Record<string, string> = { low: "modest", middle: "middle", high: "affluent" };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rand(seed: number) {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

export function buildPersonas(agents: MemberAgent[], decisions: Record<number, AgentDecision>, plan: ResolvedPlan | null): SyntheticPersona[] {
  return agents.map((agent) => buildPersona(agent, decisions[agent.id] ?? null, plan));
}

function buildPersona(agent: MemberAgent, decision: AgentDecision | null, plan: ResolvedPlan | null): SyntheticPersona {
  const r = rand(hash(`${agent.id}:${agent.age}:${agent.district}:${agent.occupation}:${plan?.primarySignal ?? "none"}`));
  const pool = FIRST[plan?.market === "SG" ? "SG" : "HK"][agent.sex];
  const first = pool[Math.floor(r() * pool.length)] ?? "Alex";
  const handle = `${first.toLowerCase().replace(/[^a-z0-9]+/g, "")}_${agent.district.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${agent.id.toString().padStart(3, "0")}`;
  const incomeIdx = Math.min(3, Math.max(0, Math.floor((agent.financialPressure < 0.25 ? 2 : agent.financialPressure > 0.7 ? 0 : 1) + r() * 1.4)));
  const trustTier: TrustTier = agent.wearableOwner ? (agent.techSavvy > 0.65 ? "Medium" : "Low") : "Low";
  const defs = plan?.signalDefinitions?.length ? plan.signalDefinitions : [];
  const signals = defs.map((s) => personaSignal(agent, s, trustTier, r));
  const loc = { x: 18 + r() * 64, y: 18 + r() * 54 };
  return {
    id: agent.id,
    handle,
    label: `${first} · ${agent.ageBand} · ${agent.sex}`,
    agent,
    decision,
    incomeBand: (agent.incomeBand && INCOME_BAND_LABEL[agent.incomeBand]) || INCOME[incomeIdx] || "middle",
    trustTier,
    dataSources: Array.from(new Set(signals.map((s) => s.source))),
    signals,
    contribution: contributionText(decision),
    quote: decision?.reasoning ? `“${decision.reasoning}”` : "“Waiting for the agent decision.”",
    locationPoint: loc,
  };
}

function personaSignal(agent: MemberAgent, signal: SignalDef, baseTrust: TrustTier, r: () => number): PersonaSignal {
  const highTrustLab = signal.dataSources.includes("Lab Results") && (agent.healthAnxiety > 0.55 || agent.age > 48);
  const trustTier: TrustTier = highTrustLab ? "High" : baseTrust;
  const source = highTrustLab ? "Lab Results" : agent.wearableOwner ? signal.dataSources.find((s) => s !== "Lab Results") ?? "Apple Health" : "Self-reported";
  return {
    signalId: signal.signalId,
    displayName: signal.displayName,
    evidenceTier: signal.evidenceTier,
    trustTier,
    source,
    value: signalValue(agent, signal.signalId, r),
  };
}

function signalValue(agent: MemberAgent, signalId: string, r: () => number): string {
  const risk = Math.min(1, Math.max(0, agent.mortalityPer1k / 6));
  if (signalId === "steps") return `${Math.round(agent.baselineSteps).toLocaleString()} steps/day`;
  if (signalId === "vo2max") return `${Math.round(24 + (1 - risk) * 18 + r() * 5)} ml/kg/min`;
  if (signalId === "resting_hr") return `${Math.round(58 + risk * 24 + r() * 8)} bpm`;
  if (signalId === "hrv") return `${Math.round(18 + (1 - risk) * 42 + r() * 8)} ms RMSSD`;
  if (signalId === "sleep_regularity") return `${Math.round(48 + agent.conscientiousness * 34 - agent.timePressure * 12 + r() * 8)}% regular`;
  if (signalId === "hba1c") return `${(5.2 + risk * 1.4 + (agent.healthHistory.toLowerCase().includes("diabetes") ? 0.7 : 0) + r() * 0.4).toFixed(1)}%`;
  if (signalId === "glucose_tir") return `${Math.round(58 + (1 - risk) * 24 + r() * 8)}% TIR`;
  if (signalId === "bp") return `${Math.round(112 + risk * 28 + r() * 8)}/${Math.round(72 + risk * 14 + r() * 6)} mmHg`;
  if (signalId === "gait_speed") return `${(0.75 + (1 - risk) * 0.45 + r() * 0.08).toFixed(2)} m/s`;
  if (signalId === "respiratory_rate") return `${Math.round(13 + risk * 5 + r() * 2)}/min`;
  return `${Math.round(50 + r() * 40)} score`;
}

function contributionText(decision: AgentDecision | null): string {
  if (!decision) return "Pending decision";
  if (decision.decision === "engaged") return "Meaningful behaviour-change contributor";
  if (decision.decision === "dropped") return "Partial exposure, fader credit only";
  if (decision.enrolled) return "Enrolled with low engagement";
  return "No direct outcome contribution";
}

