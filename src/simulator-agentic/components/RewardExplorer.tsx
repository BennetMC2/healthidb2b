import { useMemo, useState, useEffect, useRef } from "react";
import { interpolateRewardPoint } from "@sim/lib/rewards";
import {
  ComposedChart,
  Area,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { RewardOptimization, RewardRoiPoint, ResolvedPlan, DoseResponseArm } from "@shared/schema";
import { fmtUsd, fmtPct, fmtPmpm, fmtPerYear, fmtHp } from "@sim/lib/format";
import type { VerifyResult } from "@sim/SimulatorPage";
import { Slider } from "@sim/ui/slider";
import { Button } from "@sim/ui/button";
import { Sliders, Crosshair, Users, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

const ACCENT = "hsl(var(--primary))";
const OPT = "hsl(150 60% 55%)";

// TIER 2: the reward lever. Dragging this slider drives the Decision Card
// above — this panel deliberately repeats NO headline metrics. It owns the
// reward-response curve, the works-well band and Pin & verify.
export default function RewardExplorer({
  opt,
  plan,
  reward,
  onRewardChange,
  onVerify,
  arms,
}: {
  opt: RewardOptimization;
  plan: ResolvedPlan | null;
  // Observed synthetic-RCT reward arms (when the run randomized agents across
  // reward levels) — drawn as observed points so it's visible that the curve
  // was fit through real arm engagement, not extrapolated from one offer.
  arms?: DoseResponseArm[];
  // ONE shared reward state, owned by Home: the reward configured on the first
  // page, the decision card and this slider all read/write the same value.
  reward: number;
  onRewardChange: (reward: number) => void;
  onVerify: (
    reward: number,
    onDone: (r: VerifyResult | null) => void,
    onProgress?: (completed: number, total: number) => void
  ) => () => void;
}) {
  const curve = opt.roiCurve;
  const minR = curve[0]?.reward ?? 0;
  const maxR = curve[curve.length - 1]?.reward ?? 12;
  // The band's lower edge — offered as a "jump to" shortcut only; the slider
  // itself stays wherever the user (or their configured reward) put it.
  const recommended = curve[opt.recommendedRewardIndex]?.reward ?? opt.optimalReward;

  const pt = useMemo(() => interpolateRewardPoint(curve, reward), [curve, reward]);

  // Pin & verify state
  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState<{ done: number; total: number } | null>(null);
  const [verified, setVerified] = useState<VerifyResult | null>(null);
  const stopVerifyRef = useRef<(() => void) | null>(null);

  // Discard a stale verified point once the user drags away from it.
  useEffect(() => {
    if (verified && Math.abs(verified.reward - reward) > 0.01) setVerified(null);
  }, [reward, verified]);

  useEffect(() => () => stopVerifyRef.current?.(), []);

  const runVerify = () => {
    if (verifying) return;
    setVerifying(true);
    setVerified(null);
    setVerifyProgress({ done: 0, total: plan?.sampleSize ?? 100 });
    stopVerifyRef.current = onVerify(
      reward,
      (r) => {
        setVerifying(false);
        setVerifyProgress(null);
        setVerified(r);
      },
      (done, total) => setVerifyProgress({ done, total })
    );
  };

  const data = curve.map((p) => ({
    reward: p.reward,
    net: p.netValue,
    band: [p.netValueP5, p.netValueP95] as [number, number],
  }));

  const viable = opt.viableRewardRange;
  const band = opt.workWellRange;
  const inBand = band ? reward >= band[0] - 0.01 && reward <= band[1] + 0.01 : false;

  return (
    <div
      className="rounded-xl border border-primary/30 bg-gradient-to-br from-card/70 to-background/50 p-4 sm:p-5"
      data-testid="panel-reward-explorer"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
          <Sliders className="h-4 w-4 text-primary" /> REWARD LEVER
        </h3>
        <span className="font-mono text-[0.68rem] text-muted-foreground">
          drag the slider — the decision readout above updates live
        </span>
      </div>

      {opt.shapeSource === "observed-arms" && arms?.length ? (
        <div
          className="mb-3 rounded-lg border border-[hsl(150_60%_55%)]/30 bg-[hsl(150_60%_55%)]/5 px-3 py-2 font-mono text-[0.68rem] text-muted-foreground"
          data-testid="chip-observed-arms"
        >
          <span className="text-[hsl(150_70%_60%)]">Synthetic RCT:</span> this curve is fit through{" "}
          {arms.length} randomized reward arms, not extrapolated from one offer —{" "}
          {arms.map((a) => `$${a.rewardPmpm}: ${(a.engagedRate * 100).toFixed(0)}% (n=${a.n})`).join(" · ")}.{" "}
          The $0 arm is pure intrinsic motivation: members engaging for their health and the companion experience, with no
          cash on the table.
        </div>
      ) : null}

      {/* SLIDER — the primary control */}
      <div className="mb-4 rounded-lg border border-card-border bg-background/40 p-3.5">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-wide text-muted-foreground">
              Reward per member per month
            </div>
            <div className="flex flex-wrap items-baseline gap-2 font-mono">
              <span className="text-3xl font-bold tabular text-foreground" data-testid="text-reward-value">
                {fmtPmpm(reward)}
              </span>
              <span className="text-xs text-muted-foreground">
                = {fmtPerYear(reward)} · {fmtHp(reward)}
              </span>
              {inBand ? (
                <span
                  className="flex items-center gap-1 rounded-full border border-[hsl(150_60%_55%)]/40 bg-[hsl(150_60%_55%)]/10 px-2 py-0.5 text-[0.62rem] text-[hsl(150_60%_55%)]"
                  data-testid="chip-in-band"
                >
                  <CheckCircle2 className="h-3 w-3" /> works-well band
                </span>
              ) : (
                <button
                  onClick={() => onRewardChange(recommended)}
                  className="rounded-full border border-card-border px-2 py-0.5 text-[0.62rem] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  data-testid="button-reset-recommended"
                >
                  jump to best net value ({fmtPmpm(recommended)})
                </button>
              )}
            </div>
          </div>
        </div>
        <Slider
          value={[reward]}
          min={minR}
          max={maxR}
          step={0.25}
          onValueChange={(v) => onRewardChange(v[0])}
          data-testid="slider-reward"
          aria-label="Reward per member per month"
        />
        <div className="mt-1.5 flex justify-between font-mono text-[0.6rem] text-muted-foreground">
          <span>{fmtPmpm(minR)}</span>
          {band && (
            <span className="text-[hsl(150_60%_55%)]" data-testid="text-band-range">
              works-well band {fmtPmpm(band[0])} – {fmtPmpm(band[1])}
            </span>
          )}
          <span>{fmtPmpm(maxR)}</span>
        </div>
      </div>

      {/* NET VALUE vs REWARD CURVE — movable marker + works-well + net-positive bands */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 20, left: 4 }}>
            <CartesianGrid stroke="hsl(var(--secondary))" strokeDasharray="2 4" vertical={false} />
            {/* self-funding zone — faint context */}
            {viable && (
              <ReferenceArea
                x1={viable[0]}
                x2={viable[1]}
                fill={OPT}
                fillOpacity={0.05}
                stroke="none"
                ifOverflow="extendDomain"
              />
            )}
            {/* WORKS-WELL BAND — the headline conclusion, shown as a prominent shaded zone */}
            {band && (
              <ReferenceArea
                x1={band[0]}
                x2={band[1]}
                fill={OPT}
                fillOpacity={0.16}
                stroke={OPT}
                strokeOpacity={0.5}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
                label={{
                  value: "works-well band",
                  position: "insideTop",
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  fill: OPT,
                }}
              />
            )}
            <XAxis
              dataKey="reward"
              type="number"
              domain={[minR, maxR]}
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(220 12% 55%)" }}
              tickFormatter={(v) => `$${Number(v)}`}
              stroke="hsl(var(--secondary))"
              label={{
                value: "reward (USD PMPM)",
                position: "bottom",
                offset: 6,
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fill: "hsl(220 12% 50%)",
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(220 12% 55%)" }}
              tickFormatter={(v) => fmtUsd(Number(v))}
              stroke="hsl(var(--secondary))"
              width={52}
            />
            <Tooltip
              cursor={{ stroke: "hsl(220 16% 40%)", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--secondary))",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              labelFormatter={(v) => `reward ${fmtPmpm(Number(v))}`}
              formatter={(val: any, name: any) => {
                if (name === "net") return [fmtUsd(Number(val)), "net value (P50)"];
                if (name === "band") return [`${fmtUsd(val[0])} – ${fmtUsd(val[1])}`, "P5–P95"];
                return [fmtUsd(Number(val)), name];
              }}
            />
            <ReferenceLine y={0} stroke="hsl(220 12% 40%)" strokeWidth={1} />
            <Area dataKey="band" stroke="none" fill={ACCENT} fillOpacity={0.12} isAnimationActive={false} />
            <Line dataKey="net" stroke={ACCENT} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            {/* observed synthetic-RCT arm markers */}
            {opt.shapeSource === "observed-arms" &&
              arms?.map((a) => (
                <ReferenceDot
                  key={`arm-${a.rewardPmpm}`}
                  x={Math.min(Math.max(a.rewardPmpm, minR), maxR)}
                  y={interpolateRewardPoint(curve, Math.min(Math.max(a.rewardPmpm, minR), maxR)).netValue}
                  r={3.5}
                  fill="hsl(var(--card))"
                  stroke={OPT}
                  strokeWidth={1.5}
                  isFront
                />
              ))}
            {/* movable marker at the slider position */}
            <ReferenceLine x={reward} stroke="hsl(var(--primary))" strokeWidth={1.5} />
            <ReferenceDot
              x={reward}
              y={pt.netValue}
              r={5}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isFront
            />
            {/* verified point overlay */}
            {verified && (
              <ReferenceDot
                x={verified.reward}
                y={verified.netValue}
                r={6}
                fill="hsl(150 70% 60%)"
                stroke="hsl(var(--card))"
                strokeWidth={2}
                isFront
                label={{
                  value: "verified",
                  position: "bottom",
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  fill: "hsl(150 70% 60%)",
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.62rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: ACCENT }} /> net value P50
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: ACCENT, opacity: 0.25 }} /> P5–P95 band
        </span>
        {band && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: OPT, opacity: 0.4 }} /> works-well band (≥80% of peak net)
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-px" style={{ background: "hsl(var(--primary))" }} /> your reward
        </span>
        {opt.shapeSource === "observed-arms" && arms?.length ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full border" style={{ borderColor: OPT }} /> observed RCT arm
          </span>
        ) : null}
        {viable && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: OPT, opacity: 0.12 }} /> net-positive range (net ≥ 0)
          </span>
        )}
      </div>

      {/* PIN & VERIFY */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-card-border pt-3">
        <Button
          onClick={runVerify}
          disabled={verifying}
          variant="outline"
          size="sm"
          className="gap-2 font-mono text-xs"
          data-testid="button-verify-reward"
        >
          {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          {verifying ? "Re-running decisions…" : `Pin & verify ${fmtPmpm(reward)}`}
        </Button>

        {verifying && verifyProgress && (
          <span className="flex items-center gap-2 font-mono text-[0.68rem] text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" /> {verifyProgress.done}/{verifyProgress.total} agents
            decided at {fmtPmpm(reward)}
          </span>
        )}

        {!verifying && !verified && (
          <span className="font-mono text-[0.68rem] text-muted-foreground">
            The readout above is interpolated from the simulated surface. Pin to re-run the live agents at this reward.
          </span>
        )}

        {verified && (
          <VerifyReadout verified={verified} interpolated={interpolateRewardPoint(curve, verified.reward)} />
        )}
      </div>
    </div>
  );
}

