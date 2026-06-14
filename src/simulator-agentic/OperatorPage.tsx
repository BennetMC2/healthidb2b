import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@sim/lib/queryClient";
import { Activity, Database, FunctionSquare, GitBranch, ShieldCheck } from "lucide-react";
export default function OperatorModelMap() {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/operator/model-map"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/operator/model-map");
      return res.json();
    },
  });

  return (
    <div className="mx-auto max-w-[1400px]">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">Operator Model Map</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Internal calculation map for operators, actuaries and governance reviewers. Shows where each output is
              produced, which assumptions feed it, and which modules own the formulas.
            </p>
          </div>
          {data && (
            <div className="rounded-lg border border-card-border bg-card/50 px-3 py-2 text-right font-mono text-xs">
              <div className="text-muted-foreground">map v{data.version}</div>
              <div className="text-primary">registry {data.registryVersion}</div>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-card-border bg-card/50 p-5 font-mono text-sm text-muted-foreground">Loading model map…</div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 font-mono text-sm text-destructive">
            Failed to load operator model map.
          </div>
        ) : (
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <InfoCard icon={<Database className="h-4 w-4" />} label="Assumption Set" title={`${data.assumptionSet.id}@${data.assumptionSet.version}`}>
                {data.assumptionSet.label} · {data.assumptionSet.status}
              </InfoCard>
              <InfoCard icon={<GitBranch className="h-4 w-4" />} label="Modules" title={`${data.modules.length} active modules`}>
                Module versions are included in the methodology payload for completed runs.
              </InfoCard>
              <InfoCard icon={<ShieldCheck className="h-4 w-4" />} label="Governed Inputs" title={`${data.governedInputs.length} input classes`}>
                Approved versions, selected segment sets, pending overrides and configured costs.
              </InfoCard>
            </section>

            <section className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="operator-chain">
              <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold">
                <Activity className="h-4 w-4 text-primary" /> Calculation Chain
              </h2>
              <div className="space-y-3">
                {data.calculationChain.map((step: any) => (
                  <div key={step.step} className="rounded-lg border border-card-border bg-background/45 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-mono text-sm font-semibold text-foreground/90">
                        {String(step.step).padStart(2, "0")} · {step.name}
                      </div>
                      <div className="font-mono text-[0.65rem] text-primary">{step.file}</div>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/75">{step.purpose}</p>
                    {step.formula && (
                      <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2 font-mono text-[0.68rem] leading-relaxed text-primary">
                        {step.formula}
                      </div>
                    )}
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <ListBlock title="Inputs" items={step.inputs} />
                      <ListBlock title="Outputs" items={step.outputs} />
                    </div>
                    {step.operatorNotes?.length ? (
                      <ul className="mt-2 space-y-1 text-[0.72rem] leading-relaxed text-muted-foreground">
                        {step.operatorNotes.map((note: string, i: number) => <li key={i}>{note}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="operator-formulas">
                <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold">
                  <FunctionSquare className="h-4 w-4 text-primary" /> Formula Register
                </h2>
                <div className="space-y-2">
                  {data.formulas.map((f: any) => (
                    <div key={f.name} className="rounded-lg border border-card-border bg-background/45 p-3">
                      <div className="font-mono text-sm text-foreground/90">{f.name}</div>
                      <div className="mt-1 rounded-md border border-card-border bg-card/40 p-2 font-mono text-[0.68rem] leading-relaxed text-primary">
                        {f.expression}
                      </div>
                      <div className="mt-1 font-mono text-[0.65rem] text-muted-foreground">{f.owner}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="operator-modules">
                  <h2 className="mb-3 font-mono text-sm font-semibold">Active Modules</h2>
                  <div className="space-y-2">
                    {data.modules.map((m: any) => (
                      <div key={`${m.moduleName}-${m.moduleVersion}`} className="rounded-lg border border-card-border bg-background/45 p-2.5">
                        <div className="font-mono text-xs text-foreground/90">{m.moduleName}</div>
                        <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                          v{m.moduleVersion} · {m.evidenceScope ?? "scope pending"}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-card-border bg-card/45 p-4">
                  <h2 className="mb-3 font-mono text-sm font-semibold">Governed Inputs</h2>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    {data.governedInputs.map((input: string) => <li key={input}>{input}</li>)}
                  </ul>
                </section>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

function InfoCard({ icon, label, title, children }: { icon: React.ReactNode; label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card/50 p-4">
      <div className="mb-2 flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="font-mono text-sm font-semibold text-foreground/90">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-md border border-card-border bg-card/35 p-2">
      <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {(items ?? []).map((item) => (
          <span key={item} className="rounded-full border border-card-border px-2 py-0.5 font-mono text-[0.62rem] text-foreground/75">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
