import type { BehaviorRates, ResolvedPlan } from "@shared/schema";
import type { DisplayResult } from "@sim/lib/displayResult";
import { fmtPct } from "@sim/lib/format";
import { ChevronRight } from "lucide-react";

// TIER 3 drill-down: HOW the headline behaviour-change number is produced —
// the enrolment → persistence → adherence chain, the signals it is measured
// from, and the fusion weights. The headline % itself lives in the Decision
// Card; the final funnel stage is shown only to close the chain.
export default function FunnelDetail({
  behavior,
  plan,
  display,
}: {
  behavior: BehaviorRates | null;
  plan: ResolvedPlan | null;
  display: DisplayResult;
}) {
  const primary = plan?.signalDefinitions?.find((s) => s.signalId === plan.primarySignal) ?? plan?.signalDefinitions?.[0];
  const stepLift = Math.round(behavior?.meanStepLift ?? 0);
  // Only surface a dose stat when it is meaningful for this campaign. A steps
  // campaign with a genuine zero lift, or a non-steps campaign, gets the
  // intensity-of-target framing instead of a misleading '+0/day'.
  const doseKind = primary?.doseKind;
  const doseLabel = primary?.doseLabel ?? "mean adherence";
  const doseValue =
    doseKind === "steplift"
      ? stepLift > 0
        ? `+${stepLift.toLocaleString()}/day`
        : null
      : fmtPct(behavior?.meanEffortIntensity ?? 0) + " of target";

  const stages = [
    { label: "Enrol", value: behavior?.enrollmentRate ?? 0, note: "accept the offer" },
    { label: "Persist", value: behavior?.persistenceRate ?? 0, note: "still engaged at horizon" },
    {
      label: "Meaningfully improve",
      value: display.behaviorFrac,
      note: "= headline in the decision readout",
    },
  ];

  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4" data-testid="panel-funnel-detail">
      {/* funnel chain */}
      <div className="flex flex-wrap items-stretch gap-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
            <div className="rounded-lg border border-card-border bg-background/45 px-3 py-2">
              <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="font-mono text-lg font-semibold tabular text-foreground/90">{fmtPct(s.value)}</div>
              <div className="font-mono text-[0.6rem] text-muted-foreground">{s.note}</div>
            </div>
          </div>
        ))}
        {doseValue && (
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <div className="rounded-lg border border-card-border bg-background/45 px-3 py-2">
              <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">{doseLabel}</div>
              <div className="font-mono text-lg font-semibold tabular text-foreground">{doseValue}</div>
              <div className="font-mono text-[0.6rem] text-muted-foreground">achieved dose among improvers</div>
            </div>
          </div>
        )}
      </div>

      {/* signal provenance */}
      {plan?.signalDefinitions?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.signalDefinitions.map((s) => (
            <span
              key={s.signalId}
              className="rounded-full border border-card-border bg-background/50 px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
            >
              <span className="text-foreground/85">{s.displayName}</span> · {s.evidenceTier} · trust {s.trustCeiling}
            </span>
          ))}
        </div>
      ) : null}
      {plan?.fusionDefinition ? (
        <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 p-2 font-mono text-[0.65rem] text-muted-foreground">
          Fusion: <span className="text-foreground">{plan.fusionDefinition.displayName}</span>{" "}
          {plan.fusionDefinition.components.map((c) => `${c.signalId} ${(c.weight * 100).toFixed(0)}%`).join(" · ")}
        </div>
      ) : null}

      <p className="mt-3 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
        Rates are live member-agent decisions blended with real-world evidence anchors (Bayesian shrinkage), measured
        from verified wearable data. The improve rate reads off the reward-response curve at the selected reward.
      </p>
    </div>
  );
}
