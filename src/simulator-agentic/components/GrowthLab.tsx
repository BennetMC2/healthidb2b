import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import type { StreamEvent, GrowthChannel, GrowthDecision, UpsellProduct } from "@shared/schema";
import {
  streamGrowthSimulation,
  initialGrowthState,
  type GrowthState,
  fmtUSD,
  fmtPct,
  DECISION_META,
} from "@sim/lib/sim";
import { CircleDollarSign, Megaphone, Play, ShieldPlus, Square, TrendingUp, UserPlus } from "lucide-react";

// GrowthLab — the commercial clock. A separate simulation from the
// book-health/actuarial tab: models ADDITIONAL buying (riders, top-ups,
// savings plans) and program-driven new customers. Never carrier switching,
// and never blended into the health-outcomes ROI.

type Action = { type: "reset" } | { type: "event"; e: StreamEvent };

function reducer(state: GrowthState, action: Action): GrowthState {
  if (action.type === "reset") return { ...initialGrowthState, status: "running" };
  const e = action.e;
  switch (e.type) {
    case "thought":
      return { ...state, thoughts: [...state.thoughts, { text: e.text, kind: "thought" }] };
    case "plan":
      return { ...state, plan: e.plan, total: e.plan.sampleSize, thoughts: [...state.thoughts, { text: e.thought, kind: "thought" }] };
    case "mode":
      return { ...state, mode: e.mode, modeMessage: e.message };
    case "population_init":
      return { ...state, total: e.sampleSize };
    case "agent_spawned":
      return state.agents.find((a) => a.id === e.agent.id) ? state : { ...state, agents: [...state.agents, e.agent] };
    case "agent_decision":
      return { ...state, decisions: { ...state.decisions, [e.decision.agentId]: e.decision }, completed: e.completed, total: e.total };
    case "behavior":
      return { ...state, behavior: e.rates };
    case "growth_decision":
      return { ...state, growthDecisions: { ...state.growthDecisions, [e.decision.agentId]: e.decision }, growthCompleted: e.completed };
    case "growth_behavior":
      return { ...state, growthBehavior: e.behavior };
    case "growth_result":
      return { ...state, result: e.result };
    case "done":
      return { ...state, status: "done" };
    case "error":
      return { ...state, status: "error", error: e.message };
    default:
      return state;
  }
}

const PRODUCT_LABEL: Record<UpsellProduct, string> = {
  ci_rider: "CI rider",
  top_up: "Sum-assured top-up",
  savings_plan: "Savings plan",
  none: "None",
};

const CHANNEL_ICON: Record<GrowthChannel["id"], JSX.Element> = {
  upsell: <ShieldPlus className="h-4 w-4 text-primary" />,
  referral: <UserPlus className="h-4 w-4 text-primary" />,
  program_led: <Megaphone className="h-4 w-4 text-primary" />,
};

const TIER_STYLE: Record<string, string> = {
  Proven: "border-primary/40 bg-primary/10 text-primary",
  Emerging: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  Experimental: "border-card-border bg-background/60 text-muted-foreground",
};

const DEFAULT_GOAL =
  "Reward 8,000 steps a day for our Hong Kong life book of 200,000 members over 12 months";

