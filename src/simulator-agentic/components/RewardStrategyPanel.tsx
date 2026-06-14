import type { CohortRewardAllocationResult, LifeInsuranceValueResult, RewardStrategyConfig, RewardStrategyExplanation } from "@shared/schema";
import { fmtUsd as fmtUSD, safeNumber } from "@sim/lib/format";
import { BadgeDollarSign, BrainCircuit, ShieldCheck, Target, Users } from "lucide-react";

function pct(n: number) {
  return `${(safeNumber(n) * 100).toFixed(0)}%`;
}

function labelFromId(id: string) {
  return id
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function bandLabel(band: string) {
  if (band === "low_cost_engagement") return "baseline cash-value package";
  if (band === "target_aggressively") return "higher-value target package";
  if (band === "test_or_clinical_pathway") return "clinical pathway package";
  if (band === "do_not_overpay") return "base reward only";
  return band.replace(/_/g, " ");
}

export default function RewardStrategyPanel({
  allocation,
  lifeValue,
  strategy,
  explanation,
}: {
  allocation: CohortRewardAllocationResult | null | undefined;
  lifeValue: LifeInsuranceValueResult | null | undefined;
  strategy?: RewardStrategyConfig | null;
  explanation?: RewardStrategyExplanation | null;
}) {
  if (!allocation || !lifeValue) {
    return (
      <div className="rounded-xl border border-card-border bg-card/40 p-4 text-sm text-muted-foreground">
        Cohort reward strategy will appear after the life-insurance value path is calculated.
      </div>
    );
  }

  const topScores = [...allocation.priorityScores]
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5);
  const byCohort = new Map(allocation.allocations.map((a) => [a.cohortId, a]));

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-card/75 to-background/50 p-4 sm:p-5" data-testid="panel-reward-strategy">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
            <BrainCircuit className="h-4 w-4 text-primary" /> COHORT REWARD STRATEGY
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Every cohort receives monetary reward value. The personalisation is the wrapper, timing and verification
            pathway used to make that value more compelling for each cohort.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-card-border bg-background/50 px-3 py-2 text-right">
            <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">objective</div>
            <div className="font-mono text-sm font-semibold text-foreground/90">{labelFromId(strategy?.objective ?? "balanced")}</div>
          </div>
          <div className="rounded-lg border border-card-border bg-background/50 px-3 py-2 text-right">
            <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">budget</div>
            <div className="font-mono text-sm font-semibold text-foreground/90">
              {typeof strategy?.budgetPmpm === "number" ? `${fmtUSD(strategy.budgetPmpm, false)} PMPM` : "uncapped"}
            </div>
          </div>
          <div className="rounded-lg border border-card-border bg-background/50 px-3 py-2 text-right">
            <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">net life value (this path)</div>
            <div className={`font-mono text-lg font-semibold ${lifeValue.netValue < 0 ? "text-chart-4" : "text-foreground"}`}>
              {fmtUSD(lifeValue.netValue)}
            </div>
            {lifeValue.netValue < 0 && (
              <div className="font-mono text-[0.6rem] text-muted-foreground">
                deliberately negative here: this path excludes claims savings
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Metric icon={<Target className="h-3.5 w-3.5" />} label="Mortality" value={fmtUSD(lifeValue.mortalitySegmentationValue)} />
        <Metric icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Morbidity" value={fmtUSD(lifeValue.morbidityValue)} />
        <Metric icon={<Users className="h-3.5 w-3.5" />} label="Acquisition" value={fmtUSD(lifeValue.acquisitionValue)} />
        <Metric icon={<Users className="h-3.5 w-3.5" />} label="Persistency" value={fmtUSD(lifeValue.lapsePersistencyValue)} />
        <Metric icon={<BadgeDollarSign className="h-3.5 w-3.5" />} label="Reward cost" value={fmtUSD(lifeValue.rewardCost)} tone="warn" />
      </div>

      <div className="space-y-2">
        {topScores.map((score) => {
          const assigned = byCohort.get(score.cohortId);
          return (
            <div key={score.cohortId} className="rounded-lg border border-card-border bg-background/45 p-3" data-testid={`reward-strategy-${score.cohortId}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-semibold text-foreground/90">{labelFromId(score.cohortId)}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[0.62rem] text-muted-foreground">
                    <span className="rounded-full border border-card-border px-2 py-0.5">{bandLabel(score.priorityBand)}</span>
                    <span>value {pct(score.valueAtRiskScore)}</span>
                    <span>modifiable {pct(score.behaviorChangePotentialScore)}</span>
                    <span>fit {pct(score.incentiveFitScore)}</span>
                    <span>verify {pct(score.verificationConfidenceScore)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">reward package</div>
                  <div className="font-mono text-sm font-semibold text-foreground">
                    {assigned ? assigned.rewardLabel ?? labelFromId(assigned.rewardOptionId) : "Base monetary reward"}
                  </div>
                  {assigned?.cashValuePmpm != null ? (
                    <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                      perceived reward value (illustrative) {fmtUSD(assigned.cashValuePmpm, false)} PMPM · {assigned.deliveryMechanic}
                    </div>
                  ) : null}
                </div>
              </div>
              {assigned && (
                <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[0.68rem] text-muted-foreground sm:grid-cols-4">
                  <span>enrol +{pct(assigned.expectedEnrolmentLift)}</span>
                  <span>persist +{pct(assigned.expectedPersistenceLift)}</span>
                  <span>signal +{pct(assigned.expectedSignalQualityLift)}</span>
                  <span>cost {fmtUSD(assigned.expectedCost)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {explanation && (
        <div className="mt-4 rounded-lg border border-card-border bg-background/45 p-3" data-testid="panel-reward-explanation">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-mono text-xs uppercase tracking-wide text-foreground">Strategy explanation</h4>
            <span className="font-mono text-[0.65rem] text-muted-foreground">
              {explanation.mode === "llm" ? "AI-written, bounded by deterministic allocation" : "Deterministic fallback"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground/80">{explanation.summary}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
            <div>
              <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">rationale</div>
              <ul className="space-y-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                {explanation.rationale.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">bounded variants</div>
              <div className="space-y-1.5">
                {explanation.boundedVariants.map((v) => (
                  <div key={v.name} className="rounded-md border border-card-border bg-card/35 p-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[0.7rem]">
                      <span className="text-foreground/85">{v.name}</span>
                      <span className="text-foreground">{labelFromId(v.objective)}</span>
                    </div>
                    <p className="mt-0.5 text-[0.68rem] leading-relaxed text-muted-foreground">
                      {typeof v.budgetPmpm === "number" ? `${fmtUSD(v.budgetPmpm, false)} PMPM. ` : ""}
                      {v.expectedTradeoff}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground">
            {explanation.caveats[0]}
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-lg border border-card-border bg-background/50 p-2.5">
      <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`font-mono text-base font-semibold ${tone === "warn" ? "text-chart-4" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
