import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@sim/lib/queryClient";
import { safeNumber } from "@sim/lib/sim";
import type { AssumptionItem, AuditEvent, Citation, GuardrailFlag, MethodologyReport, ModelInputVersion, Scenario, SegmentUpload } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@sim/ui/sheet";
import { BookOpen, ShieldAlert, AlertTriangle, Info, Ban, FlaskConical, ListChecks, UploadCloud, Loader2, CheckCircle2, TableProperties, FolderKanban, Download, ScrollText } from "lucide-react";
import type { SimState } from "@sim/lib/sim";

export function Guardrails({ flags }: { flags: GuardrailFlag[] }) {
  if (!flags.length) return null;
  const icon = (l: GuardrailFlag["level"]) =>
    l === "critical" ? Ban : l === "warn" ? AlertTriangle : Info;
  const color = (l: GuardrailFlag["level"]) =>
    l === "critical" ? "hsl(var(--destructive))" : l === "warn" ? "hsl(var(--chart-4))" : "hsl(var(--primary))";
  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4" data-testid="panel-guardrails">
      <h3 className="mb-2 flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
        <ShieldAlert className="h-4 w-4 text-primary" /> GUARDRAILS
      </h3>
      <ul className="space-y-2">
        {flags.map((f, i) => {
          const Icon = icon(f.level);
          return (
            <li key={i} className="flex gap-2 text-xs leading-relaxed" data-testid={`guardrail-${i}`}>
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: color(f.level) }} />
              <span className="text-foreground/80">{f.message}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EvidenceDrawer() {
  const { data: citations } = useQuery<Citation[]>({
    queryKey: ["/api/citations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/citations");
      return res.json();
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground/80 hover-elevate"
          data-testid="button-evidence"
        >
          <BookOpen className="h-4 w-4 text-primary" /> Evidence base
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-lg" data-testid="drawer-evidence">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Evidence base — peer-reviewed sources</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {citations?.map((c) => (
            <div key={c.key} className="rounded-lg border border-card-border bg-card/50 p-3" data-testid={`citation-${c.key}`}>
              <div className="font-mono text-xs text-foreground">
                {c.authors} ({c.year}) · {c.journal}
              </div>
              <div className="mt-0.5 text-sm font-medium leading-snug">{c.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.finding}</p>
              <div className="mt-1 font-mono text-[0.7rem] text-foreground/50">DOI: {c.doi}</div>
            </div>
          ))}
          <p className="pt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
            Dose-response curves in the Monte Carlo are parameterized from these effect sizes and extrapolated to the
            modelled book. Effect sizes are associative epidemiology except SPRINT (RCT); treat absolute savings as
            directional, not guaranteed.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AuditDrawer() {
  const { data: events } = useQuery<AuditEvent[]>({
    queryKey: ["/api/audit"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/audit");
      return res.json();
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground/80 hover-elevate"
          data-testid="button-audit"
        >
          <ScrollText className="h-4 w-4 text-primary" /> Audit
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-xl" data-testid="drawer-audit">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Audit log — governance events</SheetTitle>
        </SheetHeader>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Recent scenario, model-input, backtest, simulation and export events. Prototype actor is system until auth is added.
        </p>
        <div className="mt-4 space-y-2">
          {events?.length ? events.map((event) => (
            <div key={event.id} className="rounded-lg border border-card-border bg-card/50 p-2.5" data-testid={`audit-event-${event.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
                <span className="text-foreground/85">{event.action}</span>
                <span className="text-foreground">{event.entityType}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">{event.summary}</p>
              <div className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
                {event.actor} · {new Date(event.createdAt).toLocaleString()}
              </div>
            </div>
          )) : (
            <p className="font-mono text-xs text-muted-foreground">No audit events yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Methodology drawer — the auditable spine of the instrument. Lays out the
// full causal chain, calibration anchors+values+sources, dose-response params
// with their CIs, the Monte Carlo setup, and the honest validity caveat.
// ---------------------------------------------------------------------------
export function MethodologyDrawer({ report }: { report: MethodologyReport | null }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground/80 hover-elevate"
          data-testid="button-methodology"
        >
          <ListChecks className="h-4 w-4 text-primary" /> Methodology
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-xl" data-testid="drawer-methodology">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Methodology — auditable inference chain</SheetTitle>
        </SheetHeader>
        {!report ? (
          <p className="mt-4 font-mono text-xs text-muted-foreground">Run a simulation to populate the audit trail.</p>
        ) : (
          <div className="mt-4 space-y-5">
            <section data-testid="method-chain">
              <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">Causal chain</h4>
              <ol className="space-y-1.5">
                {report.chain.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-snug text-foreground/85">
                    <span className="mt-0.5 font-mono text-xs text-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {report.modelModules?.length ? (
              <section data-testid="method-model-modules">
                <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">
                  Model modules <span className="text-muted-foreground">registry {report.modelRegistryVersion ?? "unversioned"}</span>
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {report.modelModules.map((m) => (
                    <div key={`${m.moduleName}-${m.moduleVersion}`} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                      <div className="font-mono text-xs text-foreground/85">{m.moduleName}</div>
                      <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                        v{m.moduleVersion} · {m.evidenceScope ?? "scope pending"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {(report.assumptions?.length || report.pendingAssumptionOverrides?.length || report.selectedSegmentSet || report.selectedLifeAssumptionSet) ? (
              <section data-testid="method-assumptions">
                <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">Assumption governance</h4>
                {report.selectedLifeAssumptionSet ? (
                  <div className="mb-2 rounded-lg border border-primary/30 bg-primary/8 p-2.5" data-testid="method-selected-life-assumptions">
                    <div className="font-mono text-[0.68rem] uppercase tracking-wide text-foreground">selected life-assumption version</div>
                    <div className="mt-1 font-mono text-xs text-foreground/85">{report.selectedLifeAssumptionSet.name}</div>
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                      {report.selectedLifeAssumptionSet.source}
                    </p>
                  </div>
                ) : null}
                {report.selectedSegmentSet ? (
                  <div className="mb-2 rounded-lg border border-primary/30 bg-primary/8 p-2.5" data-testid="method-selected-segment-set">
                    <div className="font-mono text-[0.68rem] uppercase tracking-wide text-foreground">selected population segment set</div>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
                      <span className="text-foreground/85">{report.selectedSegmentSet.name}</span>
                      <span className="text-foreground">{report.selectedSegmentSet.rowCount} rows</span>
                    </div>
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                      {report.selectedSegmentSet.source}
                    </p>
                  </div>
                ) : null}
                {report.pendingAssumptionOverrides?.length ? (
                  <div className="mb-2 rounded-lg border border-chart-4/35 bg-chart-4/8 p-2.5">
                    <div className="mb-1 font-mono text-[0.68rem] uppercase tracking-wide text-chart-4">
                      pending overrides used in this run
                    </div>
                    <div className="space-y-1.5">
                      {report.pendingAssumptionOverrides.map((a) => (
                        <AssumptionRow key={a.key} assumption={a} tone="pending" />
                      ))}
                    </div>
                  </div>
                ) : null}
                {report.assumptions?.length ? (
                  <div className="space-y-1.5">
                    {report.assumptions.map((a) => (
                      <AssumptionRow key={a.key} assumption={a} />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section data-testid="method-calibration">
              <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">
                Calibration — agent evidence × literature prior{" "}
                <span className="text-muted-foreground">
                  (n={report.calibration.effectiveSampleSize ?? "--"} · mean prior weight {safeNumber(report.calibration.shrinkage).toFixed(2)}
                  {report.calibration.priorTrust != null && report.calibration.priorTrust !== 1
                    ? ` · prior trust ${report.calibration.priorTrust.toFixed(2)}`
                    : ""}
                  )
                </span>
              </h4>
              <p className="mb-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                Each estimate is a precision-weighted blend: the agent cohort is the evidence, the published band is the
                prior. The prior weight is derived from the two precisions — more agents means the agents carry more of
                the number.
              </p>
              {report.calibration.referenceClasses?.length ? (
                <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {report.calibration.referenceClasses.map((rc) => (
                    <div key={rc.id} className={`rounded-lg border p-2.5 ${rc.active ? "border-primary/35 bg-primary/8" : "border-card-border bg-card/35"}`}>
                      <div className="font-mono text-[0.68rem] uppercase tracking-wide text-muted-foreground">
                        {rc.active ? "active reference class" : "comparison reference class"}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-foreground/85">{rc.label}</div>
                      <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">{rc.evidenceScope}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2">
                {report.calibration.anchors.map((a) => (
                  <div key={a.metric} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 font-mono text-xs">
                      <span className="flex items-center gap-1.5 text-foreground/85">
                        {a.metric}
                        {a.diverges ? (
                          <span className="rounded border border-chart-4/40 bg-chart-4/10 px-1 py-px text-[0.6rem] uppercase tracking-wide text-chart-4">
                            diverges z={safeNumber(a.divergenceZ).toFixed(1)}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">
                        agents <span className="text-foreground/50">{fmtAnchorVal(a.rawValue, a.metric)}</span>
                        {" → "}
                        <span className="text-foreground">{fmtAnchorVal(a.calibratedValue, a.metric)}</span>
                        {a.posteriorCI ? (
                          <span className="ml-1 text-foreground/40">
                            [{fmtAnchorVal(a.posteriorCI[0], a.metric)}–{fmtAnchorVal(a.posteriorCI[1], a.metric)}]
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                      prior band {fmtAnchorVal(a.anchorLow, a.metric)}–{fmtAnchorVal(a.anchorHigh, a.metric)}
                      {a.priorWeight != null ? <> · prior weight {safeNumber(a.priorWeight).toFixed(2)} (agents carry {((1 - safeNumber(a.priorWeight)) * 100).toFixed(0)}%)</> : null}
                      {a.rawCI ? <> · agent CI {fmtAnchorVal(a.rawCI[0], a.metric)}–{fmtAnchorVal(a.rawCI[1], a.metric)}</> : null}
                    </div>
                    <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">{a.source}</div>
                    {a.legacyAnchorLow != null && a.legacyAnchorHigh != null ? (
                      <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                        legacy comparison {fmtAnchorVal(a.legacyAnchorLow, a.metric)}–{fmtAnchorVal(a.legacyAnchorHigh, a.metric)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {report.calibration.divergenceFindings?.length ? (
                <div className="mt-2 rounded-lg border border-chart-4/30 bg-chart-4/5 p-2.5" data-testid="method-divergence-findings">
                  <div className="mb-1 font-mono text-[0.68rem] uppercase tracking-wide text-chart-4">
                    agent vs literature divergence findings
                  </div>
                  <div className="space-y-1.5">
                    {report.calibration.divergenceFindings.map((f, i) => (
                      <p key={i} className="text-[0.7rem] leading-relaxed text-foreground/80">{f}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {report.behaviorSegments?.length || report.rewardCurveShape ? (
              <section data-testid="method-agent-structure">
                <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">
                  Agent-derived response structure <span className="text-muted-foreground">(raw cohort, pre-calibration)</span>
                </h4>
                {report.rewardCurveShape ? (
                  <div className="mb-2 rounded-lg border border-primary/30 bg-primary/8 p-2.5">
                    <div className="font-mono text-[0.68rem] uppercase tracking-wide text-foreground">reward→engagement curve shape</div>
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                      Floor and ceiling come from the per-agent enroll-likelihood × reward-sensitivity distribution, not
                      tuned constants: at zero reward {((report.rewardCurveShape.floorShare) * 100).toFixed(0)}% of current
                      engagement survives; a saturating reward could reach {report.rewardCurveShape.capShare.toFixed(2)}×
                      current engagement.
                    </p>
                  </div>
                ) : null}
                {report.behaviorSegments?.length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {report.behaviorSegments.map((s) => (
                      <div key={s.id} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                        <div className="flex items-baseline justify-between font-mono text-xs">
                          <span className="text-foreground/85">{s.label}</span>
                          <span className="text-muted-foreground">n={s.n}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[0.65rem] text-muted-foreground">
                          <span>enrol {(safeNumber(s.enrollmentRate) * 100).toFixed(0)}%</span>
                          <span>engaged {(safeNumber(s.engagedRate) * 100).toFixed(0)}%</span>
                          <span>reward sens {(safeNumber(s.meanRewardSensitivity) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section data-testid="method-dose-response">
              <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">Dose-response parameters (with 95% CI)</h4>
              <div className="space-y-2">
                {report.doseResponse.map((d) => (
                  <div key={d.campaign} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="flex items-baseline justify-between font-mono text-xs">
                      <span className="text-foreground/85">{d.label}</span>
                      <span className="text-foreground tabular">
                        {d.effectUnit?.includes("USD")
                          ? fmtUSDLocal(d.effectP50)
                          : `${(safeNumber(d.effectP50) * 100).toFixed(1)}%`}
                        <span className="ml-1 text-foreground/40">
                          [{d.effectUnit?.includes("USD")
                            ? `${fmtUSDLocal(d.effectCI?.[0] ?? 0)}–${fmtUSDLocal(d.effectCI?.[1] ?? 0)}`
                            : `${(safeNumber(d.effectCI?.[0]) * 100).toFixed(1)}–${(safeNumber(d.effectCI?.[1]) * 100).toFixed(1)}%`}]
                        </span>
                      </span>
                    </div>
                    {d.effectUnit ? <div className="mt-0.5 font-mono text-[0.65rem] text-foreground/75">{d.effectUnit}</div> : null}
                    <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">{d.source}</div>
                  </div>
                ))}
              </div>
            </section>

            {report.lifeInsuranceValue && (
              <section data-testid="method-life-value">
                <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">Life insurance value path</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">mortality value</div>
                    <div className="font-mono text-base font-semibold text-foreground">{fmtUSDLocal(report.lifeInsuranceValue.mortalitySegmentationValue)}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">morbidity value</div>
                    <div className="font-mono text-base font-semibold text-foreground">{fmtUSDLocal(report.lifeInsuranceValue.morbidityValue)}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">acquisition value</div>
                    <div className="font-mono text-base font-semibold text-foreground">{fmtUSDLocal(report.lifeInsuranceValue.acquisitionValue)}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">persistency value</div>
                    <div className="font-mono text-base font-semibold text-foreground">{fmtUSDLocal(report.lifeInsuranceValue.lapsePersistencyValue)}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">reward cost</div>
                    <div className="font-mono text-base font-semibold text-chart-4">{fmtUSDLocal(report.lifeInsuranceValue.rewardCost)}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">net life value</div>
                    <div className="font-mono text-base font-semibold text-foreground">{fmtUSDLocal(report.lifeInsuranceValue.netValue)}</div>
                  </div>
                  <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
                    <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">evidence grade</div>
                    <div className="font-mono text-base font-semibold text-foreground/90">{report.lifeInsuranceValue.evidenceGrade}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Prototype life pathway: estimates mortality segmentation and lapse/persistency value from verified wearable-signal coverage. This is separate from health-claims ROI, does not reuse the claims bridge, and requires actuary-owned calibration. Additive use assumes the claims and life-risk channels are not double-counted.
                </p>
              </section>
            )}

            {report.rewardAllocation && (
              <section data-testid="method-reward-allocation">
                <h4 className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground">Cohort reward allocation</h4>
                <div className="space-y-2">
                  {report.rewardAllocation.allocations.slice(0, 5).map((a) => {
                    const score = report.rewardAllocation?.priorityScores.find((s) => s.cohortId === a.cohortId);
                    return (
                      <div key={a.cohortId} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
                          <span className="text-foreground/85">{humanizeCohort(a.cohortId)}</span>
                          <span className="text-foreground">{a.rewardLabel ?? humanizeReward(a.rewardOptionId)}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-[0.65rem] text-muted-foreground sm:grid-cols-4">
                          <span>priority {score ? (safeNumber(score.compositeScore) * 100).toFixed(0) : "--"}%</span>
                          <span>enrol +{(safeNumber(a.expectedEnrolmentLift) * 100).toFixed(0)}%</span>
                          <span>persist +{(safeNumber(a.expectedPersistenceLift) * 100).toFixed(0)}%</span>
                          <span>{a.cashValuePmpm != null ? `${fmtUSDLocal(a.cashValuePmpm)} PMPM value` : `cost ${fmtUSDLocal(a.expectedCost)}`}</span>
                        </div>
                        {a.deliveryMechanic ? (
                          <div className="mt-1 font-mono text-[0.65rem] text-foreground/75">mechanic: {a.deliveryMechanic}</div>
                        ) : null}
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">{a.rationale}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section data-testid="method-montecarlo">
              <h4 className="mb-1.5 font-mono text-xs uppercase tracking-wide text-foreground">Monte Carlo</h4>
              <p className="text-sm leading-relaxed text-foreground/80">
                {report.monteCarloIterations.toLocaleString()} iterations using the stored seed. Each draw jointly samples
                agent-derived rate uncertainty, claims-cost bridge uncertainty, attribution, persistence and reward response.
                The visible precision is constrained by the member-agent sample and the calibration weight shown above; this
                is not a validated confidence interval until calibrated against observed programme data.
              </p>
            </section>

            <section data-testid="method-caveat" className="rounded-lg border border-chart-4/30 bg-chart-4/5 p-3">
              <h4 className="mb-1 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-chart-4">
                <AlertTriangle className="h-3.5 w-3.5" /> Validity caveat
              </h4>
              <p className="text-sm leading-relaxed text-foreground/80">{report.caveat}</p>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function fmtAnchorVal(v: number, metric: string): string {
  if (/step/i.test(metric)) return `+${Math.round(v).toLocaleString()}`;
  return `${(safeNumber(v) * 100).toFixed(0)}%`;
}

function fmtUSDLocal(v: number): string {
  const n = safeNumber(v);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function fmtAssumptionValue(a: AssumptionItem): string {
  if (typeof a.value === "string") return a.value;
  if (/fraction/i.test(a.unit)) return `${(safeNumber(a.value) * 100).toFixed(2)}%`;
  if (/USD|\$/i.test(a.unit)) return fmtUSDLocal(a.value);
  return safeNumber(a.value).toLocaleString();
}

function AssumptionRow({ assumption, tone = "default" }: { assumption: AssumptionItem; tone?: "default" | "pending" }) {
  return (
    <div className="rounded-lg border border-card-border bg-card/50 p-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
        <span className="text-foreground/85">{assumption.label}</span>
        <span className={tone === "pending" ? "text-chart-4" : "text-foreground"}>
          {fmtAssumptionValue(assumption)}
        </span>
      </div>
      <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
        {assumption.unit} · {assumption.geography} · {assumption.editable ? "editable" : "locked"}
      </div>
      <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">{assumption.source}</p>
    </div>
  );
}

function humanizeCohort(id: string): string {
  return id.replace(/-/g, " ");
}

function humanizeReward(id: string): string {
  return id.replace(/-/g, " ");
}

// ---------------------------------------------------------------------------
// Segment upload drawer — stores sourced cohort tables as unapproved data
// assets. A later approval step can promote one upload into the active
// population provider. Until then, uploads do not affect sampling.
// ---------------------------------------------------------------------------
export function SegmentUploadDrawer() {
  const [name, setName] = useState("Life book segment weights");
  const [market, setMarket] = useState("HK");
  const [source, setSource] = useState("Client-provided segment table");
  const [csv, setCsv] = useState(
    "id,label,weight,ageBand,baselineSteps,mortalityPer1k,wearableOwnership,modifiabilityIndex,rewardSensitivity,source\n" +
      "midlife-sedentary,Midlife sedentary price-sensitive,0.24,35-49,4700,1.35,0.34,0.78,0.82,Client book analysis"
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: uploads } = useQuery<SegmentUpload[]>({
    queryKey: ["/api/segments/uploads"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/segments/uploads");
      return res.json();
    },
  });
  const { data: governedInputs } = useQuery<ModelInputVersion[]>({
    queryKey: ["/api/governance/model-inputs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/governance/model-inputs");
      return res.json();
    },
  });

  const submit = async () => {
    setSubmitting(true);
    setDone(null);
    setErr(null);
    try {
      const rows = parseSegmentCsv(csv);
      const res = await apiRequest("POST", "/api/segments/upload", { name, market, source, rows });
      const data = await res.json();
      setDone(data?.note || "Stored segment table.");
      queryClient.invalidateQueries({ queryKey: ["/api/segments/uploads"] });
    } catch (e: any) {
      setErr(e?.message || "Failed to upload segment table.");
    } finally {
      setSubmitting(false);
    }
  };

  const approveUpload = async (id: string) => {
    setApprovingId(id);
    setDone(null);
    setErr(null);
    try {
      const res = await apiRequest("POST", `/api/segments/uploads/${id}/approve`);
      const data = await res.json();
      setDone(data?.note || "Approved segment-set version.");
      queryClient.invalidateQueries({ queryKey: ["/api/governance/model-inputs"] });
    } catch (e: any) {
      setErr(e?.message || "Failed to approve segment upload.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground/80 hover-elevate"
          data-testid="button-segment-upload"
        >
          <TableProperties className="h-4 w-4 text-primary" /> Segments
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-xl" data-testid="drawer-segment-upload">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Segments — upload sourced cohort table</SheetTitle>
        </SheetHeader>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Paste a CSV cohort table. Uploads are stored as unapproved source data and do not affect simulation sampling
          until promoted into an approved segment set.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="name" value={name} onChange={setName} testid="input-segment-name" />
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">market</span>
            <select value={market} onChange={(e) => setMarket(e.target.value)} className="rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-sm text-foreground outline-none" data-testid="select-segment-market">
              <option value="HK">HK</option>
              <option value="SG">SG</option>
              <option value="GLOBAL">GLOBAL</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <TextField label="source" value={source} onChange={setSource} testid="input-segment-source" />
          </div>
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">csv rows</span>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            className="resize-y rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-xs leading-relaxed text-foreground outline-none"
            data-testid="input-segment-csv"
          />
        </label>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-mono text-sm font-semibold text-primary-foreground transition-all hover-elevate active-elevate-2 disabled:opacity-50"
          data-testid="button-submit-segments"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><UploadCloud className="h-4 w-4" /> Upload segment table</>}
        </button>

        {done && (
          <div className="mt-3 flex gap-2 rounded-lg border border-[hsl(150_60%_55%)]/30 bg-[hsl(150_60%_55%)]/10 p-3 text-xs leading-relaxed text-foreground/85" data-testid="text-segment-result">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(150_60%_55%)]" />
            <span>{done}</span>
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive" data-testid="text-segment-error">{err}</div>
        )}

        {uploads?.length ? (
          <div className="mt-5 space-y-2">
            <h4 className="font-mono text-xs uppercase tracking-wide text-foreground">Recent uploads</h4>
            {uploads.slice(0, 5).map((u) => (
              <div key={u.id} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
                  <span className="text-foreground/85">{u.name}</span>
                  <span className="text-foreground">{u.rowCount} rows</span>
                </div>
                <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                  {u.market} · {u.source} · {new Date(u.createdAt).toLocaleDateString()}
                </div>
                <button
                  type="button"
                  onClick={() => approveUpload(u.id)}
                  disabled={approvingId === u.id}
                  className="mt-2 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1 font-mono text-[0.65rem] font-semibold text-primary hover-elevate disabled:opacity-50"
                  data-testid={`button-approve-segment-${u.id}`}
                >
                  {approvingId === u.id ? "Approving..." : "Approve as segment-set version"}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {governedInputs?.length ? (
          <div className="mt-5 space-y-2">
            <h4 className="font-mono text-xs uppercase tracking-wide text-foreground">Governed model inputs</h4>
            {governedInputs.slice(0, 6).map((input) => (
              <div key={input.id} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
                  <span className="text-foreground/85">{input.name}</span>
                  <span className="text-foreground">{input.kind.replace("_", " ")}</span>
                </div>
                <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                  {input.status} · {input.source} · {new Date(input.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TextField({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-sm text-foreground outline-none"
        data-testid={testid}
      />
    </label>
  );
}

function parseSegmentCsv(csv: string) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!headerLine) throw new Error("CSV must include a header row.");
  const headers = headerLine.split(",").map((h) => h.trim());
  const required = ["id", "label", "weight", "ageBand", "baselineSteps", "mortalityPer1k", "wearableOwnership", "modifiabilityIndex", "rewardSensitivity", "source"];
  for (const key of required) {
    if (!headers.includes(key)) throw new Error(`CSV missing required column: ${key}`);
  }
  return lines.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    const number = (key: string) => {
      const parsed = Number(row[key]);
      if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric value for ${key}.`);
      return parsed;
    };
    return {
      id: row.id,
      label: row.label,
      weight: number("weight"),
      ageBand: row.ageBand,
      baselineSteps: number("baselineSteps"),
      mortalityPer1k: number("mortalityPer1k"),
      wearableOwnership: number("wearableOwnership"),
      modifiabilityIndex: number("modifiabilityIndex"),
      rewardSensitivity: number("rewardSensitivity"),
      source: row.source,
    };
  });
}

export function ScenarioLibraryDrawer({ state }: { state: SimState }) {
  const defaultName = state.plan
    ? `${state.plan.campaignLabel} · ${state.plan.market} · ${new Date().toISOString().slice(0, 10)}`
    : "Saved scenario";
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scenarios");
      return res.json();
    },
  });

  const canSave = Boolean(state.plan && state.finance && state.methodology);
  const save = async () => {
    if (!state.plan || !state.finance || !state.methodology) return;
    setSaving(true);
    setDone(null);
    setErr(null);
    try {
      const res = await apiRequest("POST", "/api/scenarios", {
        name: name.trim() || defaultName,
        goal: state.plan.objective,
        plan: JSON.stringify(state.plan),
        behavior: JSON.stringify(state.calibratedBehavior ?? state.behavior),
        finance: JSON.stringify(state.finance),
        methodology: JSON.stringify(state.methodology),
        narrative: state.narrative ? JSON.stringify(state.narrative) : null,
      });
      const data = await res.json();
      setDone(data?.note || "Scenario saved.");
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
    } catch (e: any) {
      setErr(e?.message || "Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  };

  const rows = (scenarios ?? []).map(scenarioSummary);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground/80 hover-elevate"
          data-testid="button-scenarios"
        >
          <FolderKanban className="h-4 w-4 text-primary" /> Scenarios
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-2xl" data-testid="drawer-scenarios">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Scenarios — save, compare, export</SheetTitle>
        </SheetHeader>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Save the completed run as a named scenario. Saved scenarios preserve the plan, behaviour, economics,
          methodology and reward allocation so they can be compared later.
        </p>

        <div className="mt-4 rounded-lg border border-card-border bg-card/45 p-3">
          <TextField label="scenario name" value={name} onChange={setName} testid="input-scenario-name" />
          <button
            onClick={save}
            disabled={!canSave || saving}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-mono text-sm font-semibold text-primary-foreground transition-all hover-elevate active-elevate-2 disabled:opacity-50"
            data-testid="button-save-scenario"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save current scenario"}
          </button>
          {!canSave && <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">Run a scenario before saving.</p>}
          {done && <p className="mt-2 font-mono text-[0.68rem] text-[hsl(150_60%_55%)]" data-testid="text-scenario-saved">{done}</p>}
          {err && <p className="mt-2 font-mono text-[0.68rem] text-destructive" data-testid="text-scenario-error">{err}</p>}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-mono text-xs uppercase tracking-wide text-foreground">Saved scenario comparison</h4>
          <button
            type="button"
            onClick={() => downloadCsv(rows)}
            disabled={!rows.length}
            className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card/60 px-2.5 py-1.5 font-mono text-[0.68rem] text-foreground/80 hover-elevate disabled:opacity-50"
            data-testid="button-export-scenarios"
          >
            <Download className="h-3.5 w-3.5 text-primary" /> CSV
          </button>
        </div>
        {rows.length ? (
          <div className="mt-2 overflow-x-auto rounded-lg border border-card-border">
            <table className="min-w-full text-left font-mono text-[0.68rem]">
              <thead className="bg-card/60 text-muted-foreground">
                <tr>
                  <th className="px-2.5 py-2">name</th>
                  <th className="px-2.5 py-2">campaign</th>
                  <th className="px-2.5 py-2">market</th>
                  <th className="px-2.5 py-2">behaviour</th>
                  <th className="px-2.5 py-2">gross</th>
                  <th className="px-2.5 py-2">net life</th>
                  <th className="px-2.5 py-2">reward cost</th>
                  <th className="px-2.5 py-2">verdict</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-card-border text-foreground/80">
                    <td className="px-2.5 py-2">{r.name}</td>
                    <td className="px-2.5 py-2">{r.campaign}</td>
                    <td className="px-2.5 py-2">{r.market}</td>
                    <td className="px-2.5 py-2">{(r.behaviourChange * 100).toFixed(0)}%</td>
                    <td className="px-2.5 py-2">{fmtUSDLocal(r.grossValue)}</td>
                    <td className="px-2.5 py-2">{fmtUSDLocal(r.netLifeValue)}</td>
                    <td className="px-2.5 py-2">{fmtUSDLocal(r.rewardCost)}</td>
                    <td className="px-2.5 py-2">{r.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 font-mono text-xs text-muted-foreground">No saved scenarios yet.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

function scenarioSummary(scenario: Scenario) {
  const plan = safeJson<any>(scenario.plan, {});
  const finance = safeJson<any>(scenario.finance, {});
  const methodology = safeJson<any>(scenario.methodology, {});
  const narrative = safeJson<any>(scenario.narrative ?? "", {});
  return {
    id: scenario.id,
    name: scenario.name,
    campaign: plan.campaignLabel ?? plan.campaign ?? "unknown",
    market: plan.market ?? "unknown",
    behaviourChange: finance.behaviorChange?.p50 ?? 0,
    grossValue: finance.valueCreatedP50 ?? methodology.lifeInsuranceValue?.grossValue ?? 0,
    netLifeValue: methodology.lifeInsuranceValue?.netValue ?? 0,
    rewardCost: methodology.lifeInsuranceValue?.rewardCost ?? finance.rewardToSustainP50 ?? 0,
    verdict: narrative.verdict ?? "not recorded",
  };
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function downloadCsv(rows: ReturnType<typeof scenarioSummary>[]) {
  const headers = ["name", "campaign", "market", "behaviourChange", "grossValue", "netLifeValue", "rewardCost", "verdict"];
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `healthid-scenario-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  try {
    await apiRequest("POST", "/api/audit", {
      action: "scenario.exported",
      entityType: "scenario_comparison",
      entityId: null,
      summary: `Exported ${rows.length} saved scenarios to CSV.`,
      metadata: { rowCount: rows.length, format: "csv" },
    });
    queryClient.invalidateQueries({ queryKey: ["/api/audit"] });
  } catch {
    // Export should not fail if audit write is unavailable.
  }
}

// ---------------------------------------------------------------------------
// Backtesting drawer — first-class hook (stub). Insurers upload real historical
// campaign outcomes (enrollment, persistence, claims delta) that will be used
// to recalibrate the anchor bands and produce validation residuals. The server
// interface is live (POST /api/backtest); recalibration is documented as the
// next stage.
// ---------------------------------------------------------------------------
export function BacktestDrawer() {
  const [campaign, setCampaign] = useState("steps");
  const [market, setMarket] = useState("HK");
  const [bookSize, setBookSize] = useState("100000");
  const [reward, setReward] = useState("48"); // entered as $/member/YEAR
  const [enrollment, setEnrollment] = useState("22");
  const [persistence, setPersistence] = useState("38");
  const [claimsDelta, setClaimsDelta] = useState("3.5");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [comparison, setComparison] = useState<any | null>(null);

  const { data: backtests } = useQuery<any[]>({
    queryKey: ["/api/backtest"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/backtest");
      return res.json();
    },
  });

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    setDone(null);
    setComparison(null);
    try {
      const payload = {
        campaign,
        market,
        bookSize: parseInt(bookSize, 10) || 0,
        // field is entered as $/member/YEAR; server contract is per-month
        rewardPerMemberPerMonth: Math.round((parseFloat(reward) || 0) / 12),
        // basis points (x100) to keep server-side integer storage exact
        observedEnrollment: Math.round((parseFloat(enrollment) || 0) * 100),
        observedPersistence: Math.round((parseFloat(persistence) || 0) * 100),
        observedClaimsDeltaPct: Math.round((parseFloat(claimsDelta) || 0) * 100),
        notes: notes || null,
      };
      const res = await apiRequest("POST", "/api/backtest", payload);
      const data = await res.json();
      setDone(data?.note || "Stored.");
      setComparison(data?.comparison ?? null);
      queryClient.invalidateQueries({ queryKey: ["/api/backtest"] });
    } catch (e: any) {
      setErr(e?.message || "Failed to submit backtest.");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, value, onChange, suffix, testid }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; testid: string }) => (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 rounded-lg border border-input bg-background/70 px-2.5 py-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
          data-testid={testid}
        />
        {suffix && <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-card-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground/80 hover-elevate"
          data-testid="button-backtest"
        >
          <FlaskConical className="h-4 w-4 text-primary" /> Backtest
        </button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-lg" data-testid="drawer-backtest">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">Backtest — validate against real outcomes</SheetTitle>
        </SheetHeader>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Upload a real historical campaign's observed outcomes. These move the model from a{" "}
          <span className="text-foreground/80">calibrated planning estimate</span> toward a{" "}
          <span className="text-foreground/80">validated</span> one — observed enrollment, persistence and claims-delta
          recalibrate the anchor bands and produce validation residuals. Server interface:{" "}
          <span className="font-mono text-primary">POST /api/backtest</span>.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">campaign</span>
            <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-sm text-foreground outline-none" data-testid="select-bt-campaign">
              <option value="steps">steps</option>
              <option value="vo2max">vo2max</option>
              <option value="sleep">sleep</option>
              <option value="bp_screening">bp_screening</option>
              <option value="hba1c_screening">hba1c_screening</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">market</span>
            <select value={market} onChange={(e) => setMarket(e.target.value)} className="rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-sm text-foreground outline-none" data-testid="select-bt-market">
              <option value="HK">HK</option>
              <option value="SG">SG</option>
            </select>
          </label>
          <Field label="book size" value={bookSize} onChange={setBookSize} suffix="members" testid="input-bt-book" />
          <Field label="reward" value={reward} onChange={setReward} suffix="$/yr" testid="input-bt-reward" />
          <Field label="observed enrollment" value={enrollment} onChange={setEnrollment} suffix="%" testid="input-bt-enrollment" />
          <Field label="observed persistence" value={persistence} onChange={setPersistence} suffix="%" testid="input-bt-persistence" />
          <Field label="observed claims delta" value={claimsDelta} onChange={setClaimsDelta} suffix="%" testid="input-bt-claims" />
        </div>
        <label className="mt-3 flex flex-col gap-1">
          <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none rounded-lg border border-input bg-background/70 px-2.5 py-1.5 text-sm text-foreground outline-none" data-testid="input-bt-notes" />
        </label>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-mono text-sm font-semibold text-primary-foreground transition-all hover-elevate active-elevate-2 disabled:opacity-50"
          data-testid="button-submit-backtest"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><UploadCloud className="h-4 w-4" /> Submit backtest</>}
        </button>

        {done && (
          <div className="mt-3 flex gap-2 rounded-lg border border-[hsl(150_60%_55%)]/30 bg-[hsl(150_60%_55%)]/10 p-3 text-xs leading-relaxed text-foreground/85" data-testid="text-backtest-result">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(150_60%_55%)]" />
            <span>{done}</span>
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive" data-testid="text-backtest-error">{err}</div>
        )}

        {comparison && <BacktestComparisonCard comparison={comparison} />}

        {backtests?.length ? (
          <div className="mt-5 space-y-2">
            <h4 className="font-mono text-xs uppercase tracking-wide text-foreground">Recent comparisons</h4>
            {backtests.slice(0, 5).map((bt) => (
              <div key={bt.id} className="rounded-lg border border-card-border bg-card/50 p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs">
                  <span className="text-foreground/85">{bt.campaign} · {bt.market}</span>
                  <span className={bt.comparison?.validationStatus === "drift" ? "text-destructive" : "text-foreground"}>
                    {String(bt.comparison?.validationStatus ?? "stored").replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                  {bt.bookSize.toLocaleString()} members · {new Date(bt.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function BacktestComparisonCard({ comparison }: { comparison: any }) {
  const fmt = (metric: string, value: number) => {
    if (metric === "reward_pmpm") return `$${value.toFixed(2)}`;
    return `${(value * 100).toFixed(1)}%`;
  };
  return (
    <div className="mt-3 rounded-lg border border-card-border bg-card/50 p-3" data-testid="panel-backtest-comparison">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-mono text-xs uppercase tracking-wide text-foreground">Validation comparison</h4>
        <span className="font-mono text-[0.68rem] text-foreground/80">{String(comparison.validationStatus).replace(/_/g, " ")}</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {comparison.residuals?.map((r: any) => (
          <div key={r.metric} className="rounded-lg border border-card-border bg-background/45 p-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[0.68rem]">
              <span className="text-foreground/85">{String(r.metric).replace(/_/g, " ")}</span>
              <span className={r.severity === "drift" ? "text-destructive" : r.severity === "watch" ? "text-chart-4" : "text-foreground"}>
                {r.severity}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[0.65rem] text-muted-foreground">
              <span>expected {fmt(r.metric, r.expected)}</span>
              <span>observed {fmt(r.metric, r.observed)}</span>
              <span>resid {fmt(r.metric, r.residual)}</span>
            </div>
          </div>
        ))}
      </div>
      {comparison.recommendedUpdates?.length ? (
        <ul className="mt-2 space-y-1 text-[0.7rem] leading-relaxed text-muted-foreground">
          {comparison.recommendedUpdates.map((u: string, i: number) => <li key={i}>{u}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
