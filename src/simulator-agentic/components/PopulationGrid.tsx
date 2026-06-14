import { useState } from "react";
import type { SimState } from "@sim/lib/sim";
import { DECISION_META, fmtPct, safeNumber } from "@sim/lib/sim";
import type { AgentDecision, MemberAgent } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sim/ui/dialog";

function Trait({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 font-mono text-[0.7rem] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${v * 100}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-[0.7rem] text-foreground/70">{safeNumber(v).toFixed(2)}</span>
    </div>
  );
}

export default function PopulationGrid({ state }: { state: SimState }) {
  const [selected, setSelected] = useState<{ agent: MemberAgent; decision?: AgentDecision } | null>(null);
  const total = state.agents.length;

  const legend = (["engaged", "enrolled", "dropped", "nonstarter"] as const).map((k) => ({
    k,
    ...DECISION_META[k],
    count: Object.values(state.decisions).filter((d) => d.decision === k).length,
  }));

  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4" data-testid="panel-population">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-sm font-semibold tracking-tight">SYNTHETIC POPULATION</h3>
        <div className="flex flex-wrap items-center gap-3">
          {legend.map((l) => (
            <span key={l.k} className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              {l.label} <span className="text-foreground/70">{l.count}</span>
            </span>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-card-border">
          <p className="font-mono text-xs text-muted-foreground">awaiting population spin-up…</p>
        </div>
      ) : (
        <div
          className="grid gap-[6px]"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(18px, 1fr))` }}
        >
          {state.agents.map((a, i) => {
            const d = state.decisions[a.id];
            const meta = d ? DECISION_META[d.decision] : null;
            const pending = !d;
            return (
              <button
                key={a.id}
                onClick={() => setSelected({ agent: a, decision: d })}
                title={d ? `#${a.id} · ${DECISION_META[d.decision].label}` : `#${a.id} · evaluating…`}
                className={`aspect-square rounded-[5px] border transition-all hover-elevate ${
                  pending ? "border-card-border bg-muted/40 pulse-ring" : "dot-pop border-transparent"
                }`}
                style={
                  meta
                    ? { background: meta.color, boxShadow: `0 0 10px -2px ${meta.color}` }
                    : { animationDelay: `${(i % 12) * 30}ms` }
                }
                data-testid={`dot-agent-${a.id}`}
              />
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-agent">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-muted-foreground">MEMBER-AGENT</span> #{String(selected.agent.id).padStart(2, "0")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-foreground/85">{selected.agent.personaBlurb}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                  <span className="text-muted-foreground">age band</span><span className="text-right">{selected.agent.ageBand}</span>
                  <span className="text-muted-foreground">occupation</span><span className="truncate text-right">{selected.agent.occupation}</span>
                  <span className="text-muted-foreground">district</span><span className="truncate text-right">{selected.agent.district}</span>
                  <span className="text-muted-foreground">family</span><span className="truncate text-right">{selected.agent.family}</span>
                  <span className="text-muted-foreground">health history</span><span className="truncate text-right">{selected.agent.healthHistory}</span>
                  <span className="text-muted-foreground">attitude</span><span className="truncate text-right">{selected.agent.attitude}</span>
                  <span className="text-muted-foreground">baseline steps</span><span className="text-right">{selected.agent.baselineSteps.toLocaleString()}</span>
                  <span className="text-muted-foreground">wearable</span><span className="text-right">{selected.agent.wearableOwner ? "yes" : "no"}</span>
                </div>
                <div className="space-y-1.5">
                  <Trait label="motivation" v={selected.agent.motivation} />
                  <Trait label="conscientious." v={selected.agent.conscientiousness} />
                  <Trait label="time-pressure" v={selected.agent.timePressure} />
                  <Trait label="tech-savvy" v={selected.agent.techSavvy} />
                  <Trait label="health-anxiety" v={selected.agent.healthAnxiety} />
                  <Trait label="financial-press." v={selected.agent.financialPressure} />
                </div>
                {selected.decision ? (
                  <div className="rounded-lg border border-card-border bg-background/60 p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">DECISION</span>
                      <span className="font-mono text-xs font-semibold" style={{ color: DECISION_META[selected.decision.decision].color }}>
                        {DECISION_META[selected.decision.decision].label}
                      </span>
                    </div>
                    <p className="border-l-2 border-primary/40 pl-2.5 text-sm italic text-foreground/80">
                      “{selected.decision.reasoning}”
                    </p>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">evaluating…</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {(state.calibratedBehavior ?? state.behavior) && (
        <p className="mt-3 font-mono text-[0.7rem] text-muted-foreground">
          Archetype mix emerged from agent behaviour — not hardcoded. Behaviour change{" "}
          {fmtPct((state.calibratedBehavior ?? state.behavior)!.behaviorChangeRate)} of sample (calibrated).
        </p>
      )}
    </div>
  );
}