function VerifyReadout({ verified, interpolated }: { verified: VerifyResult; interpolated: RewardRoiPoint }) {
  const dNet = verified.netValue - interpolated.netValue;
  const dEng = verified.engagement - interpolated.engagement;
  const close = Math.abs(dEng) <= 0.04;
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-[hsl(150_60%_55%)]/30 bg-[hsl(150_60%_55%)]/5 px-3 py-1.5 font-mono text-[0.68rem]"
      data-testid="readout-verified"
    >
      <span className="flex items-center gap-1.5 text-[hsl(150_70%_60%)]">
        {close ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        Verified at {fmtPmpm(verified.reward)}
      </span>
      <span className="text-muted-foreground">
        engagement <span className="text-foreground">{fmtPct(verified.engagement)}</span>
        <span className="text-muted-foreground/60"> (interp {fmtPct(interpolated.engagement)})</span>
      </span>
      <span className="text-muted-foreground">
        net value <span className="text-foreground">{fmtUsd(verified.netValue)}</span>
        <span className={dNet >= 0 ? "text-[hsl(150_70%_60%)]" : "text-chart-4"}>
          {" "}
          {dNet >= 0 ? "+" : ""}
          {fmtUsd(dNet)} vs interp
        </span>
      </span>
    </div>
  );
}
