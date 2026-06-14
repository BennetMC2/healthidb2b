import type { RewardOptimization, RewardRoiPoint } from "@shared/schema";
import { HP_PER_USD } from "@shared/schema";
import { fmtPct, fmtReward, fmtUSD } from "@sim/lib/sim";
import { interpolateRewardPoint, suggestedReward } from "@sim/lib/rewards";
import { Slider } from "@sim/ui/slider";
import { Button } from "@sim/ui/button";
import { Banknote, Sparkles, TrendingUp, Users } from "lucide-react";

export default function RewardDriver({
  reward,
  onRewardChange,
  optimization,
  selectedPoint,
  disabled,
}: {
  reward: number | null;
  onRewardChange: (reward: number) => void;
  optimization: RewardOptimization | null;
  selectedPoint: RewardRoiPoint | null;
  disabled?: boolean;
}) {
  const min = optimization?.roiCurve[0]?.reward ?? 0;
  const max = optimization?.roiCurve[optimization.roiCurve.length - 1]?.reward ?? 25;
  const displayReward = reward ?? 12;
  const preview = selectedPoint ?? (optimization ? interpolateRewardPoint(optimization.roiCurve, displayReward) : null);
  const hpPerMonth = Math.round(displayReward * HP_PER_USD);

  return (
    <section className="rounded-xl border border-primary/30 bg-gradient-to-br from-card/75 to-background/50 p-4 glow-accent" data-testid="panel-reward-driver">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-foreground">
            <Banknote className="h-4 w-4" /> Reward strategy
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Set the lever before showing the outcome</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Set a reward strategy; the simulator shows the enrolment, engagement, persistence and ROI it drives.
            Or ask the model to suggest the optimal reward and explore around it.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!optimization || disabled}
          onClick={() => optimization && onRewardChange(suggestedReward(optimization))}
          className="gap-2 font-mono text-xs"
          data-testid="button-suggest-optimal-reward"
        >
          <Sparkles className="h-3.5 w-3.5" /> Suggest optimal reward
        </Button>
      </div>

      <div className="rounded-lg border border-card-border bg-background/45 p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">Reward input</div>
            <div className="flex flex-wrap items-baseline gap-2 font-mono">
              <span className="text-4xl font-bold text-foreground tabular" data-testid="text-upstream-reward">
                {fmtReward(displayReward)}
              </span>
              <span className="text-sm text-muted-foreground">PMPM</span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {hpPerMonth.toLocaleString()} HP/member/month
              </span>
            </div>
          </div>
          {reward === null ? (
            <div className="rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 font-mono text-xs text-amber-800">
              Choose a reward before the behaviour headline appears.
            </div>
          ) : preview ? (
            <div className="grid grid-cols-3 gap-2 text-right">
              <Mini label="Engaged" value={fmtPct(preview.engagement)} />
              <Mini label="Changed" value={fmtPct(preview.behaviorChange)} />
              <Mini label="Net" value={fmtUSD(preview.netValue)} />
            </div>
          ) : null}
        </div>
        <Slider
          value={[displayReward]}
          min={min}
          max={max}
          step={0.25}
          disabled={disabled}
          onValueChange={(v) => onRewardChange(v[0])}
          data-testid="slider-upstream-reward"
          aria-label="Reward PMPM"
        />
        <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-muted-foreground">
          <span>{fmtReward(min)} PMPM</span>
          <span>{fmtReward(max)} PMPM</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <Step n="01" icon={<Banknote className="h-3.5 w-3.5" />} title="Reward" active={reward !== null} />
        <Step n="02" icon={<Users className="h-3.5 w-3.5" />} title="Funnel" active={!!preview} />
        <Step n="03" icon={<TrendingUp className="h-3.5 w-3.5" />} title="Behaviour %" active={!!preview} />
        <Step n="04" icon={<Sparkles className="h-3.5 w-3.5" />} title="ROI band" active={!!preview && preview.totalCost > 0} />
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.6rem] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold tabular text-foreground">{value}</div>
    </div>
  );
}

function Step({ n, icon, title, active }: { n: string; icon: React.ReactNode; title: string; active: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 ${active ? "border-primary/35 bg-primary/10 text-primary" : "border-card-border bg-background/35 text-muted-foreground"}`}>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span>{n}</span>
        {icon}
        <span>{title}</span>
      </div>
    </div>
  );
}

