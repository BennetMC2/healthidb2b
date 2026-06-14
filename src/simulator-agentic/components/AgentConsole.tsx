import { useEffect, useRef } from "react";
import type { SimState } from "@sim/lib/sim";
import { DECISION_META, fmtPct, safeNumber } from "@sim/lib/sim";
import type { AgentDecision } from "@shared/schema";
import { Cpu, Sparkles, Users, AlertTriangle, CircleDot, Scale } from "lucide-react";

// Anchor metrics are mostly fractions; step-lift is an absolute step count.
function fmtAnchor(v: number, metric: string): string {
  if (/step/i.test(metric)) return `+${Math.round(v).toLocaleString()}`;
  return `${(safeNumber(v) * 100).toFixed(0)}%`;
}

function DecisionBadge({ d }: { d: AgentDecision["decision"] }) {
  const m = DECISION_META[d];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium font-mono"
      style={{ borderColor: m.color, color: m.color }}
      data-testid={`badge-decision-${d}`}
    >
      <CircleDot className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function ThoughtLine({ text, kind }: { text: string; kind: "thought" | "critique" }) {
  return (
    <div className="fade-up flex gap-2.5 py-2" data-testid={`text-thought-${kind}`}>
      <div className="mt-0.5 shrink-0">
        {kind === "critique" ? (
          <AlertTriangle className="h-4 w-4 text-chart-4" />
        ) : (
          <Cpu className="h-4 w-4 text-primary" />
        )}
      </div>
      <p className={`text-sm leading-relaxed ${kind === "critique" ? "text-chart-4" : "text-foreground/85"}`}>
        {kind === "critique" && <span className="font-semibold text-chart-4">Self-critique — </span>}
        {text}
      </p>
    </div>
  );
}

function AgentCard({ d }: { d: AgentDecision }) {
  const a = d.agent;
  return (
    <div
      className="fade-up rounded-lg border border-card-border bg-card/60 p-3"
      data-testid={`card-agent-decision-${a.id}`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">#{String(a.id).padStart(2, "0")}</span>
          <span className="text-sm font-medium">
            {a.age}
            <span className="text-muted-foreground">/{a.sex}</span> · {a.ageBand}
          </span>
        </div>
        <DecisionBadge d={d.decision} />
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{a.personaBlurb}</p>
      <p className="border-l-2 border-primary/40 pl-2.5 text-sm italic leading-relaxed text-foreground/80">
        “{d.reasoning}”
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-muted-foreground">
        <span>enroll: <span className="text-foreground/70">{d.enrolled ? "yes" : "no"}</span></span>
        <span>weeks: <span className="text-foreground/70">{d.weeksEngaged}</span></span>
        <span>persist: <span className="text-foreground/70">{d.persisted12mo ? "yes" : "no"}</span></span>
        {d.avgStepIncrease > 0 && (
          <span>Δsteps: <span className="text-foreground/70">+{d.avgStepIncrease.toLocaleString()}</span></span>
        )}
        <span>reward-sens: <span className="text-foreground/70">{safeNumber(d.rewardSensitivity).toFixed(2)}</span></span>
      </div>
    </div>
  );
}

export default function AgentConsole({ state }: { state: SimState }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const orderedDecisions = Object.values(state.decisions).sort((a, b) => a.agentId - b.agentId);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.thoughts.length, state.completed, state.behavior, state.finance]);

  const running = state.status === "running";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-card-border bg-card/40">
      <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${running ? "bg-primary" : state.status === "done" ? "bg-[hsl(150_60%_52%)]" : "bg-muted-foreground"}`} />
          </span>
          <h2 className="font-mono text-sm font-semibold tracking-tight">MEMBER-AGENT DECISIONS</h2>
        </div>
        {state.total > 0 && (
          <span className="font-mono text-xs text-muted-foreground" data-testid="text-agent-progress">
            {state.completed}/{state.total} agents
          </span>
        )}
      </div>

      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-4 py-3">
        {state.status === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Sparkles className="h-7 w-7 text-primary/70" />
            <p className="max-w-xs text-sm text-muted-foreground">
              State a business goal above. The agent will parse it, instantiate a synthetic member population,
              role-play a representative sample through a real LLM, then run a Monte Carlo over the full book.
            </p>
          </div>
        )}

        {state.thoughts.map((t, i) => (
          <ThoughtLine key={`t-${i}`} text={t.text} kind={t.kind} />
        ))}

        {state.plan && (
          <div className="fade-up my-2 rounded-lg border border-primary/30 bg-primary/5 p-3" data-testid="card-plan">
            <div className="mb-1 flex items-center gap-2 font-mono text-xs text-foreground">
              <Users className="h-3.5 w-3.5" /> RESOLVED PLAN
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
              <Row k="signals" v={state.plan.signalDefinitions?.map((s) => s.shortName).join(" + ") ?? state.plan.campaignLabel} />
              {state.plan.fusionDefinition ? <Row k="fusion" v={state.plan.fusionDefinition.displayName} /> : null}
              <Row k="market" v={state.plan.marketLabel} />
              <Row k="book" v={state.plan.bookSize.toLocaleString()} />
              <Row k="horizon" v={`${state.plan.horizonMonths} mo`} />
              <Row k="sample" v={`${state.plan.sampleSize} agents`} />
              <Row
                k={state.plan.incentiveDesign?.configured ? "selected reward" : "offer context"}
                v={state.plan.incentiveDesign?.configured ? `$${state.plan.assumedOfferPmpm}/mo` : `$${state.plan.probeReward.toFixed(0)}/mo · ${state.plan.probeRewardHp.toFixed(0)} HP/mo`}
              />
            </div>
            {!state.plan.incentiveDesign?.configured && (
              <p className="mt-1.5 font-mono text-[0.62rem] leading-snug text-muted-foreground">
                Behaviour response uses the configured strategy context. ROI remains unavailable until reward economics are configured.
              </p>
            )}
          </div>
        )}

        {state.behavior && (
          <div className="fade-up my-2 rounded-lg border border-card-border bg-card/70 p-3" data-testid="card-behavior-summary">
            <div className="mb-1.5 font-mono text-xs text-muted-foreground">
              EMERGENT BEHAVIORAL RATES <span className="text-foreground/40">(raw, sample-derived)</span>
            </div>
            <div className="grid grid-cols-1 gap-1 font-mono text-xs sm:grid-cols-3">
              <CI label="behaviour change" v={state.behavior.behaviorChangeRate} ci={state.behavior.behaviorChangeCI} />
              <CI label="enrollment" v={state.behavior.enrollmentRate} ci={state.behavior.enrollmentCI} />
              <CI label="12-mo persist" v={state.behavior.persistenceRate} ci={state.behavior.persistenceCI} />
            </div>
          </div>
        )}

        {state.calibration && state.calibratedBehavior && (
          <div className="fade-up my-2 rounded-lg border border-chart-3/40 bg-chart-3/5 p-3" data-testid="card-calibration-summary">
            <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-chart-2">
              <Scale className="h-3.5 w-3.5" /> CALIBRATED TO PUBLISHED ANCHORS
              <span className="text-muted-foreground">(w={safeNumber(state.calibration.shrinkage).toFixed(2)})</span>
            </div>
            <div className="space-y-1 font-mono text-[0.7rem]">
              {state.calibration.anchors.map((a) => (
                <div key={a.metric} className="flex items-baseline justify-between gap-2" data-testid={`calib-anchor-${a.metric.replace(/\s+/g, "-").toLowerCase()}`}>
                  <span className="text-muted-foreground">{a.metric}</span>
                  <span className="text-right text-foreground/80">
                    <span className="text-foreground/40">{fmtAnchor(a.rawValue, a.metric)}</span>
                    {" → "}
                    <span className="text-chart-2">{fmtAnchor(a.calibratedValue, a.metric)}</span>
                    <span className="ml-1 text-foreground/35">[{fmtAnchor(a.anchorLow, a.metric)}–{fmtAnchor(a.anchorHigh, a.metric)}]</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orderedDecisions.map((d) => (
          <AgentCard key={d.agentId} d={d} />
        ))}

        {running && orderedDecisions.length < state.total && (
          <div className="shimmer my-1 h-14 rounded-lg border border-card-border bg-card/40" />
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-right text-foreground">{v}</span>
    </div>
  );
}

function CI({ label, v, ci }: { label: string; v: number; ci: [number, number] }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground">
        {fmtPct(v)}
        <span className="ml-1 text-[0.65rem] text-muted-foreground">
          [{fmtPct(ci[0])}–{fmtPct(ci[1])}]
        </span>
      </div>
    </div>
  );
}