export default function GrowthLab() {
  const [state, dispatch] = useReducer(reducer, initialGrowthState);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [sample, setSample] = useState(60);
  const [rewardPmpm, setRewardPmpm] = useState<string>("");
  const stopRef = useRef<(() => void) | null>(null);

  const running = state.status === "running";

  const run = useCallback(() => {
    if (!goal.trim()) return;
    stopRef.current?.();
    dispatch({ type: "reset" });
    const reward = parseFloat(rewardPmpm);
    stopRef.current = streamGrowthSimulation(
      goal.trim(),
      sample,
      Number.isFinite(reward) && reward >= 0 ? reward : undefined,
      (e) => dispatch({ type: "event", e })
    );
  }, [goal, sample, rewardPmpm]);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const recentGrowth = useMemo(() => {
    const all = Object.values(state.growthDecisions);
    return all.slice(-6).reverse();
  }, [state.growthDecisions]);

  return (
    <div className="space-y-4" data-testid="growth-lab">
      {/* Framing: the two clocks */}
      <div className="rounded-xl border border-card-border bg-card/45 p-4">
        <div className="flex items-center gap-2 font-mono text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Growth simulation — the commercial clock
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          This runs on a separate clock from the health-outcomes tab. The actuarial view (claims, mortality, lapse)
          plays out over years; the CFO&apos;s view plays out over quarters. Here the same synthetic members are asked two
          commercial questions after their wellness-programme experience: would you buy <span className="text-foreground">additional</span> cover
          from this insurer (a CI rider, a top-up, a savings plan), and would you recommend the programme to anyone?
          No carrier switching is modelled — only additional buying and programme-attracted new customers. The two
          views are never blended into one ROI.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-card-border bg-card/45 p-4">
        <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="growth-goal">
          Programme objective
        </label>
        <textarea
          id="growth-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={2}
          className="mt-1.5 w-full resize-none rounded-lg border border-card-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50"
          data-testid="input-growth-goal"
        />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="growth-sample">
              Sample agents
            </label>
            <select
              id="growth-sample"
              value={sample}
              onChange={(e) => setSample(parseInt(e.target.value, 10))}
              className="mt-1.5 rounded-lg border border-card-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50"
              data-testid="select-growth-sample"
            >
              {[40, 60, 100, 160, 240].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="growth-reward">
              Reward $/member/mo
            </label>
            <input
              id="growth-reward"
              type="number"
              min={0}
              max={250}
              step={1}
              placeholder="auto"
              value={rewardPmpm}
              onChange={(e) => setRewardPmpm(e.target.value)}
              className="mt-1.5 w-28 rounded-lg border border-card-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50"
              data-testid="input-growth-reward"
            />
          </div>
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-2 rounded-lg border border-card-border bg-background/60 px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              data-testid="button-growth-stop"
            >
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={run}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              data-testid="button-growth-run"
            >
              <Play className="h-3.5 w-3.5" /> Run growth simulation
            </button>
          )}
        </div>
      </div>

      {/* Live progress */}
      {(running || state.status === "done" || state.status === "error") && (
        <div className="rounded-xl border border-card-border bg-card/45 p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.7rem] text-muted-foreground">
            {running && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />}
            <span>
              Pass 1 · programme engagement: <span className="text-foreground">{state.completed}</span>/{state.total || "—"}
            </span>
            <span>
              Pass 2 · commercial questions: <span className="text-foreground">{state.growthCompleted}</span>/{state.total || "—"}
            </span>
            {state.mode && state.mode !== "llm" && (
              <span className="rounded-full border border-chart-4/40 bg-chart-4/10 px-2 py-0.5 text-[0.62rem] text-chart-4">
                {state.mode === "heuristic" ? "heuristic fallback" : "mixed LLM/heuristic"}
              </span>
            )}
          </div>
          {state.thoughts.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{state.thoughts[state.thoughts.length - 1].text}</p>
          )}
          {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
          {recentGrowth.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {recentGrowth.map((d) => (
                <GrowthDecisionRow key={d.agentId} d={d} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {state.result && <GrowthResults state={state} />}
    </div>
  );
}

function GrowthDecisionRow({ d }: { d: GrowthDecision }) {
  const meta = DECISION_META[d.engagement];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-card-border bg-background/40 px-2.5 py-1.5 font-mono text-[0.66rem]">
      <span className="text-muted-foreground">#{String(d.agentId).padStart(3, "0")}</span>
      <span style={{ color: meta?.color }}>{meta?.label ?? d.engagement}</span>
      <span className={d.boughtUpsell ? "text-foreground" : "text-muted-foreground"}>
        {d.boughtUpsell ? `buys ${PRODUCT_LABEL[d.upsellProduct]}` : `no additional cover (${fmtPct(d.upsellLikelihood)})`}
      </span>
      <span className={d.referralsMade > 0 ? "text-foreground" : "text-muted-foreground"}>
        {d.referralsMade > 0 ? `refers ${d.referralsMade}` : "no referral"}
      </span>
      <span className="text-muted-foreground/80">— “{d.reasoning}”</span>
    </div>
  );
}

function GrowthResults({ state }: { state: GrowthState }) {
  const r = state.result!;
  const gb = state.growthBehavior;
  const maxAbs = Math.max(1, ...r.quarters.map((q) => Math.abs(q.cumulativeNetCash)));
  return (
    <>
      {/* Headline */}
      <div className="rounded-xl border border-primary/30 bg-card/60 p-4" data-testid="growth-headline">
        <div className="flex items-center gap-2 font-mono text-sm font-semibold">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          In-year commercial readout · {r.bookSize.toLocaleString()} members · {r.horizonQuarters} quarters
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Net commercial value (P50)" value={fmtUSD(r.netValueP50)} sub={`P5 ${fmtUSD(r.netValueP5)} · P95 ${fmtUSD(r.netValueP95)}`} highlight />
          <Stat
            label="Payback quarter"
            value={r.paybackQuarter ? `Q${r.paybackQuarter}` : "Beyond horizon"}
            sub={r.paybackQuarter ? "cumulative cash turns positive" : "reward spend not recovered in-horizon"}
          />
          <Stat label="New policies / riders" value={Math.round(r.totalNewPolicies).toLocaleString()} sub={`${fmtUSD(r.totalNewAnnualPremium)} new annual premium`} />
          <Stat label="Chance of negative net" value={fmtPct(r.downsideProbability)} sub={`${r.iterations.toLocaleString()} Monte Carlo draws`} />
        </div>
        <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">
          Reward spend over horizon: {fmtUSD(r.totalRewardCost)} at ${r.rewardPmpm}/member/mo · {fmtPct(r.enrolledShare)} enrolled · {fmtPct(r.engagedShare)} engaged
        </p>
      </div>

      {/* Channels */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {r.channels.map((ch) => (
          <div key={ch.id} className="rounded-xl border border-card-border bg-card/45 p-4" data-testid={`growth-channel-${ch.id}`}>
            <div className="flex items-center gap-2 font-mono text-xs font-semibold">
              {CHANNEL_ICON[ch.id]}
              {ch.label}
            </div>
            <div className="mt-3 space-y-1.5 font-mono text-[0.7rem]">
              <Row k="New policies" v={ch.policies >= 10 ? Math.round(ch.policies).toLocaleString() : ch.policies.toFixed(1)} />
              <Row k="New annual premium" v={fmtUSD(ch.annualPremium)} />
              <Row k="New-business value" v={fmtUSD(ch.newBusinessValue)} />
              <Row k="Acquisition cost" v={fmtUSD(ch.acquisitionCost)} />
              <Row k="CAC / policy" v={fmtUSD(ch.cacPerPolicy, false)} />
              <div className="border-t border-card-border pt-1.5">
                <Row k="Net" v={fmtUSD(ch.netValue)} strong negative={ch.netValue < 0} />
              </div>
            </div>
            <p className="mt-2 text-[0.62rem] leading-relaxed text-muted-foreground">{ch.evidence}</p>
          </div>
        ))}
      </div>

      {/* Quarterly cash */}
      <div className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="growth-quarters">
        <div className="font-mono text-xs font-semibold">Quarterly cumulative net cash</div>
        <p className="mt-1 text-[0.68rem] text-muted-foreground">
          Rewards are paid from Q1 (enrolment ramps); commercial value lands from Q2 as advisors follow up. This is the
          quarterly-targets view.
        </p>
        <div className="mt-3 flex items-end gap-2" style={{ height: 120 }}>
          {r.quarters.map((q) => {
            const h = Math.max(4, (Math.abs(q.cumulativeNetCash) / maxAbs) * 100);
            const positive = q.cumulativeNetCash >= 0;
            return (
              <div key={q.quarter} className="flex flex-1 flex-col items-center justify-end gap-1" title={`Q${q.quarter}: ${fmtUSD(q.cumulativeNetCash)}`}>
                <span className={`font-mono text-[0.58rem] ${positive ? "text-foreground" : "text-chart-4"}`}>{fmtUSD(q.cumulativeNetCash)}</span>
                <div
                  className={`w-full rounded-t ${positive ? "bg-primary/70" : "bg-chart-4/60"}`}
                  style={{ height: `${h}%` }}
                />
                <span className="font-mono text-[0.6rem] text-muted-foreground">Q{q.quarter}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample stats */}
      {gb && (
        <div className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="growth-sample-stats">
          <div className="font-mono text-xs font-semibold">What the synthetic members said</div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Upsell rate · engaged"
              value={fmtPct(gb.upsellRateEngaged)}
              sub={`95% CI ${fmtPct(gb.upsellRateEngagedCI[0])}–${fmtPct(gb.upsellRateEngagedCI[1])}`}
            />
            <Stat label="Upsell rate · everyone else" value={fmtPct(gb.upsellRateOther)} sub="organic baseline — subtracted before crediting" />
            <Stat label="Engaged who refer" value={fmtPct(gb.referralRate)} sub={`${gb.referralsPerEngaged.toFixed(2)} mentions per engaged member`} />
            <Stat label="Sample" value={`${gb.sampleSize}`} sub={`${fmtPct(gb.engagedShare)} engaged in programme`} />
          </div>
          {gb.productMix.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {gb.productMix.map((m) => (
                <span key={m.product} className="rounded-full border border-card-border bg-background/50 px-2.5 py-1 font-mono text-[0.65rem] text-foreground/80">
                  {PRODUCT_LABEL[m.product]} · {m.count} ({fmtPct(m.pct)})
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assumptions */}
      <div className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="growth-assumptions">
        <div className="font-mono text-xs font-semibold">Assumptions on the table</div>
        <div className="mt-3 space-y-2">
          {r.assumptions.map((a) => (
            <div key={a.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-card-border/60 pb-2 last:border-0 last:pb-0">
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[0.58rem] ${TIER_STYLE[a.tier] ?? TIER_STYLE.Experimental}`}>{a.tier}</span>
              <span className="font-mono text-[0.7rem] text-foreground">{a.label}</span>
              <span className="font-mono text-[0.7rem] text-foreground">{a.value}</span>
              <span className="text-[0.64rem] text-muted-foreground">{a.source}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="rounded-xl border border-card-border bg-background/40 p-3 text-[0.66rem] leading-relaxed text-muted-foreground" data-testid="growth-caveat">
        {r.caveat}
      </p>
    </>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="font-mono text-[0.6rem] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Row({ k, v, strong, negative }: { k: string; v: string; strong?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className={`${strong ? "font-semibold" : ""} ${negative ? "text-chart-4" : "text-foreground"}`}>{v}</span>
    </div>
  );
}
