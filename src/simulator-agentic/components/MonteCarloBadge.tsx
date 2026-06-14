import { useEffect, useRef, useState } from "react";
import type { MonteCarloResult } from "@shared/schema";
import { Dices, Layers, GitBranch, Activity } from "lucide-react";

// Count-up animation for run metrics.
function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    startRef.current = null;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / ms);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function Metric({
  icon,
  value,
  label,
  testId,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  testId?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="font-mono text-base font-semibold tabular text-foreground/95" data-testid={testId}>
          {value}
        </div>
        <div className="font-mono text-[0.6rem] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function MonteCarloBadge({ finance }: { finance: MonteCarloResult }) {
  const scenarios = useCountUp(finance.scenariosExplored);
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.07] via-card/50 to-background/50 p-4"
      data-testid="panel-monte-carlo"
    >
      {/* subtle animated scanline texture for a high-tech feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 1px, transparent 1px, transparent 7px)",
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div>
            <h3 className="font-mono text-sm font-semibold tracking-tight text-foreground/95">
              SIMULATION RUN
            </h3>
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              reproducible seed {finance.seed}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Metric
            icon={<Activity className="h-4 w-4" />}
            value={scenarios.toLocaleString()}
            label="scenarios explored"
            testId="text-scenarios-explored"
          />
          <Metric
            icon={<Dices className="h-4 w-4" />}
            value={finance.iterations.toLocaleString()}
            label="MC iterations"
            testId="text-mc-iterations"
          />
          <Metric
            icon={<GitBranch className="h-4 w-4" />}
            value={finance.rewardLevelsSwept.toLocaleString()}
            label="reward levels swept"
          />
          <Metric
            icon={<Layers className="h-4 w-4" />}
            value={`${finance.effectiveSampleSize ?? "—"}`}
            label="effective sample n"
          />
          <Metric
            icon={<Layers className="h-4 w-4" />}
            value={finance.calibrationWeight != null ? finance.calibrationWeight.toFixed(2) : "—"}
            label="calibration weight w"
          />
        </div>
      </div>

      <p className="relative mt-3 max-w-3xl font-mono text-[0.62rem] leading-relaxed text-muted-foreground">
        Each iteration jointly re-draws every uncertain input — enrollment, persistence, behaviour change, step
        lift, effort, claims-cost bridge, attribution, lapse reduction and LTV — then re-evaluates the value
        chain at the assumed offer context and across {finance.rewardLevelsSwept} reward levels. That is{" "}
        <span className="text-foreground/90">{finance.scenariosExplored.toLocaleString()}</span> distinct chain
        evaluations behind the P5 / P50 / P95 bands below. Band width is constrained by the member-agent sample and
        credibility weight, not by the iteration count alone.
      </p>
    </div>
  );
}
