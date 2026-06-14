import type { MonteCarloResult, ResolvedPlan } from "@shared/schema";
import type { DisplayResult } from "@sim/lib/displayResult";
import { fmtUsd, fmtPct, safeNumber } from "@sim/lib/format";
import { ShieldCheck, HeartPulse, Info } from "lucide-react";

// TIER 3 drill-down: the value bridge from behaviour change to net value,
// shown INLINE (formerly hidden in a dialog). All figures are the median-run
// waterfall from the single scenario spine — the same numbers as the decision
// readout, itemised.
function ValueBar({
  claims,
  productivity,
  retention,
  mortality,
}: {
  claims: number;
  productivity: number;
  retention: number;
  mortality: number;
}) {
  const total = Math.max(1, claims + productivity + retention + mortality);
  const cP = (safeNumber(claims) / total) * 100;
  const pP = (safeNumber(productivity) / total) * 100;
  const mP = (safeNumber(mortality) / total) * 100;
  const rP = Math.max(0, 100 - cP - pP - mP);
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${cP}%` }} title="Clinical claims savings" />
        {productivity > 0 && (
          <div className="h-full bg-chart-4" style={{ width: `${pP}%` }} title="Group productivity value" />
        )}
        <div className="h-full bg-chart-3" style={{ width: `${rP}%` }} title="Retention value" />
        {mortality > 0 && (
          <div className="h-full bg-chart-5" style={{ width: `${mP}%` }} title="Mortality margin (avoided death claims)" />
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-2 font-mono text-[0.7rem]">
        <span className="flex items-center gap-1.5 text-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Claims savings {fmtUsd(claims)} <span className="text-foreground/40">({cP.toFixed(0)}%)</span>
        </span>
        {productivity > 0 && (
          <span className="flex items-center gap-1.5 text-foreground/80">
            <span className="h-2.5 w-2.5 rounded-full bg-chart-4" /> Productivity {fmtUsd(productivity)} <span className="text-foreground/40">({pP.toFixed(0)}%)</span>
          </span>
        )}
        <span className="flex items-center gap-1.5 text-chart-2">
          <span className="h-2.5 w-2.5 rounded-full bg-chart-3" /> Retention value {fmtUsd(retention)} <span className="text-foreground/40">({rP.toFixed(0)}%)</span>
        </span>
        {mortality > 0 && (
          <span className="flex items-center gap-1.5 text-foreground/80">
            <span className="h-2.5 w-2.5 rounded-full bg-chart-5" /> Mortality margin {fmtUsd(mortality)} <span className="text-foreground/40">({mP.toFixed(0)}%)</span>
          </span>
        )}
      </div>
    </div>
  );
}

function CalcRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${mono ? "font-mono tabular" : ""}`}>{value}</span>
    </div>
  );
}

