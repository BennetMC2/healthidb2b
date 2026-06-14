import type {
  StreamEvent,
  ResolvedPlan,
  MemberAgent,
  AgentDecision,
  BehaviorRates,
  MonteCarloResult,
  CalibrationReport,
  RewardOptimization,
  MethodologyReport,
  NarrativeReport,
  IncentiveDesign,
  RewardStrategyConfig,
  LifeAssumptionOverrides,
  GrowthDecision,
  GrowthBehavior,
  GrowthResult,
} from "@shared/schema";

// API base: works locally and after deploy (port 5000 proxy).
const PORT_TOKEN = "__PORT_5000__";
export const API_BASE = PORT_TOKEN.startsWith("__") ? "" : PORT_TOKEN;

export interface SimState {
  status: "idle" | "running" | "done" | "error";
  thoughts: { text: string; kind: "thought" | "critique" }[];
  plan: ResolvedPlan | null;
  agents: MemberAgent[];
  decisions: Record<number, AgentDecision>;
  completed: number;
  total: number;
  populationTotal: number;
  wearablePct: number;
  behavior: BehaviorRates | null; // raw, sample-derived
  calibratedBehavior: BehaviorRates | null; // after shrinkage toward anchors
  calibration: CalibrationReport | null;
  optimization: RewardOptimization | null;
  methodology: MethodologyReport | null;
  narrative: NarrativeReport | null;
  finance: MonteCarloResult | null;
  error: string | null;
  mode: "llm" | "heuristic" | "mixed" | null;
  modeMessage: string | null;
}

export const initialSimState: SimState = {
  status: "idle",
  thoughts: [],
  plan: null,
  agents: [],
  decisions: {},
  completed: 0,
  total: 0,
  populationTotal: 0,
  wearablePct: 0,
  behavior: null,
  calibratedBehavior: null,
  calibration: null,
  optimization: null,
  methodology: null,
  narrative: null,
  finance: null,
  error: null,
  mode: null,
  modeMessage: null,
};

// Stream the SSE simulation; calls onEvent for each parsed event.
export function streamSimulation(
  goal: string,
  sampleSize: number,
  onEvent: (e: StreamEvent) => void,
  incentiveDesign?: IncentiveDesign,
  rewardStrategy?: RewardStrategyConfig,
  lifeAssumptions?: LifeAssumptionOverrides,
  segmentSetVersionId?: string,
  lifeAssumptionVersionId?: string
): () => void {
  const incentiveQs = incentiveDesign?.configured
    ? `&incentiveConfigured=true&rewardPmpm=${encodeURIComponent(incentiveDesign.rewardPmpm)}&adminCostPmpm=${encodeURIComponent(incentiveDesign.adminCostPmpm)}&platformCostPmpm=${encodeURIComponent(incentiveDesign.platformCostPmpm)}`
    : "";
  const strategyQs = rewardStrategy
    ? `&strategyObjective=${encodeURIComponent(rewardStrategy.objective)}${
        typeof rewardStrategy.budgetPmpm === "number" ? `&strategyBudgetPmpm=${encodeURIComponent(rewardStrategy.budgetPmpm)}` : ""
      }`
    : "";
  const assumptionEntries = lifeAssumptions
    ? [
        ["lifeBaselineAnnualMortalityRate", lifeAssumptions.baselineAnnualMortalityRate],
        ["lifeSumAssured", lifeAssumptions.sumAssured],
        ["lifeAnnualPremium", lifeAssumptions.annualPremium],
        ["lifeMorbidityValuePctOfMortality", lifeAssumptions.morbidityValuePctOfMortality],
        ["lifeAcquisitionValuePerNewVerifiedMember", lifeAssumptions.acquisitionValuePerNewVerifiedMember],
        ["lifeMaxLapseImprovement", lifeAssumptions.maxLapseImprovement],
      ]
    : [];
  const assumptionQs = assumptionEntries
    .filter(([, value]) => typeof value === "number")
    .map(([key, value]) => `&${key}=${encodeURIComponent(value as number)}`)
    .join("");
  const segmentSetQs = segmentSetVersionId ? `&segmentSetVersionId=${encodeURIComponent(segmentSetVersionId)}` : "";
  const lifeAssumptionQs = lifeAssumptionVersionId ? `&lifeAssumptionVersionId=${encodeURIComponent(lifeAssumptionVersionId)}` : "";
  const url = `${API_BASE}/api/simulate?goal=${encodeURIComponent(goal)}&sample=${sampleSize}${incentiveQs}${strategyQs}${assumptionQs}${segmentSetQs}${lifeAssumptionQs}`;
  const es = new EventSource(url);
  es.onmessage = (msg) => {
    try {
      const e = JSON.parse(msg.data) as StreamEvent;
      onEvent(e);
      if (e.type === "done" || e.type === "error") es.close();
    } catch {
      /* ignore parse errors */
    }
  };
  es.onerror = () => {
    onEvent({ type: "error", message: "Connection lost. The model may be busy — try again." });
    es.close();
  };
  return () => es.close();
}

