import type { TornadoBar } from "@shared/schema";
import { fmtUSD } from "@sim/lib/sim";

export default function Tornado({ bars }: { bars: TornadoBar[] }) {
  const max = Math.max(...bars.map((b) => Math.max(Math.abs(b.low), Math.abs(b.high))), 1);
  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4" data-testid="panel-tornado">
      <h3 className="mb-1 font-mono text-sm font-semibold tracking-tight">SENSITIVITY · value-created swing</h3>
      <p className="mb-3 font-mono text-[0.7rem] text-muted-foreground">
        Each factor varied across its agent-derived 95% CI; widest swing first.
      </p>
      <div className="space-y-3">
        {bars.map((b) => {
          const lo = Math.min(b.low, b.high);
          const hi = Math.max(b.low, b.high);
          const leftPct = ((lo + max) / (2 * max)) * 100;
          const widthPct = ((hi - lo) / (2 * max)) * 100;
          const centerPct = 50;
          return (
            <div key={b.factor} data-testid={`tornado-${b.factor.replace(/\s+/g, "-").toLowerCase()}`}>
              <div className="mb-1 flex justify-between font-mono text-xs">
                <span className="text-foreground/85">{b.factor}</span>
                <span className="text-muted-foreground">±{fmtUSD(b.swing / 2)}</span>
              </div>
              <div className="relative h-5 rounded bg-muted/40">
                <div className="absolute inset-y-0 w-px bg-card-border" style={{ left: `${centerPct}%` }} />
                <div
                  className="absolute inset-y-1 rounded-sm bg-gradient-to-r from-chart-2/70 to-primary/80"
                  style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1.5)}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-between font-mono text-[0.65rem] text-muted-foreground">
                <span>{fmtUSD(b.low)}</span>
                <span>{fmtUSD(b.high)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