export default function ValueBridge({
  finance,
  plan,
  display,
}: {
  finance: MonteCarloResult;
  plan: ResolvedPlan;
  display: DisplayResult;
}) {
  const b = finance.claimsBreakdown;
  const outcome = plan.signalDefinitions?.find((s) => s.signalId === plan.primarySignal)?.outcome ?? "the target signal";
  const roiAvailable = display.economicsConfigured;

  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4" data-testid="panel-value-bridge">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          median-run waterfall · {finance.iterations.toLocaleString()} MC iterations behind the bands · {plan.horizonMonths}-mo horizon
        </span>
        {!display.atRunReward && (
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[0.62rem] text-amber-200">
            waterfall shown at the run reward — drag back or pin &amp; verify to re-derive
          </span>
        )}
      </div>

      {/* value composition at the selected reward */}
      <div className="mb-4 rounded-lg border border-card-border bg-background/40 p-3">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> Value composition
        </div>
        <ValueBar
          claims={display.claimsUsd}
          productivity={display.productivityUsd}
          retention={display.retentionUsd}
          mortality={display.mortalityUsd}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Clinical claims savings */}
        <div className="rounded-lg border border-card-border bg-background/50 p-3">
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Clinical claims savings
          </div>
          <CalcRow label={`Members who meaningfully improved ${outcome}`} value={b.engagedMembers.toLocaleString()} />
          <CalcRow label="Effectively treated (persisting + part-credit for faders)" value={b.effectiveTreated.toLocaleString()} />
          <CalcRow label="× Applicable claims-pathway prevalence" value={fmtPct(b.applicablePrevalence ?? 0, 1)} />
          <CalcRow label="× Annual claims-cost delta / applicable treated member" value={fmtUsd(b.annualClaimsDeltaPerTreated ?? 0, false)} />
          <CalcRow label="× Programme attribution factor" value={fmtPct(b.attributionFactor ?? 0, 1)} />
          <CalcRow label="× Achieved dose / adherence factor" value={fmtPct(b.doseAchievement ?? b.doseResponsePct, 1)} />
          <CalcRow label="× Present-value factor" value={(safeNumber(b.presentValueFactor) || 0).toFixed(2)} />
          <div className="mt-1 border-t border-card-border pt-2">
            <CalcRow label="= Claims savings" value={fmtUsd(b.claimsSavings, false)} />
          </div>
          {b.claimsTierBreakdown?.length ? (
            <div className="mt-2 rounded-md border border-card-border bg-card/40 p-2">
              <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Risk-tiered claims bridge
              </div>
              {b.claimsTierBreakdown.map((tier) => (
                <CalcRow
                  key={tier.tier}
                  label={`${tier.tier} (${(tier.weight * 100).toFixed(0)}%, ${fmtUsd(tier.annualClaims, false)} baseline)`}
                  value={fmtUsd(tier.savings, false)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {/* Retention value */}
          <div className="rounded-lg border border-card-border bg-background/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-chart-2">
              <HeartPulse className="h-3.5 w-3.5" /> Retention value (reduced policy lapse)
            </div>
            <CalcRow label="Persisting members (engaged through horizon)" value={b.persistingMembers.toLocaleString()} />
            <CalcRow label="× Lapse reduction" value={fmtPct(b.lapseReductionPct, 1)} />
            <CalcRow label="× Member lifetime value (LTV)" value={fmtUsd(b.ltvPerMember, false)} />
            <div className="mt-1 border-t border-card-border pt-2">
              <CalcRow label="= Retention value" value={fmtUsd(b.retentionValue, false)} />
            </div>
          </div>

          {/* Mortality margin (life book) */}
          {b.mortalityValue && b.mortalityValue > 0 && b.mortalityDetail ? (
            <div className="rounded-lg border border-card-border bg-background/50 p-3">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-foreground/80">
                <HeartPulse className="h-3.5 w-3.5" /> Mortality margin (avoided death claims)
              </div>
              <CalcRow label="Effectively treated members" value={b.effectiveTreated.toLocaleString()} />
              <CalcRow label="× Baseline annual mortality" value={`${(b.mortalityDetail.baselineAnnualMortalityRate * 1000).toFixed(2)}‰`} />
              {b.mortalityDetail.highRiskRelativity > 1 ? (
                <CalcRow label="× Targeted-tier mortality relativity" value={`${b.mortalityDetail.highRiskRelativity.toFixed(1)}×`} />
              ) : null}
              <CalcRow label="× Relative mortality reduction (achieved steps)" value={fmtPct(b.mortalityDetail.relativeMortalityReduction, 1)} />
              <CalcRow label="× Attribution factor" value={fmtPct(b.mortalityDetail.attributionFactor, 1)} />
              <CalcRow label="× Average sum assured" value={fmtUsd(b.mortalityDetail.sumAssured, false)} />
              <div className="mt-1 border-t border-card-border pt-2">
                <CalcRow label="= Mortality margin" value={fmtUsd(b.mortalityValue, false)} />
              </div>
            </div>
          ) : null}

          {/* Total: gross -> costs -> net -> ROI */}
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <CalcRow label="Claims savings" value={fmtUsd(b.claimsSavings, false)} />
            {b.productivityValue ? <CalcRow label="Group productivity value" value={fmtUsd(b.productivityValue, false)} /> : null}
            <CalcRow label="Retention value" value={fmtUsd(b.retentionValue, false)} />
            {b.mortalityValue ? <CalcRow label="Mortality margin" value={fmtUsd(b.mortalityValue, false)} /> : null}
            <CalcRow label="Gross value" value={fmtUsd(b.totalValue, false)} />
            {roiAvailable ? (
              <>
                <CalcRow
                  label={
                    b.rewardCostRatio && b.rewardCostRatio < 1
                      ? `− Reward cost (${(b.rewardCostRatio * 100).toFixed(0)}% of face value after breakage)`
                      : "− Reward cost"
                  }
                  value={fmtUsd(b.rewardCost, false)}
                />
                <CalcRow label="− Admin cost" value={fmtUsd(b.adminCost, false)} />
                <CalcRow label="− Platform cost" value={fmtUsd(b.platformCost, false)} />
                {b.costBasis ? (
                  <>
                    <CalcRow label={`Reward basis (${b.costBasis.reward})`} value={`${Math.round(b.costBasis.rewardMembers).toLocaleString()} members × ${b.costBasis.months} mo`} mono={false} />
                    <CalcRow label={`Admin basis (${b.costBasis.admin})`} value={`${Math.round(b.costBasis.adminMembers).toLocaleString()} members × ${b.costBasis.months} mo`} mono={false} />
                    <CalcRow label={`Platform basis (${b.costBasis.platform})`} value={`${Math.round(b.costBasis.platformMembers).toLocaleString()} members × ${b.costBasis.months} mo`} mono={false} />
                  </>
                ) : null}
                <CalcRow label="= Net value" value={fmtUsd(b.netValue, false)} />
                <CalcRow label="ROI (net / cost)" value={`${(safeNumber(b.roi) * 100).toFixed(0)}%`} />
              </>
            ) : (
              <CalcRow label="= Break-even all-in budget before ROI" value={fmtUsd(b.totalValue, false)} />
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Claims savings use a claims-denominated bridge: applicable treated members × cost delta × prevalence ×
        attribution haircut × achieved dose × present-value factor
        {b.persistedSavingsYears && b.persistedSavingsYears > 1
          ? `, with persisting members' savings valued over ${b.persistedSavingsYears.toFixed(0)} years (Wagner 2001) and faders kept on the 1-year window`
          : ""}
        . The mortality margin is a separate life-book stream (steps→mortality gradient × sum assured, same attribution
        haircut) and never multiplies the health-claims base, so the two streams cannot double-count. Retention uses a
        separate lapse/LTV path.
        {b.targetHighRisk
          ? " Targeting is active: economics cover only the high-/moderate-risk tiers, with the tier mix renormalized to that pool."
          : ""}
      </p>
    </div>
  );
}
