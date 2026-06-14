import { useReducer, useCallback, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { StreamEvent, IncentiveDesign, LifeAssumptionOverrides, ResolvedPlan, RewardRoiPoint, RewardStrategyConfig } from "@shared/schema";
import { streamSimulation, initialSimState, type SimState } from "@sim/lib/sim";
import CommandBar from "@sim/components/CommandBar";
import AgentConsole from "@sim/components/AgentConsole";
import PopulationGrid from "@sim/components/PopulationGrid";
import DistributionChart from "@sim/components/DistributionChart";
import DecisionCard from "@sim/components/DecisionCard";
import FunnelDetail from "@sim/components/FunnelDetail";
import ValueBridge from "@sim/components/ValueBridge";
import BootSequence from "@sim/components/BootSequence";
import ResultNarrative from "@sim/components/ResultNarrative";
import RewardExplorer from "@sim/components/RewardExplorer";
import RewardDriver from "@sim/components/RewardDriver";
import RewardStrategyPanel from "@sim/components/RewardStrategyPanel";
import PersonaExplorer from "@sim/components/PersonaExplorer";
import MethodologyWalkthrough from "@sim/components/MethodologyWalkthrough";
import EvidenceReport from "@sim/components/EvidenceReport";
import MonteCarloBadge from "@sim/components/MonteCarloBadge";
import CopilotPanel from "@sim/components/CopilotPanel";
import Tornado from "@sim/components/Tornado";
import { Guardrails, MethodologyDrawer, BacktestDrawer, SegmentUploadDrawer, ScenarioLibraryDrawer, AuditDrawer } from "@sim/components/SidePanels";
import { fmtUsd, fmtPct } from "@sim/lib/format";
import { interpolateRewardPoint } from "@sim/lib/rewards";
import { buildDisplayResult } from "@sim/lib/displayResult";
import { Activity, Banknote, BookOpenCheck, ChevronDown, FileText, HelpCircle, Lock, UsersRound } from "lucide-react";

type Action = { type: "reset" } | { type: "event"; e: StreamEvent };
type SimTab = "command" | "simulation" | "personas" | "methodology" | "evidence";

function reducer(state: SimState, action: Action): SimState {
  if (action.type === "reset") return { ...initialSimState, status: "running" };
  const e = action.e;
  switch (e.type) {
    case "thought":
      return { ...state, thoughts: [...state.thoughts, { text: e.text, kind: "thought" }] };
    case "plan":
      return {
        ...state,
        plan: e.plan,
        total: e.plan.sampleSize,
        thoughts: [...state.thoughts, { text: e.thought, kind: "thought" }],
      };
    case "mode":
      return { ...state, mode: e.mode, modeMessage: e.message };
    case "population_init":
      return { ...state, populationTotal: e.total, total: e.sampleSize, wearablePct: e.wearablePct };
    case "agent_spawned":
      return state.agents.find((a) => a.id === e.agent.id)
        ? state
        : { ...state, agents: [...state.agents, e.agent] };
    case "agent_decision":
      return {
        ...state,
        decisions: { ...state.decisions, [e.decision.agentId]: e.decision },
        completed: e.completed,
        total: e.total,
      };
    case "behavior":
      return { ...state, behavior: e.rates };
    case "calibration":
      return { ...state, calibration: e.report, calibratedBehavior: e.rates };
    case "critique":
      return { ...state, thoughts: [...state.thoughts, { text: e.text, kind: "critique" }] };
    case "reward_optimization":
      return { ...state, optimization: e.optimization };
    case "montecarlo":
      return { ...state, finance: e.result };
    case "methodology":
      return { ...state, methodology: e.report };
    case "narrative":
      return { ...state, narrative: e.report };
    case "done":
      return { ...state, status: "done" };
    case "error":
      return { ...state, status: "error", error: e.message };
    default:
      return state;
  }
}

export interface VerifyResult {
  reward: number;
  engagement: number; // engaged / behaviour-change fraction the agents actually produced
  valueCreated: number; // total value created = claims + productivity + retention + mortality
  members: number;
  claimsSaved: number;
  retentionValue: number;
  rewardToSustain: number;
  netValue: number;
  totalCost: number;
}

export default function SimulatorPage() {
  const location = useLocation();
  const [state, dispatch] = useReducer(reducer, initialSimState);
  const [showExplainer, setShowExplainer] = useState(true);
  const [activeTab, setActiveTab] = useState<SimTab>("command");

  // Prefill insight from Actuary page navigation
  const prefillInsight = (location.state as { prefillInsight?: { campaignName: string; signal: string; cohortSize: number; outputs: { projectedSavingsUsd: number; budgetRoiMultiple: number; paybackMonths: number }; healthPointsPricing: { suggestedHpPerMember: number; maxBudgetUsd: number } } } | null)?.prefillInsight ?? null;
  const [selectedReward, setSelectedReward] = useState<number | null>(4);
  const stopRef = useRef<(() => void) | null>(null);
  const verifyStopRef = useRef<(() => void) | null>(null);
  const lastGoalRef = useRef<string>("");
  const lastSampleRef = useRef<number>(12);
  const lastIncentiveRef = useRef<IncentiveDesign | undefined>(undefined);
  const lastRewardStrategyRef = useRef<RewardStrategyConfig | undefined>(undefined);
  const lastLifeAssumptionsRef = useRef<LifeAssumptionOverrides | undefined>(undefined);
  const lastSegmentSetVersionRef = useRef<string | undefined>(undefined);
  const lastLifeAssumptionVersionRef = useRef<string | undefined>(undefined);

  const run = useCallback((
    goal: string,
    sample: number,
    incentiveDesign?: IncentiveDesign,
    rewardStrategy?: RewardStrategyConfig,
    lifeAssumptions?: LifeAssumptionOverrides,
    segmentSetVersionId?: string,
    lifeAssumptionVersionId?: string
  ) => {
    stopRef.current?.();
    verifyStopRef.current?.();
    lastGoalRef.current = goal;
    lastSampleRef.current = sample;
    lastIncentiveRef.current = incentiveDesign;
    lastRewardStrategyRef.current = rewardStrategy;
    lastLifeAssumptionsRef.current = lifeAssumptions;
    lastSegmentSetVersionRef.current = segmentSetVersionId;
    lastLifeAssumptionVersionRef.current = lifeAssumptionVersionId;
    setActiveTab("simulation");
    dispatch({ type: "reset" });
    stopRef.current = streamSimulation(goal, sample, (e) => dispatch({ type: "event", e }), incentiveDesign, rewardStrategy, lifeAssumptions, segmentSetVersionId, lifeAssumptionVersionId);
  }, []);

  // Pin & verify: re-run the live agents at a chosen reward, returning the
  // genuinely re-simulated point so the UI can show verified vs interpolated.
  const verifyReward = useCallback(
    (reward: number, onDone: (r: VerifyResult | null) => void, onProgress?: (completed: number, total: number) => void) => {
      verifyStopRef.current?.();
      const goal = lastGoalRef.current;
      if (!goal) {
        onDone(null);
        return () => {};
      }
      let opt: import("@shared/schema").RewardOptimization | null = null;
      let beh: import("@shared/schema").BehaviorRates | null = null;
      const stop = streamSimulation(
        goal,
        lastSampleRef.current,
        (e) => {
          if (e.type === "agent_decision" && onProgress) onProgress(e.completed, e.total);
          if (e.type === "calibration") beh = e.rates;
          if (e.type === "behavior" && !beh) beh = e.rates;
          if (e.type === "reward_optimization") opt = e.optimization;
          if (e.type === "done") {
            if (opt) {
              // the verified point is the curve point nearest the selected reward.
              const target = reward;
              const pt = opt.roiCurve.reduce((best, p) =>
                Math.abs(p.reward - target) < Math.abs(best.reward - target) ? p : best
              );
              onDone({
                reward: target,
                engagement: beh ? beh.behaviorChangeRate : pt.engagement,
                valueCreated: pt.valueCreated,
                members: pt.members,
                claimsSaved: pt.claimsSaved,
                retentionValue: pt.retentionValue,
                rewardToSustain: pt.rewardToSustain,
                netValue: pt.netValue,
                totalCost: pt.totalCost,
              });
            } else {
              onDone(null);
            }
          }
          if (e.type === "error") onDone(null);
        },
        lastIncentiveRef.current
          ? { ...lastIncentiveRef.current, rewardPmpm: reward }
          : { configured: true, rewardPmpm: reward, adminCostPmpm: 0, platformCostPmpm: 0 },
        lastRewardStrategyRef.current,
        lastLifeAssumptionsRef.current,
        lastSegmentSetVersionRef.current,
        lastLifeAssumptionVersionRef.current
      );
      verifyStopRef.current = stop;
      return stop;
    },
    []
  );

  const showCanvas = state.status !== "idle";
  const hero = state.calibratedBehavior ?? state.behavior;
  const selectedPoint: RewardRoiPoint | null = useMemo(() => {
    if (selectedReward === null || !state.optimization?.roiCurve?.length) return null;
    return interpolateRewardPoint(state.optimization.roiCurve, selectedReward);
  }, [selectedReward, state.optimization]);
  const resultsReady = !!state.finance;

  return (
    <div className="mx-auto max-w-[1400px]">
      <SimTabNav active={activeTab} setActive={setActiveTab} resultsReady={resultsReady || state.agents.length > 0} />

      {/* Toolbar */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ScenarioLibraryDrawer state={state} />
        <AuditDrawer />
        <MethodologyDrawer report={state.methodology} />
        <SegmentUploadDrawer />
        <BacktestDrawer />
      </div>

        {state.status === "error" && (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" data-testid="text-error">
            {state.error}
          </div>
        )}
        {state.mode && state.mode !== "llm" && (
          <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-800" data-testid="banner-degraded-mode">
            <span className="font-semibold">Degraded mode:</span> {state.modeMessage}
          </div>
        )}

        {prefillInsight && state.status === "idle" && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Activity className="h-3.5 w-3.5" />
              Quick estimate from AI Actuary — {prefillInsight.campaignName}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Est. book value</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">${(prefillInsight.outputs.projectedSavingsUsd / 1000).toFixed(0)}K</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Modelled ROI</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{prefillInsight.outputs.budgetRoiMultiple.toFixed(1)}x</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Cohort</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{prefillInsight.cohortSize.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Payback</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{prefillInsight.outputs.paybackMonths} mo</div>
              </div>
            </div>
            <p className="mt-2 text-2xs text-muted-foreground">
              Static engine projection. Run the simulation below to stress-test with live agent behaviour and Monte Carlo uncertainty.
            </p>
          </div>
        )}

        <HowItWorksPanel visible={showExplainer} onDismiss={() => setShowExplainer(false)} compact={showCanvas} />

        {activeTab === "command" && (
          <div className="mt-4 space-y-4">
            <CommandBar onRun={run} running={state.status === "running"} rewardPmpm={selectedReward} />
            <RewardDriver
              reward={selectedReward}
              onRewardChange={setSelectedReward}
              optimization={state.optimization}
              selectedPoint={selectedPoint}
              disabled={state.status === "running"}
            />
            {!showCanvas && <IntroPanel />}
          </div>
        )}

        {activeTab === "simulation" && state.plan && (
          <PlanBanner plan={state.plan} running={state.status === "running"} />
        )}

        {activeTab === "simulation" && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="lg:h-[calc(100vh-220px)] lg:min-h-[560px]">
              <AgentConsole state={state} />
            </div>
            <div className="space-y-4 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
              {state.status === "idle" ? (
                <IntroPanel />
              ) : state.status === "error" && !state.finance ? (
                <RunErrorPanel message={state.error} />
              ) : !state.finance ? (
                <BootSequence state={state} />
              ) : (
                <SimulationResults
                  state={state}
                  hero={hero}
                  selectedReward={selectedReward}
                  onRewardChange={setSelectedReward}
                  verifyReward={verifyReward}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "personas" && (
          <div className="mt-4">
            <PersonaExplorer state={state} />
          </div>
        )}

        {activeTab === "methodology" && (
          <div className="mt-4">
            <MethodologyWalkthrough state={state} />
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="mt-4">
            <EvidenceReport />
          </div>
        )}

        <CopilotPanel state={state} selectedReward={selectedReward} />

        <footer className="mt-6 border-t border-border pt-4 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
          Illustrative scenario model. Member decisions are generated by live AI agents.
        </footer>
    </div>
  );
}

// Pinned plan summary: stays visible at the top of the simulation page while
// agent decisions stream in, so the locked signal set is never out of sight.
function PlanBanner({ plan, running }: { plan: ResolvedPlan; running: boolean }) {
  const signals = plan.signalDefinitions ?? [];
  return (
    <div
      className="sticky top-2 z-30 mt-4 rounded-xl border border-primary/30 bg-card/90 px-4 py-2.5 shadow-lg shadow-background/40 backdrop-blur"
      data-testid="banner-plan-locked"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-foreground">
          {running ? <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden /> : <Lock className="h-3 w-3" aria-hidden />}
          Plan locked
        </span>
        <span className="flex flex-wrap items-center gap-1">
          {signals.map((s) => (
            <span
              key={s.signalId}
              className={`rounded-full border px-2 py-0.5 font-mono text-[0.62rem] ${
                s.signalId === plan.primarySignal
                  ? "border-primary/50 bg-primary/15 font-semibold text-primary"
                  : "border-card-border bg-background/50 text-foreground/80"
              }`}
              data-testid={`plan-signal-${s.signalId}`}
            >
              {s.displayName}
              {s.signalId === plan.primarySignal && signals.length > 1 ? " · primary" : ""}
            </span>
          ))}
        </span>
        <span className="font-mono text-[0.68rem] text-muted-foreground">
          {plan.marketLabel} · {plan.bookSize.toLocaleString()} members · {plan.horizonMonths} mo · {plan.sampleSize} agents
          {plan.targetHighRisk ? " · high-risk targeting" : ""}
          {plan.fusionDefinition ? ` · ${plan.fusionDefinition.displayName}` : ""}
          {plan.incentiveDesign?.configured ? ` · $${plan.incentiveDesign.rewardPmpm} PMPM reward` : ""}
        </span>
      </div>
    </div>
  );
}


function SimulationResults({
  state,
  hero,
  selectedReward,
  onRewardChange,
  verifyReward,
}: {
  state: SimState;
  hero: SimState["behavior"];
  selectedReward: number | null;
  onRewardChange: (reward: number) => void;
  verifyReward: (
    reward: number,
    onDone: (r: VerifyResult | null) => void,
    onProgress?: (completed: number, total: number) => void
  ) => () => void;
}) {
  const display = useMemo(
    () => (state.finance ? buildDisplayResult(state.finance, state.plan, selectedReward) : null),
    [state.finance, state.plan, selectedReward]
  );
  if (!state.finance || !display) return null;
  return (
    <>
      {/* TIER 1 — the decision. Reward, behaviour %, net value and ROI appear
          exactly once, here. Everything below explains these numbers. */}
      <WorkflowStep
        n="01"
        title="Decision"
        detail="The one readout that matters: at the selected reward, what changes, what it is worth, and what to do."
        icon={<FileText className="h-4 w-4 text-primary" />}
      >
        <DecisionCard display={display} plan={state.plan} narrative={state.narrative} rewardSet={selectedReward !== null || !!state.plan?.incentiveDesign?.configured} />
      </WorkflowStep>

      {/* TIER 2 — the lever. Drives Tier 1 live; repeats no headline metrics. */}
      <WorkflowStep
        n="02"
        title="Reward lever"
        detail="Drag the reward — the decision readout above updates live. Pin to re-run the agents at that reward."
        icon={<Banknote className="h-4 w-4 text-primary" />}
      >
        {state.optimization ? (
          <RewardExplorer
            opt={state.optimization}
            plan={state.plan}
            reward={display.rewardPmpm}
            onRewardChange={onRewardChange}
            onVerify={verifyReward}
            arms={state.behavior?.doseResponseArms}
          />
        ) : (
          <div className="rounded-xl border border-card-border bg-card/40 p-4 text-sm text-muted-foreground">
            Reward response will appear after the behaviour model and Monte Carlo run finish.
          </div>
        )}
      </WorkflowStep>

      {/* TIER 3 — how we got here: collapsible drill-downs, no headline repeats. */}
      <WorkflowStep
        n="03"
        title="How we got here"
        detail="Open the funnel, the value bridge, the cohort allocation and the analyst's note to trace every headline number."
        icon={<FileText className="h-4 w-4 text-primary" />}
      >
        <DrillDown title="Behaviour funnel" sub="enrol → persist → meaningfully improve, with signal provenance" testId="drilldown-funnel" defaultOpen>
          <FunnelDetail behavior={hero} plan={state.plan} display={display} />
        </DrillDown>
        {state.plan && (
          <DrillDown title="Value bridge" sub="behaviour change → claims, productivity, retention → costs → net value" testId="drilldown-value-bridge">
            <ValueBridge finance={state.finance} plan={state.plan} display={display} />
          </DrillDown>
        )}
        <DrillDown title="Cohort reward allocation" sub="life-insurance value path and per-cohort reward packages" testId="drilldown-cohorts">
          <RewardStrategyPanel
            allocation={state.methodology?.rewardAllocation}
            lifeValue={state.methodology?.lifeInsuranceValue}
            strategy={state.methodology?.rewardStrategy}
            explanation={state.methodology?.rewardStrategyExplanation}
          />
        </DrillDown>
        {state.narrative && (
          <DrillDown title="Analyst's note" sub="written walk-through, drivers and confidence" testId="drilldown-narrative">
            <ResultNarrative report={state.narrative} configured={!!state.finance.incentiveDesign} />
          </DrillDown>
        )}
      </WorkflowStep>

      {/* TIER 4 — evidence. Same sources as Tier 1; nothing re-derived. */}
      <WorkflowStep
        n="04"
        title="Evidence and model detail"
        detail="Live agent population, simulation run, distributions, sensitivity and guardrails."
        icon={<FileText className="h-4 w-4 text-primary" />}
      >
        <PopulationGrid state={state} />
        <MonteCarloBadge finance={state.finance} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DistributionChart
            title={state.finance.roiAvailable ? "NET VALUE DISTRIBUTION (USD)" : "GROSS VALUE DISTRIBUTION (USD)"}
            dist={state.finance.roiAvailable ? state.finance.netValue : state.finance.grossValue}
            format={(n) => fmtUsd(n)}
            accent="hsl(var(--chart-3))"
          />
          <DistributionChart
            title="BEHAVIOUR-CHANGE DISTRIBUTION"
            dist={state.finance.behaviorChange}
            format={(n) => fmtPct(n)}
            accent="hsl(var(--primary))"
          />
        </div>
        <Tornado bars={state.finance.tornado} />
        <Guardrails flags={state.finance.guardrails} />
      </WorkflowStep>
    </>
  );
}

// Collapsible Tier-3 drill-down shell.
function DrillDown({
  title,
  sub,
  children,
  defaultOpen = false,
  testId,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-card-border bg-card/30" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground/90">{title}</span>
          <span className="ml-2 hidden font-mono text-[0.68rem] text-muted-foreground sm:inline">{sub}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function HowItWorksPanel({
  visible,
  onDismiss,
  compact,
}: {
  visible: boolean;
  onDismiss: () => void;
  compact: boolean;
}) {
  if (!visible) return null;
  return (
    <section className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4" data-testid="panel-how-it-works">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-4xl gap-3">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <h2 className="font-mono text-sm font-semibold tracking-tight">How to read this simulation</h2>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              Start with the reward lever, then watch live member-agent decisions, browse the synthetic personas, and click through the methodology that turns behaviour into value.
            </p>
            {!compact && (
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                <ExplainerStep n="1" text="Set the reward strategy before any outcome is shown." />
                <ExplainerStep n="2" text="Run live AI member-agents and watch the response stream." />
                <ExplainerStep n="3" text="Open personas to see the synthetic cohort behind the result." />
                <ExplainerStep n="4" text="Use methodology to inspect formulas, assumptions and evidence gates." />
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border border-card-border bg-background/60 px-2.5 py-1 font-mono text-[0.68rem] text-muted-foreground hover:text-foreground"
        >
          Hide
        </button>
      </div>
    </section>
  );
}

function ExplainerStep({ n, text }: { n: string; text: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-background/40 p-2.5">
      <span className="font-mono text-foreground">{n}</span>
      <p className="mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function WorkflowStep({
  n,
  title,
  detail,
  icon,
  children,
}: {
  n: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3" data-testid={`workflow-step-${n}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-card-border pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 font-mono text-xs font-semibold text-primary">
            {n}
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
              {icon}
              {title}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function SimTabNav({
  active,
  setActive,
  resultsReady,
}: {
  active: SimTab;
  setActive: (tab: SimTab) => void;
  resultsReady: boolean;
}) {
  const tabs: { id: SimTab; label: string; icon: React.ReactNode; enabled: boolean }[] = [
    { id: "command", label: "Command & Reward", icon: <Banknote className="h-4 w-4" />, enabled: true },
    { id: "simulation", label: "Simulation", icon: <Activity className="h-4 w-4" />, enabled: true },
    { id: "personas", label: "Personas", icon: <UsersRound className="h-4 w-4" />, enabled: resultsReady },
    { id: "methodology", label: "Methodology", icon: <FileText className="h-4 w-4" />, enabled: resultsReady },
    { id: "evidence", label: "Evidence", icon: <BookOpenCheck className="h-4 w-4" />, enabled: true },
  ];
  return (
    <nav className="rounded-xl border border-border bg-surface p-1.5" data-testid="tab-shell">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            onClick={() => tab.enabled && setActive(tab.id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs transition-colors ${
              active === tab.id
                ? "bg-accent-muted text-accent font-medium"
                : tab.enabled
                  ? "text-tertiary hover:bg-hover hover:text-secondary"
                  : "text-tertiary/35"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {!tab.enabled && <span className="text-[0.58rem]">(after run)</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}

function RunErrorPanel({ message }: { message: string | null }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5" data-testid="panel-run-error">
      <div className="font-mono text-sm font-semibold text-destructive">Simulation interrupted</div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
        {message || "The live stream stopped before the run completed."}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        The live model is busy — retry, or use a smaller member-agent sample.
      </p>
    </div>
  );
}

function IntroPanel() {
  const steps = [
    { n: "01", t: "Set reward", d: "Choose the USD PMPM reward and see the Health Points equivalent before outcomes render." },
    { n: "02", t: "Run simulation", d: "Generate member records and wait for strict live AI decisions." },
    { n: "03", t: "Make it real", d: "Browse synthetic personas representing anonymous real-world cohorts." },
    { n: "04", t: "Show the working", d: "Click through reward response, calibration, claims bridge, value and evidence tiers." },
  ];
  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-6">
      <h2 className="mb-1 text-lg font-semibold">Wellness incentive scenario analysis</h2>
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Set a reward strategy; the simulator shows the behaviour change and ROI it drives, or suggests the optimal
        reward for you once the response curve is available.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <div key={s.n} className="rounded-lg border border-card-border bg-background/40 p-4">
            <div className="mb-1 font-mono text-xs text-foreground">{s.n}</div>
            <div className="mb-1 text-sm font-semibold">{s.t}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
