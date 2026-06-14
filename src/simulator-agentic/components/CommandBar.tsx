import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { IncentiveDesign, LifeAssumptionOverrides, ModelInputVersion, RewardStrategyConfig } from "@shared/schema";
import { Sparkles, ArrowRight, Loader2, Users, Banknote, Target, SlidersHorizontal, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@sim/lib/queryClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@sim/ui/collapsible";
import SignalLibrary from "@sim/components/SignalLibrary";

const EXAMPLES = [
  "Cut cardiovascular claims in our 250K Singapore book over 18 months using the best combination of signals we can verify.",
  "Reduce diabetes and pre-diabetes risk across a 180K HK book, blending verified HbA1c with continuous-glucose behaviour.",
  "Improve recovery and resilience for a 40K employer group, rewarding sleep regularity, HRV and resting-heart-rate trends together.",
  "Pilot a passive frailty and fall-risk early-warning program for our senior segment using walking-speed and gait signals — engagement first, prove the claims impact on our own data.",
  "Acquire pre-verified high-trust members from the open pool to lower our 120K SG book's average risk, prioritising clinically-anchored proofs.",
  "Design a continuous-verification stream that lets us re-price premiums on a mixed individual and group book as members improve VO2 max and resting heart rate.",
];

const MIN_AGENTS = 12;
const MAX_AGENTS = 600;
// At or above this sample size the server splits agents into randomized
// reward arms (a synthetic RCT) and fits the dose-response through
// observed points instead of stated sensitivities.
export const DOSE_ARM_MIN_SAMPLE = 200;

export default function CommandBar({
  onRun,
  running,
  rewardPmpm,
}: {
  onRun: (
    goal: string,
    sample: number,
    incentiveDesign?: IncentiveDesign,
    rewardStrategy?: RewardStrategyConfig,
    lifeAssumptions?: LifeAssumptionOverrides,
    segmentSetVersionId?: string,
    lifeAssumptionVersionId?: string
  ) => void;
  running: boolean;
  rewardPmpm: number | null;
}) {
  const [goal, setGoal] = useState("");
  const [sample, setSample] = useState(100);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [configureIncentive, setConfigureIncentive] = useState(true);
  const [adminCostPmpm, setAdminCostPmpm] = useState(0);
  const [platformCostPmpm, setPlatformCostPmpm] = useState(0);
  const [strategyObjective, setStrategyObjective] = useState<RewardStrategyConfig["objective"]>("balanced");
  const [strategyBudgetPmpm, setStrategyBudgetPmpm] = useState(8);
  const [useStrategyBudget, setUseStrategyBudget] = useState(false);
  const [configureLifeAssumptions, setConfigureLifeAssumptions] = useState(false);
  const [baselineAnnualMortalityRate, setBaselineAnnualMortalityRate] = useState(0.28);
  const [sumAssured, setSumAssured] = useState(150000);
  const [annualPremium, setAnnualPremium] = useState(1800);
  const [morbidityValuePctOfMortality, setMorbidityValuePctOfMortality] = useState(28);
  const [acquisitionValuePerNewVerifiedMember, setAcquisitionValuePerNewVerifiedMember] = useState(220);
  const [maxLapseImprovement, setMaxLapseImprovement] = useState(4);
  const [approvingAssumptions, setApprovingAssumptions] = useState(false);
  const [assumptionApprovalNote, setAssumptionApprovalNote] = useState<string | null>(null);
  const [assumptionApprovalError, setAssumptionApprovalError] = useState<string | null>(null);
  const [segmentSetVersionId, setSegmentSetVersionId] = useState("");
  const [lifeAssumptionVersionId, setLifeAssumptionVersionId] = useState("");

  const { data: governedInputs } = useQuery<ModelInputVersion[]>({
    queryKey: ["/api/governance/model-inputs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/governance/model-inputs");
      return res.json();
    },
  });
  const segmentSets = governedInputs?.filter((input) => input.kind === "segment_set") ?? [];
  const lifeAssumptionSets = governedInputs?.filter((input) => input.kind === "life_assumptions") ?? [];

  const lifePayload = (): LifeAssumptionOverrides => ({
    baselineAnnualMortalityRate: baselineAnnualMortalityRate / 100,
    sumAssured,
    annualPremium,
    morbidityValuePctOfMortality: morbidityValuePctOfMortality / 100,
    acquisitionValuePerNewVerifiedMember,
    maxLapseImprovement: maxLapseImprovement / 100,
  });

  const approveLifeAssumptions = async () => {
    setApprovingAssumptions(true);
    setAssumptionApprovalNote(null);
    setAssumptionApprovalError(null);
    try {
      const res = await apiRequest("POST", "/api/governance/model-inputs", {
        kind: "life_assumptions",
        name: `Life assumptions ${new Date().toISOString().slice(0, 10)}`,
        source: "User-approved life assumption overrides from scenario command bar",
        payload: lifePayload(),
      });
      const data = await res.json();
      setAssumptionApprovalNote(data?.note || "Approved life assumption version.");
      queryClient.invalidateQueries({ queryKey: ["/api/governance/model-inputs"] });
    } catch (e: any) {
      setAssumptionApprovalError(e?.message || "Failed to approve life assumptions.");
    } finally {
      setApprovingAssumptions(false);
    }
  };

  // Compose selected signals into the scenario goal in a form both the live
  // parser and the heuristic fallback reliably map back to signal IDs.
  const insertSignals = (names: string[]) => {
    if (!names.length) return;
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
    setGoal((g) => {
      const base = g.trim();
      const sentence = `Reward verified improvement in ${list}.`;
      if (!base) return `Design a wellness incentive campaign for our book. ${sentence}`;
      return `${base.replace(/\.?\s*$/, ".")} ${sentence}`;
    });
  };

  const submit = () => {
    const g = goal.trim();
    if (g && !running) {
      onRun(
        g,
        sample,
        rewardPmpm !== null
          ? {
              configured: true,
              rewardPmpm,
              adminCostPmpm: configureIncentive ? adminCostPmpm : 0,
              platformCostPmpm: configureIncentive ? platformCostPmpm : 0,
            }
          : undefined,
        {
          objective: strategyObjective,
          budgetPmpm: useStrategyBudget ? strategyBudgetPmpm : undefined,
        },
        configureLifeAssumptions
          ? lifePayload()
          : undefined,
        segmentSetVersionId || undefined,
        lifeAssumptionVersionId || undefined
      );
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card/50 p-4 glow-accent">
      <label className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Scenario goal
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={2}
            placeholder="e.g. Cut cardiovascular claims in our 250K Singapore book over 18 months using the best combination of signals we can verify."
            disabled={running}
            className="w-full resize-none rounded-lg border border-input bg-background/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2 disabled:opacity-60"
            data-testid="input-goal"
          />
        </div>
        <button
          onClick={submit}
          disabled={running || !goal.trim() || rewardPmpm === null}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-sm font-semibold text-primary-foreground transition-all hover-elevate active-elevate-2 disabled:opacity-50 sm:w-44"
          data-testid="button-run"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running…
            </>
          ) : (
            <>
              {rewardPmpm === null ? "Set reward first" : "Run simulation"} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => !running && setGoal(ex)}
            disabled={running}
            className="rounded-full border border-card-border bg-background/50 px-3 py-1 text-left font-mono text-[0.7rem] text-muted-foreground hover-elevate disabled:opacity-50"
            data-testid={`chip-example-${i}`}
          >
            {ex.length > 58 ? ex.slice(0, 56) + "…" : ex}
          </button>
        ))}
      </div>

      <SignalLibrary running={running} onInsert={insertSignals} />

      <div className="mt-3 flex items-center gap-3 border-t border-card-border pt-3">
        <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> member-agents
        </span>
        <input
          type="range"
          min={MIN_AGENTS}
          max={MAX_AGENTS}
          step={1}
          value={sample}
          onChange={(e) => setSample(Number(e.target.value))}
          disabled={running}
          className="h-1 flex-1 max-w-[220px] cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          data-testid="input-sample"
        />
        <span className="font-mono text-xs font-semibold text-foreground tabular" data-testid="text-sample-count">{sample}</span>
        <span className="hidden font-mono text-[0.7rem] text-muted-foreground sm:inline">
          {sample >= DOSE_ARM_MIN_SAMPLE
            ? "Synthetic RCT: agents split into reward arms ($0 / low / offer / high)"
            : "Groq batched live sample · higher is slower"}
        </span>
      </div>
      <div className="mt-1 flex max-w-[330px] justify-between pl-[7.7rem] font-mono text-[0.62rem] text-muted-foreground">
        <span>{MIN_AGENTS}</span>
        <span>{DOSE_ARM_MIN_SAMPLE}+ = RCT arms</span>
        <span>{MAX_AGENTS}</span>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-3 border-t border-card-border pt-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-card-border bg-background/35 px-3 py-2 text-left hover-elevate"
            data-testid="button-advanced-setup"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-xs font-semibold text-foreground/85">Advanced setup</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                cost assumptions, sources, segment set, ROI controls
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
        <div className="rounded-lg border border-card-border bg-background/30 p-3">
          <div className="mb-2 flex items-center gap-2 font-mono text-[0.75rem] text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            Reward strategy objective
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="rounded-lg border border-card-border bg-background/40 px-3 py-2">
              <span className="mb-1 block font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">Objective</span>
              <select
                value={strategyObjective}
                disabled={running}
                onChange={(e) => setStrategyObjective(e.target.value as RewardStrategyConfig["objective"])}
                className="w-full bg-transparent font-mono text-sm text-foreground outline-none"
                data-testid="select-strategy-objective"
              >
                <option value="balanced">Balanced</option>
                <option value="attract_users">Attract new users</option>
                <option value="reduce_morbidity">Reduce morbidity</option>
                <option value="reduce_mortality">Reduce mortality</option>
                <option value="max_net_value">Max net value</option>
                <option value="max_persistency">Max persistency</option>
              </select>
            </label>
            <label className="rounded-lg border border-card-border bg-background/40 px-3 py-2">
              <span className="mb-1 flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useStrategyBudget}
                  disabled={running}
                  onChange={(e) => setUseStrategyBudget(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                  data-testid="toggle-strategy-budget"
                />
                Budget cap
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={strategyBudgetPmpm}
                  disabled={running || !useStrategyBudget}
                  onChange={(e) => setStrategyBudgetPmpm(Math.max(0, Number(e.target.value) || 0))}
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none disabled:opacity-50"
                  data-testid="input-strategy-budget-pmpm"
                />
                <span className="font-mono text-[0.65rem] text-muted-foreground">PMPM</span>
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-card-border bg-background/30 p-3">
          <div className="mb-2 font-mono text-[0.75rem] text-muted-foreground">Approved life assumptions</div>
          <select
            value={lifeAssumptionVersionId}
            disabled={running}
            onChange={(e) => setLifeAssumptionVersionId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-sm text-foreground outline-none"
            data-testid="select-life-assumption-version"
          >
            <option value="">Default illustrative life assumptions</option>
            {lifeAssumptionSets.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name}
              </option>
            ))}
          </select>
          <p className="mt-1 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
            Approved assumption versions provide the base life economics for the run. Pending overrides below take precedence.
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-background/30 p-3">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[0.75rem] text-muted-foreground">
            <input
              type="checkbox"
              checked={configureLifeAssumptions}
              disabled={running}
              onChange={(e) => setConfigureLifeAssumptions(e.target.checked)}
              className="h-4 w-4 accent-primary"
              data-testid="toggle-life-assumptions"
            />
            Pending life assumption overrides
          </label>
          <p className="mt-1 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
            These values affect the life-insurance value path for this run only. They are not approved defaults.
          </p>
          {configureLifeAssumptions && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <MoneyField
                label="Mortality"
                value={baselineAnnualMortalityRate}
                onChange={setBaselineAnnualMortalityRate}
                disabled={running}
                suffix="%/yr"
                testId="input-life-mortality"
              />
              <MoneyField label="Sum assured" value={sumAssured} onChange={setSumAssured} disabled={running} suffix="USD" testId="input-life-sum-assured" />
              <MoneyField label="Premium" value={annualPremium} onChange={setAnnualPremium} disabled={running} suffix="$/yr" testId="input-life-premium" />
              <MoneyField
                label="Morbidity proxy"
                value={morbidityValuePctOfMortality}
                onChange={setMorbidityValuePctOfMortality}
                disabled={running}
                suffix="% mortality"
                testId="input-life-morbidity"
              />
              <MoneyField
                label="Acquisition"
                value={acquisitionValuePerNewVerifiedMember}
                onChange={setAcquisitionValuePerNewVerifiedMember}
                disabled={running}
                suffix="$/member"
                testId="input-life-acquisition"
              />
              <MoneyField
                label="Max lapse"
                value={maxLapseImprovement}
                onChange={setMaxLapseImprovement}
                disabled={running}
                suffix="%"
                testId="input-life-max-lapse"
              />
            </div>
          )}
          {configureLifeAssumptions && (
            <div className="mt-2">
              <button
                type="button"
                onClick={approveLifeAssumptions}
                disabled={running || approvingAssumptions}
                className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-primary hover-elevate disabled:opacity-50"
                data-testid="button-approve-life-assumptions"
              >
                {approvingAssumptions ? "Approving..." : "Approve as assumption version"}
              </button>
              {assumptionApprovalNote && (
                <p className="mt-1 font-mono text-[0.68rem] text-[hsl(150_60%_55%)]" data-testid="text-life-assumption-approved">
                  {assumptionApprovalNote}
                </p>
              )}
              {assumptionApprovalError && (
                <p className="mt-1 font-mono text-[0.68rem] text-destructive" data-testid="text-life-assumption-error">
                  {assumptionApprovalError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-card-border bg-background/30 p-3">
          <div className="mb-2 font-mono text-[0.75rem] text-muted-foreground">Population segment set</div>
          <select
            value={segmentSetVersionId}
            disabled={running}
            onChange={(e) => setSegmentSetVersionId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background/70 px-2.5 py-1.5 font-mono text-sm text-foreground outline-none"
            data-testid="select-segment-set-version"
          >
            <option value="">Default illustrative global segments</option>
            {segmentSets.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name}
              </option>
            ))}
          </select>
          <p className="mt-1 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
            Approved segment sets replace illustrative sampling for this run. If none is selected, the default global life segments are used.
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-background/30 p-3">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[0.75rem] text-muted-foreground">
            <input
              type="checkbox"
              checked={configureIncentive}
              disabled={running}
              onChange={(e) => setConfigureIncentive(e.target.checked)}
              className="h-4 w-4 accent-primary"
              data-testid="toggle-incentive-economics"
            />
            <Banknote className="h-3.5 w-3.5" />
            Include admin and platform costs in ROI
          </label>
          {configureIncentive ? (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <MoneyField label="Admin" value={adminCostPmpm} onChange={setAdminCostPmpm} disabled={running} suffix="PMPM" testId="input-admin-pmpm" />
              <MoneyField label="Platform" value={platformCostPmpm} onChange={setPlatformCostPmpm} disabled={running} suffix="PMPM" testId="input-platform-pmpm" />
            </div>
          ) : (
            <p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
              Reward cost is still included from the reward strategy above. Admin and platform fees are treated as zero unless enabled here.
            </p>
          )}
        </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
  suffix,
  testId,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  suffix: string;
  testId: string;
}) {
  return (
    <label className="rounded-lg border border-card-border bg-background/40 px-3 py-2">
      <span className="mb-1 block font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">$</span>
        <input
          type="number"
          min={0}
          step={0.25}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none"
          data-testid={testId}
        />
        <span className="font-mono text-[0.65rem] text-muted-foreground">{suffix}</span>
      </span>
    </label>
  );
}
