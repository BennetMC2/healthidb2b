import type { NarrativeReport, ResolvedPlan } from "@shared/schema";
import type { DisplayResult } from "@sim/lib/displayResult";
import { fmtPct, fmtRoi, fmtUsd, fmtPmpm, fmtPerYear, fmtHp } from "@sim/lib/format";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  XCircle,
} from "lucide-react";

const VERDICT_META: Record<
  NarrativeReport["verdict"],
  { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle2 }
> = {
  scale: {
    label: "Scale",
    color: "hsl(150 60% 58%)",
    bg: "hsl(150 60% 50% / 0.10)",
    border: "hsl(150 60% 50% / 0.40)",
    Icon: CheckCircle2,
  },
  "proceed-with-constraints": {
    label: "Proceed with constraints",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.10)",
    border: "hsl(var(--primary) / 0.40)",
    Icon: ShieldAlert,
  },
  "pilot-only": {
    label: "Pilot only",
    color: "hsl(var(--chart-4))",
    bg: "hsl(var(--chart-4) / 0.10)",
    border: "hsl(var(--chart-4) / 0.40)",
    Icon: AlertTriangle,
  },
  "needs-more-evidence": {
    label: "Needs more evidence",
    color: "hsl(var(--chart-4))",
    bg: "hsl(var(--chart-4) / 0.10)",
    border: "hsl(var(--chart-4) / 0.40)",
    Icon: AlertTriangle,
  },
  "do-not-proceed": {
    label: "Do not proceed",
    color: "hsl(0 75% 64%)",
    bg: "hsl(0 75% 58% / 0.10)",
    border: "hsl(0 75% 58% / 0.40)",
    Icon: XCircle,
  },
};