// ---- growth simulation (commercial clock, separate from book-health) ----

export interface GrowthState {
  status: "idle" | "running" | "done" | "error";
  thoughts: { text: string; kind: "thought" | "critique" }[];
  plan: ResolvedPlan | null;
  agents: MemberAgent[];
  decisions: Record<number, AgentDecision>;
  growthDecisions: Record<number, GrowthDecision>;
  completed: number;
  total: number;
  growthCompleted: number;
  behavior: BehaviorRates | null;
  growthBehavior: GrowthBehavior | null;
  result: GrowthResult | null;
  error: string | null;
  mode: "llm" | "heuristic" | "mixed" | null;
  modeMessage: string | null;
}

export const initialGrowthState: GrowthState = {
  status: "idle",
  thoughts: [],
  plan: null,
  agents: [],
  decisions: {},
  growthDecisions: {},
  completed: 0,
  total: 0,
  growthCompleted: 0,
  behavior: null,
  growthBehavior: null,
  result: null,
  error: null,
  mode: null,
  modeMessage: null,
};

export function streamGrowthSimulation(
  goal: string,
  sampleSize: number,
  rewardPmpm: number | undefined,
  onEvent: (e: StreamEvent) => void
): () => void {
  const rewardQs = typeof rewardPmpm === "number" && Number.isFinite(rewardPmpm) ? `&rewardPmpm=${encodeURIComponent(rewardPmpm)}` : "";
  const url = `${API_BASE}/api/growth?goal=${encodeURIComponent(goal)}&sample=${sampleSize}${rewardQs}`;
  const es = new EventSource(url);
  es.onmessage = (msg) => {
    try {
      const e = JSON.parse(msg.data) as StreamEvent;
      onEvent(e);
      if (e.type === "done" || e.type === "error") es.close();
    } catch {
      /* ignore parse errors */
    }
  };
  es.onerror = () => {
    onEvent({ type: "error", message: "Connection lost. The model may be busy — try again." });
    es.close();
  };
  return () => es.close();
}

// ---- formatting helpers ----
export function safeNumber(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

export function fmtUSD(n: number | null | undefined, compact = true): string {
  const v = safeNumber(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (compact) {
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export function fmtPct(x: number | null | undefined, digits = 0): string {
  return `${(safeNumber(x) * 100).toFixed(digits)}%`;
}

// legacy monthly formatter (kept for any internal/debug use)
export function fmtReward(n: number | null | undefined): string {
  return `$${safeNumber(n).toFixed(2)}`;
}

export const DECISION_META: Record<
  string,
  { label: string; color: string; ring: string; text: string }
> = {
  engaged: { label: "Engaged", color: "hsl(var(--primary))", ring: "ring-primary", text: "text-primary" },
  enrolled: { label: "Enrolled, low engagement", color: "hsl(var(--chart-2))", ring: "ring-chart-3", text: "text-chart-2" },
  dropped: { label: "Dropped off", color: "hsl(var(--chart-4))", ring: "ring-chart-4", text: "text-chart-4" },
  nonstarter: { label: "Did not enroll", color: "hsl(220 12% 38%)", ring: "ring-muted", text: "text-muted-foreground" },
};
