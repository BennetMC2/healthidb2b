import {
  Bar,
  BarChart,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Tooltip,
  XAxis,
} from "recharts";
import type { Distribution } from "@shared/schema";

interface Props {
  title: string;
  dist: Distribution;
  format: (n: number) => string;
  accent?: string;
}

export default function DistributionChart({ title, dist, format, accent = "hsl(var(--primary))" }: Props) {
  const data = dist.histogram.map((h) => ({
    x: h.x,
    count: h.count,
    inBand: h.x >= dist.p5 && h.x <= dist.p95,
  }));

  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4" data-testid={`chart-dist-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="mb-1 flex items-baseline justify-between">
        <h4 className="font-mono text-xs font-semibold tracking-tight text-muted-foreground">{title}</h4>
        <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
          P50 {format(dist.p50)}
        </span>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }} barCategoryGap={1}>
            <XAxis dataKey="x" hide />
            <Tooltip
              cursor={{ fill: "hsl(220 16% 20% / 0.4)" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--secondary))",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              labelFormatter={(v) => format(Number(v))}
              formatter={(val: any) => [`${val} runs`, "freq"]}
            />
            <ReferenceLine x={dist.p5} stroke="hsl(220 12% 50%)" strokeDasharray="3 3" />
            <ReferenceLine x={dist.p50} stroke={accent} strokeWidth={1.5} />
            <ReferenceLine x={dist.p95} stroke="hsl(220 12% 50%)" strokeDasharray="3 3" />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive>
              {data.map((d, i) => (
                <Cell key={i} fill={d.inBand ? accent : "hsl(var(--secondary))"} fillOpacity={d.inBand ? 0.85 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.7rem] text-muted-foreground">
        <span>P5 {format(dist.p5)}</span>
        <span className="text-foreground/60">90% interval</span>
        <span>P95 {format(dist.p95)}</span>
      </div>
    </div>
  );
}
