import { useMemo, useState } from "react";
import type { SimState } from "@sim/lib/sim";
import { buildPersonas, type SyntheticPersona } from "@sim/lib/personas";
import { BadgeCheck, MapPin, Quote, Search, ShieldCheck, UserRound } from "lucide-react";

export default function PersonaExplorer({ state }: { state: SimState }) {
  const personas = useMemo(() => buildPersonas(state.agents, state.decisions, state.plan), [state.agents, state.decisions, state.plan]);
  const [selectedId, setSelectedId] = useState<number | null>(personas[0]?.id ?? null);
  const [trust, setTrust] = useState("all");
  const [signal, setSignal] = useState("all");
  const [district, setDistrict] = useState("all");
  const selected = personas.find((p) => p.id === selectedId) ?? personas[0] ?? null;
  const districts = Array.from(new Set(personas.map((p) => p.agent.district))).sort();
  const signals = state.plan?.signalDefinitions ?? [];
  const filtered = personas.filter((p) => {
    if (trust !== "all" && p.trustTier !== trust) return false;
    if (district !== "all" && p.agent.district !== district) return false;
    if (signal !== "all" && !p.signals.some((s) => s.signalId === signal)) return false;
    return true;
  });

  if (!personas.length) {
    return (
      <div className="rounded-xl border border-card-border bg-card/40 p-6">
        <h2 className="font-mono text-sm font-semibold">Personas unlock after the run starts</h2>
        <p className="mt-2 text-sm text-muted-foreground">Run a scenario to generate the synthetic member cohort.</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]" data-testid="tab-personas">
      <div className="space-y-3">
        <Header />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Filter icon={<ShieldCheck className="h-3.5 w-3.5" />} value={trust} onChange={setTrust} options={["all", "High", "Medium", "Low"]} label="Trust" />
          <Filter icon={<BadgeCheck className="h-3.5 w-3.5" />} value={signal} onChange={setSignal} options={["all", ...signals.map((s) => s.signalId)]} label="Signal" />
          <Filter icon={<MapPin className="h-3.5 w-3.5" />} value={district} onChange={setDistrict} options={["all", ...districts]} label="District" />
        </div>
        <div className="grid max-h-[680px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 scrollbar-thin">
          {filtered.map((p) => (
            <PersonaCard key={p.id} persona={p} active={selected?.id === p.id} onClick={() => setSelectedId(p.id)} />
          ))}
        </div>
      </div>
      {selected && <PersonaDetail persona={selected} />}
    </section>
  );
}

function Header() {
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/40 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wide text-foreground">
        <UserRound className="h-3.5 w-3.5" /> Synthetic persona · models a real-world cohort, not a real member.
      </div>
      <h2 className="text-xl font-semibold tracking-tight">Synthetic cohort browser</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        These representative personas make the anonymous enterprise cohorts tangible without exposing real member identity.
      </p>
    </div>
  );
}

function Filter({ icon, label, value, onChange, options }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="rounded-lg border border-card-border bg-background/45 px-3 py-2">
      <span className="mb-1 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent font-mono text-xs text-foreground outline-none">
        {options.map((o) => <option key={o} value={o}>{o === "all" ? `All ${label.toLowerCase()}` : o}</option>)}
      </select>
    </label>
  );
}

function PersonaCard({ persona, active, onClick }: { persona: SyntheticPersona; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${active ? "border-primary/50 bg-primary/10" : "border-card-border bg-card/35 hover:border-primary/35"}`}
      data-testid={`persona-card-${persona.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold">{persona.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{persona.agent.occupation} · {persona.agent.district}</div>
        </div>
        <span className="rounded-full border border-card-border px-2 py-0.5 font-mono text-[0.6rem] text-muted-foreground">{persona.trustTier}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/75">{persona.agent.healthHistory}. {persona.agent.attitude}.</p>
      <div className="mt-2 font-mono text-[0.65rem] text-foreground">{persona.contribution}</div>
    </button>
  );
}

function PersonaDetail({ persona }: { persona: SyntheticPersona }) {
  return (
    <article className="rounded-xl border border-card-border bg-card/45 p-4" data-testid="persona-detail">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-foreground">
            Synthetic persona · models a real-world cohort, not a real member.
          </div>
          <h3 className="text-2xl font-semibold tracking-tight">{persona.handle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{persona.agent.personaBlurb}</p>
        </div>
        <MiniMap persona={persona} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Info label="Age / sex" value={`${persona.agent.age} · ${persona.agent.sex}`} />
        <Info label="Household" value={persona.agent.family} />
        <Info label="Income band" value={persona.incomeBand} />
      </div>

      <div className="mt-4 rounded-lg border border-card-border bg-background/40 p-3">
        <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          <Search className="h-3.5 w-3.5 text-primary" /> Health and signal stack
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {persona.signals.map((s) => (
            <div key={s.signalId} className="rounded-lg border border-card-border bg-card/40 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-mono text-xs font-semibold">{s.displayName}</div>
                <span className="rounded-full border border-primary/25 px-2 py-0.5 font-mono text-[0.58rem] text-primary">{s.evidenceTier}</span>
              </div>
              <div className="mt-1 font-mono text-lg text-foreground">{s.value}</div>
              <div className="mt-1 font-mono text-[0.62rem] text-muted-foreground">{s.trustTier} trust · {s.source}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-card-border bg-background/40 p-3">
          <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Plan response</div>
          <div className="mt-2 text-sm">
            {persona.decision ? `${persona.decision.decision} · ${persona.decision.weeksEngaged} weeks · reward sensitivity ${persona.decision.rewardSensitivity.toFixed(2)}` : "Decision pending"}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{persona.contribution}</p>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-foreground">
            <Quote className="h-3.5 w-3.5" /> Agent's own words
          </div>
          <p className="text-sm italic leading-relaxed text-foreground/85">{persona.quote}</p>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-background/40 p-3">
      <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function MiniMap({ persona }: { persona: SyntheticPersona }) {
  return (
    <div className="w-full max-w-[220px] rounded-lg border border-card-border bg-background/45 p-2">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[0.62rem] text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" /> {persona.agent.district}
      </div>
      <svg viewBox="0 0 100 70" className="h-28 w-full rounded-md bg-card/80">
        <path d="M12 45 C18 14, 48 8, 72 16 C91 23, 89 52, 66 59 C39 67, 18 62, 12 45 Z" fill="hsl(var(--secondary))" stroke="hsl(var(--primary) / .35)" />
        <circle cx={persona.locationPoint.x} cy={persona.locationPoint.y} r="4" fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
}

