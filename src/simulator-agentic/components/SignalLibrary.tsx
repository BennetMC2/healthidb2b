import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EvidenceTier, FusionDef, SignalDef, TrustTier } from "@shared/schema";
import { apiRequest } from "@sim/lib/queryClient";
import { ChevronDown, ExternalLink, Layers, Plus, Radio, X } from "lucide-react";

interface SignalRegistryPayload {
  signals: SignalDef[];
  fusions: FusionDef[];
  emergingHaircut: number;
  trustModifiers: Record<TrustTier, number>;
}

const TIER_META: Record<EvidenceTier, { label: string; gate: string; color: string; border: string; bg: string }> = {
  Proven: {
    label: "Proven",
    gate: "full claims credit ×1.0",
    color: "hsl(150 60% 58%)",
    border: "hsl(150 60% 50% / 0.4)",
    bg: "hsl(150 60% 50% / 0.1)",
  },
  Emerging: {
    label: "Emerging",
    gate: "claims credit haircut ×0.5",
    color: "hsl(var(--chart-4))",
    border: "hsl(var(--chart-4) / 0.4)",
    bg: "hsl(var(--chart-4) / 0.1)",
  },
  Experimental: {
    label: "Experimental",
    gate: "$0 claims credit until backtested — engagement-only",
    color: "hsl(220 12% 60%)",
    border: "hsl(220 12% 50% / 0.4)",
    bg: "hsl(220 12% 50% / 0.1)",
  },
};

const CATEGORY_LABEL: Record<string, string> = {
  movement: "Movement",
  cardio_autonomic: "Cardio / autonomic",
  respiratory: "Respiratory",
  sleep_recovery: "Sleep & recovery",
  metabolic: "Metabolic",
  mind: "Mind",
};

const TIER_ORDER: EvidenceTier[] = ["Proven", "Emerging", "Experimental"];

