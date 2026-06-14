import { useEffect, useMemo, useRef } from "react";
import type { SimState } from "@sim/lib/sim";
import { DECISION_META } from "@sim/lib/sim";
import { Check, Loader2, Circle } from "lucide-react";

// ---------------------------------------------------------------------------
// Phase model — derived purely from SimState so the boot graphic narrates the
// real run, never a fake timeline.
// ---------------------------------------------------------------------------
type PhaseState = "done" | "active" | "pending";

interface Phase {
  id: string;
  label: string;
  sub: string;
}

const PHASES: Phase[] = [
  { id: "parse", label: "Parse objective", sub: "resolving campaign · market · book · horizon" },
  { id: "spawn", label: "Spawn population", sub: "instantiating heterogeneous member-agents" },
  { id: "decide", label: "Estimating decisions", sub: "strict live AI · enroll · engage · persist" },
  { id: "calibrate", label: "Calibrate to evidence", sub: "shrinking emergent rates toward anchors" },
  { id: "montecarlo", label: "Monte Carlo", sub: "propagating sampling + dose-response uncertainty" },
  { id: "readout", label: "Executive read-out", sub: "writing plain-English verdict + recommendation" },
];

function phaseStatuses(s: SimState): Record<string, PhaseState> {
  const decideStarted = s.completed > 0 || s.agents.length > 0;
  const decideDone = s.total > 0 && s.completed >= s.total;
  const map: Record<string, PhaseState> = {
    parse: s.plan ? "done" : "active",
    spawn: s.populationTotal > 0 ? (decideStarted ? "done" : "active") : s.plan ? "active" : "pending",
    decide: decideDone ? "done" : decideStarted ? "active" : "pending",
    calibrate: s.calibration ? "done" : s.behavior ? "active" : "pending",
    montecarlo: s.finance ? "done" : s.calibration ? "active" : "pending",
    readout: s.narrative ? "done" : s.finance ? "active" : "pending",
  };
  return map;
}

// Short human label for the headline status line.
function headline(s: SimState): string {
  if (s.narrative) return "Read-out complete";
  if (s.finance) return "Composing executive read-out";
  if (s.calibration) return "Running Monte Carlo over the full book";
  if (s.behavior) return "Calibrating emergent rates to evidence";
  if (s.completed > 0 || s.agents.length > 0) return "Agents are deciding";
  if (s.plan) return "Spawning synthetic population";
  return "Parsing your objective";
}