function HeadlineMetric({
  label,
  value,
  band,
  sub,
  accent,
  testId,
}: {
  label: string;
  value: string;
  band?: string | null;
  sub?: string;
  accent?: string;
  testId?: string;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-background/45 p-3" data-testid={testId}>
      <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="font-mono text-2xl font-bold leading-none tabular sm:text-3xl" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {band && <div className="mt-1.5 font-mono text-[0.7rem] text-muted-foreground">P5–P95 {band}</div>}
      {sub && <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// TIER 1: the one decision-shaped readout. Reward, behaviour change, net value
// and ROI each appear exactly ONCE on the page — here. Everything below this
// card explains these numbers; nothing below restates them.
export default function DecisionCard({
  display,
  plan,
  narrative,
  rewardSet,
}: {
  display: DisplayResult;
  plan: ResolvedPlan | null;
  narrative: NarrativeReport | null;
  rewardSet: boolean;
}) {
  if (!rewardSet) {
    return (
      <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 p-5" data-testid="card-decision-locked">
        <div className="font-mono text-sm font-semibold text-amber-800">Decision readout locked</div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/80">
          Set a reward first. The behaviour-change projection and economics are displayed only after the reward lever is defined.
        </p>
      </div>
    );
  }

  const v = narrative ? VERDICT_META[narrative.verdict] : null;
  const Icon = v?.Icon;
  const horizon = plan?.horizonMonths ?? 12;
  const econ = display.economicsConfigured;

  // Deterministic lead sentence — built from the canonical numbers, never the LLM.
  const lead = econ ? (
    <>
      At <span className="text-foreground font-semibold">{fmtPmpm(display.rewardPmpm)}</span> ({fmtPerYear(display.rewardPmpm)}), the model
      projects <span className="text-foreground font-semibold">{fmtPct(display.behaviorFrac)}</span> of the book (≈
      {display.membersImproved.toLocaleString()} members) meaningfully improving behaviour, generating{" "}
      <span className={display.netUsd >= 0 ? "text-[hsl(150_60%_58%)]" : "text-[hsl(0_75%_64%)]"}>
        {fmtUsd(display.netUsd)} net value
      </span>{" "}
      ({fmtRoi(display.roi)} ROI) over {horizon} months.
    </>
  ) : (
    <>
      At <span className="text-foreground font-semibold">{fmtPmpm(display.rewardPmpm)}</span> ({fmtPerYear(display.rewardPmpm)}), the model
      projects <span className="text-foreground font-semibold">{fmtPct(display.behaviorFrac)}</span> of the book (≈
      {display.membersImproved.toLocaleString()} members) meaningfully improving behaviour, generating{" "}
      <span className="text-[hsl(150_60%_58%)]">{fmtUsd(display.grossUsd)} gross value</span> over {horizon} months.
      Net value and ROI appear once reward, admin and platform economics are configured.
    </>
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-card/80 to-background/60 p-5 glow-accent sm:p-6"
      data-testid="card-decision"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      {/* header: label + verdict chip */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-foreground">
          <Activity className="h-3.5 w-3.5" /> Decision readout
          <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.6rem] normal-case tracking-normal">
            <BadgeCheck className="h-3 w-3" /> verified wearable data
          </span>
        </div>
        {v && Icon && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.72rem] font-semibold"
            style={{ borderColor: v.border, color: v.color, background: v.bg }}
            data-testid={`chip-verdict-${narrative!.verdict}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {v.label}
          </span>
        )}
      </div>

      {/* deterministic lead sentence */}
      <p className="mb-4 max-w-3xl text-base font-medium leading-relaxed text-foreground/90 sm:text-lg" data-testid="text-decision-lead">
        {lead}
      </p>

      {/* the four headline metrics — each exactly once on the page */}
      <div className={`grid grid-cols-2 gap-2 ${econ ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <HeadlineMetric
          label="Reward lever"
          value={fmtPmpm(display.rewardPmpm)}
          sub={`= ${fmtPerYear(display.rewardPmpm)} · ${fmtHp(display.rewardPmpm)}`}
          accent="hsl(var(--primary))"
          testId="metric-reward"
        />
        <HeadlineMetric
          label="Behaviour change"
          value={fmtPct(display.behaviorFrac)}
          band={display.behaviorBandFrac ? `${fmtPct(display.behaviorBandFrac[0])} – ${fmtPct(display.behaviorBandFrac[1])}` : null}
          sub={`≈ ${display.membersImproved.toLocaleString()} members improve`}
          accent="hsl(var(--primary))"
          testId="metric-behavior"
        />
        <HeadlineMetric
          label={econ ? "Net value" : "Gross value"}
          value={fmtUsd(econ ? display.netUsd : display.grossUsd)}
          band={display.netBandUsd ? `${fmtUsd(display.netBandUsd[0])} – ${fmtUsd(display.netBandUsd[1])}` : null}
          sub={econ ? `gross ${fmtUsd(display.grossUsd)} − costs ${fmtUsd(display.totalCostUsd)}` : "claims + productivity + retention + mortality"}
          accent={(econ ? display.netUsd : display.grossUsd) >= 0 ? "hsl(150 60% 58%)" : "hsl(0 75% 64%)"}
          testId="metric-net"
        />
        {econ && (
          <HeadlineMetric
            label="ROI (net / cost)"
            value={fmtRoi(display.roi)}
            band={display.roiBand ? `${fmtRoi(display.roiBand[0])} – ${fmtRoi(display.roiBand[1])}` : null}
            sub={display.downsideFrac != null ? `${fmtPct(display.downsideFrac)} chance of negative net` : undefined}
            accent={(display.roi ?? 0) >= 0 ? "hsl(150 60% 58%)" : "hsl(0 75% 64%)"}
            testId="metric-roi"
          />
        )}
      </div>

      {/* LLM recommendation — words only; every number lives in the metrics above */}
      {narrative && v && (
        <div className="mt-4 rounded-lg border p-3.5" style={{ borderColor: v.border, background: v.bg }} data-testid="text-decision-recommendation">
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wider" style={{ color: v.color }}>
            <Lightbulb className="h-3.5 w-3.5" /> Recommendation
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground/90">{narrative.recommendation}</p>
        </div>
      )}

      {/* one definition line for the whole page */}
      <p className="mt-4 border-t border-card-border pt-3 font-mono text-[0.68rem] leading-relaxed text-muted-foreground" data-testid="text-decision-definitions">
        Point estimates are the deterministic median scenario; bands are the simulated P5–P95 range
        {display.atRunReward ? "" : " read off the reward-response surface at the selected reward"}. These are model
        projections under the selected assumptions — not validated confidence intervals until calibrated against
        observed programme data.
      </p>
    </div>
  );
}