// Campaign-builder signal library: surfaces the full registry — what we can
// verify, the evidence behind it, and the gates that scale bookable value —
// and lets the user compose selected signals straight into the scenario goal.
export default function SignalLibrary({
  running,
  onInsert,
}: {
  running: boolean;
  onInsert: (signalNames: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data } = useQuery<SignalRegistryPayload>({
    queryKey: ["/api/signals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/signals");
      return res.json();
    },
    staleTime: Infinity,
  });

  const byTier = useMemo(() => {
    const groups = new Map<EvidenceTier, SignalDef[]>();
    for (const tier of TIER_ORDER) groups.set(tier, []);
    for (const s of data?.signals ?? []) groups.get(s.evidenceTier)?.push(s);
    return groups;
  }, [data]);

  if (!data) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedNames = data.signals.filter((s) => selected.has(s.signalId)).map((s) => s.displayName);

  return (
    <div className="mt-3 border-t border-card-border pt-3" data-testid="panel-signal-library">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          <Radio className="h-3.5 w-3.5 text-primary" /> Signal library
          <span className="normal-case tracking-normal text-muted-foreground/80">
            — every signal we can verify, and the haircut behind its value
          </span>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={running}
              onClick={() => {
                onInsert(selectedNames);
                setSelected(new Set());
              }}
              className="flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-primary hover-elevate disabled:opacity-50"
              data-testid="button-insert-signals"
            >
              <Plus className="h-3.5 w-3.5" /> Use {selected.size} signal{selected.size > 1 ? "s" : ""} in goal
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
              data-testid="button-clear-signals"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {TIER_ORDER.map((tier) => {
          const signals = byTier.get(tier) ?? [];
          if (!signals.length) return null;
          const meta = TIER_META[tier];
          return (
            <div key={tier}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.62rem] font-semibold"
                  style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-[0.65rem] text-muted-foreground">{meta.gate}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {signals.map((s) => (
                  <SignalCard
                    key={s.signalId}
                    signal={s}
                    trustModifier={data.trustModifiers[s.trustCeiling]}
                    selected={selected.has(s.signalId)}
                    expanded={expanded === s.signalId}
                    onToggle={() => !running && toggle(s.signalId)}
                    onExpand={() => setExpanded((cur) => (cur === s.signalId ? null : s.signalId))}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {data.fusions.length > 0 && (
        <div className="mt-3 rounded-lg border border-card-border bg-background/30 p-3">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" /> Composite indices (corroboration-credited)
          </div>
          <div className="space-y-1">
            {data.fusions.map((f) => (
              <div key={f.fusionId} className="font-mono text-[0.7rem] text-foreground/80" data-testid={`fusion-${f.fusionId}`}>
                <span className="font-semibold">{f.displayName}</span>
                <span className="text-muted-foreground">
                  {" — "}
                  {f.components
                    .map((c) => {
                      const sig = data.signals.find((s) => s.signalId === c.signalId);
                      return `${sig?.shortName ?? c.signalId} ${Math.round(c.weight * 100)}%`;
                    })
                    .join(" · ")}
                  {" · "}
                  {f.evidenceTier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-2 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
        Bookable value = published effect × evidence-tier gate × data-source trust modifier × attribution haircut.
        Lab-verified signals (High trust ×1.0) outrank consumer wearables (Medium ×{data.trustModifiers.Medium}); Experimental
        signals run engagement-only until a backtest upload proves the claims impact on your own data.
      </p>
    </div>
  );
}

function SignalCard({
  signal,
  trustModifier,
  selected,
  expanded,
  onToggle,
  onExpand,
}: {
  signal: SignalDef;
  trustModifier: number;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const effect = signal.doseResponse;
  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        selected ? "border-primary/60 bg-primary/10" : "border-card-border bg-background/40"
      }`}
      data-testid={`signal-card-${signal.signalId}`}
    >
      <button type="button" onClick={onToggle} className="block w-full text-left" data-testid={`button-signal-${signal.signalId}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-foreground/90">{signal.displayName}</span>
          <span
            className={`h-3.5 w-3.5 shrink-0 rounded-sm border ${
              selected ? "border-primary bg-primary" : "border-muted-foreground/40"
            }`}
            aria-hidden
          />
        </div>
        <div className="mt-0.5 font-mono text-[0.62rem] text-muted-foreground">
          {CATEGORY_LABEL[signal.category] ?? signal.category} · trust {signal.trustCeiling} ×{trustModifier}
        </div>
        <div className="mt-1 font-mono text-[0.68rem] text-foreground/75">
          {effect ? (
            <>
              effect <span className="font-semibold text-foreground">{Math.round(effect.effectP50 * 100)}%</span>{" "}
              <span className="text-muted-foreground">
                [{Math.round(effect.effectCI[0] * 100)}–{Math.round(effect.effectCI[1] * 100)}%]
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">engagement-only — no claims effect booked</span>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={onExpand}
        className="mt-1.5 flex items-center gap-1 font-mono text-[0.62rem] text-muted-foreground hover:text-primary"
        aria-expanded={expanded}
        data-testid={`button-signal-detail-${signal.signalId}`}
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        {expanded ? "hide detail" : "evidence & sources"}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-card-border pt-2 text-[0.68rem] leading-relaxed text-foreground/75">
          <p>
            <span className="font-mono text-muted-foreground">Lever: </span>
            {signal.behaviourLever}
          </p>
          {signal.claimsPathway && (
            <p>
              <span className="font-mono text-muted-foreground">Claims pathway: </span>
              {signal.claimsPathway}
            </p>
          )}
          <p className="font-mono text-muted-foreground">
            attribution confidence {signal.attributionConfidence} · devices: {signal.dataSources.join(", ")}
          </p>
          <div className="space-y-0.5">
            {signal.evidenceSources.map((c) => (
              <a
                key={c.key}
                href={c.doi}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-1 font-mono text-[0.65rem] text-primary/80 hover:text-primary"
              >
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  {c.title} — {c.finding}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