// ---------------------------------------------------------------------------
// Particle field — one particle per sampled agent. Particles drift on a soft
// orbit; as agents resolve they "lock" to a decision colour and stop drifting.
// ---------------------------------------------------------------------------
function ParticleField({ state }: { state: SimState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // decision colour lookup
  const colorFor = useMemo(
    () => (decision: string | undefined) => {
      if (!decision) return null;
      return DECISION_META[decision]?.color ?? null;
    },
    []
  );

  useEffect(() => {
    const cvMaybe = canvasRef.current;
    if (!cvMaybe) return;
    const canvas: HTMLCanvasElement = cvMaybe;
    const c2d = canvas.getContext("2d");
    if (!c2d) return;
    const ctx: CanvasRenderingContext2D = c2d;

    let raf = 0;
    let particles: {
      baseA: number; // base angle
      r: number; // orbit radius fraction
      phase: number; // drift phase
      speed: number;
      twinkle: number;
    }[] = [];
    let lastTotal = -1;

    // Read CSS custom properties so canvas (which can't resolve var()) gets real colors.
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryHSL = rootStyles.getPropertyValue("--primary").trim();
    const chartHSL2 = rootStyles.getPropertyValue("--chart-2").trim();
    const ACCENT = `hsl(${primaryHSL})`;
    const accentA = (a: number) => `hsl(${primaryHSL} / ${a})`;
    const chart2A = (a: number) => `hsl(${chartHSL2} / ${a})`;

    function ensureParticles(n: number) {
      if (n === lastTotal) return;
      lastTotal = n;
      const arr: typeof particles = [];
      for (let i = 0; i < n; i++) {
        arr.push({
          baseA: (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
          r: 0.28 + Math.random() * 0.62,
          phase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.35,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
      particles = arr;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();

    function frame(now: number) {
      const s = stateRef.current;
      const t = (now - start) / 1000;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.46;

      const total = Math.max(s.total || s.plan?.sampleSize || 100, 1);
      ensureParticles(total);

      ctx.clearRect(0, 0, w, h);

      // central core glow — pulses while running, steadies when done
      const running = s.status === "running";
      const corePulse = running ? 0.7 + 0.3 * Math.sin(t * 2.2) : 1;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
      coreGrad.addColorStop(0, accentA(0.18 * corePulse));
      coreGrad.addColorStop(0.5, chart2A(0.07 * corePulse));
      coreGrad.addColorStop(1, accentA(0));
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // concentric scan rings
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        const rr = (R * k) / 3;
        ctx.strokeStyle = accentA(0.06 + 0.02 * k);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      // sweeping radar line while running
      if (running) {
        const sweep = t * 0.9;
        const grad = ctx.createLinearGradient(
          cx,
          cy,
          cx + Math.cos(sweep) * R,
          cy + Math.sin(sweep) * R
        );
        grad.addColorStop(0, accentA(0.35));
        grad.addColorStop(1, accentA(0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
        ctx.stroke();
      }

      // particles
      const completed = s.completed;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const resolved = i < completed;
        const decision = s.decisions[i + 1]?.decision;
        const locked = colorFor(decision);

        // resolved particles settle onto their orbit ring; unresolved drift
        const wobble = resolved ? 0 : Math.sin(t * p.speed + p.phase) * 0.06;
        const angle = p.baseA + (resolved ? 0 : t * p.speed * 0.12);
        const rad = (p.r + wobble) * R;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;

        const tw = 0.55 + 0.45 * Math.sin(t * 2 + p.twinkle);
        let size: number;
        let color: string;
        let alpha: number;

        if (locked) {
          color = locked;
          size = 2.6;
          alpha = 0.95;
        } else if (resolved) {
          color = ACCENT;
          size = 2.4;
          alpha = 0.85;
        } else {
          color = ACCENT;
          size = 1.8;
          alpha = 0.25 + 0.4 * tw;
        }

        // connect resolved particle to core with a faint thread
        if (resolved) {
          ctx.strokeStyle = accentA(0.05);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // halo for freshly-locked particles
        if (locked) {
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.arc(x, y, size + 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [colorFor]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" data-testid="canvas-boot-field" />;
}

// ---------------------------------------------------------------------------
// Main boot sequence card
// ---------------------------------------------------------------------------
export default function BootSequence({ state }: { state: SimState }) {
  const statuses = phaseStatuses(state);
  const total = state.total || state.plan?.sampleSize || 100;
  const completed = state.completed;
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  // counts by live decision so far
  const counts = useMemo(() => {
    const c = { engaged: 0, enrolled: 0, dropped: 0, nonstarter: 0 };
    for (const d of Object.values(state.decisions)) {
      if (d.decision in c) (c as Record<string, number>)[d.decision]++;
    }
    return c;
  }, [state.decisions]);

  return (
    <div
      className="boot-rise relative overflow-hidden rounded-xl border border-primary/25 bg-card/90"
      data-testid="card-boot-sequence"
    >
      {/* scan-line sheen */}
      <div className="boot-scan pointer-events-none absolute inset-x-0 top-0 h-px" />

      {/* Particle field stage */}
      <div className="relative h-[300px] w-full sm:h-[340px]">
        <ParticleField state={state} />

        {/* center HUD overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-primary/70">
            agentic simulation
          </div>
          <div
            className="boot-count mt-1 font-mono text-5xl font-semibold tabular text-foreground text-glow sm:text-6xl"
            data-testid="text-boot-counter"
          >
            {completed}
            <span className="text-2xl text-muted-foreground">/{total}</span>
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground" data-testid="text-boot-headline">
            {headline(state)}
            <span className="caret" />
          </div>
        </div>

        {/* decision tally — corner HUD */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 font-mono text-[0.65rem]">
          {(["engaged", "enrolled", "dropped", "nonstarter"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5" data-testid={`boot-tally-${k}`}>
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: DECISION_META[k].color }}
              />
              <span className="text-muted-foreground">{DECISION_META[k].label}</span>
              <span className="text-foreground/80">{counts[k]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* progress bar */}
      <div className="px-5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-card-border/60">
          <div
            className="boot-bar h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
            data-testid="bar-boot-progress"
          />
        </div>
      </div>

      {/* phase stepper */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-5 sm:grid-cols-3">
        {PHASES.map((ph, i) => {
          const st = statuses[ph.id];
          return (
            <div
              key={ph.id}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                st === "active"
                  ? "border-primary/40 bg-primary/5"
                  : st === "done"
                  ? "border-card-border bg-card/40"
                  : "border-card-border/50 bg-transparent opacity-55"
              }`}
              data-testid={`boot-phase-${ph.id}`}
              data-status={st}
            >
              <div className="mt-0.5 shrink-0">
                {st === "done" ? (
                  <Check className="h-4 w-4 text-[hsl(150_60%_55%)]" />
                ) : st === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[0.6rem] text-primary/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      st === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {ph.label}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[0.62rem] leading-snug text-muted-foreground">
                  {ph.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
