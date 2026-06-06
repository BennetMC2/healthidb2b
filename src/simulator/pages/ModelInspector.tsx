import { useState, useMemo } from 'react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { METRIC_ACTUARIAL_CONFIG } from '@/utils/actuarial';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import { CLINICAL_RULES, INTERVENTIONS } from '../data/interventions';
import { BEHAVIOUR_LEVERS } from '../data/behaviourLevers';
import { BEHAVIOURAL_ECON_MODIFIERS } from '../data/behaviouralEconomics';
import { EVIDENCE_LIBRARY } from '../data/evidence';
import { SIGNALS } from '../data/signals';
import { SOURCE_CONFIDENCE_BANDS, CONFIDENCE_MODULATING_FACTORS } from '../data/sourceConfidence';
import { COHORT_PRESETS } from '../data/cohortPresets';
import { REWARD_PRESETS } from '../data/rewards';
import { calculateRewards, scaleRewardCostForHorizon, deriveRewardBudget } from '../engine/rewardCalculator';
import { computeConfidence } from '../engine/confidenceModel';
import { filterCohort } from '../engine/cohortEngine';
import { TIME_HORIZON_MONTHS, INTERVENTION_LABELS, MODEL_VERSION, DEFAULT_ASSUMPTIONS } from '../constants';
import type { HealthMetric } from '@/types';

type Tab = 'trace' | 'signals' | 'evidence' | 'rules' | 'rewards' | 'assumptions' | 'confidence';

export default function ModelInspector() {
  const [activeTab, setActiveTab] = useState<Tab>('trace');
  const { scenarios, activeScenarioId } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'trace', label: 'ROI Trace' },
    { id: 'signals', label: 'Signals' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'rules', label: 'Clinical Rules' },
    { id: 'rewards', label: 'Reward Math' },
    { id: 'assumptions', label: 'Assumptions' },
    { id: 'confidence', label: 'Confidence' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary font-display">Model Inspector</h2>
            <p className="text-sm text-tertiary mt-1">
              Interrogate every calculation, data input, and formula in the simulation engine.
              {scenario ? ` Showing trace for: ${scenario.name}` : ' Select a scenario to see the full ROI trace.'}
            </p>
          </div>
          <span className="text-2xs font-mono text-accent/80 bg-accent/8 px-2 py-1 rounded-lg">{MODEL_VERSION}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-accent border-accent'
                : 'text-tertiary border-transparent hover:text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'trace' && <ROITrace scenario={scenario} />}
      {activeTab === 'signals' && <SignalTable />}
      {activeTab === 'evidence' && <EvidenceTable />}
      {activeTab === 'rules' && <ClinicalRulesTable />}
      {activeTab === 'rewards' && <RewardMath scenario={scenario} />}
      {activeTab === 'assumptions' && <AssumptionsView scenario={scenario} />}
      {activeTab === 'confidence' && <ConfidenceView scenario={scenario} />}
    </div>
  );
}

// ── ROI Trace (step-by-step calculation) ──────────────────────────────────

function ROITrace({ scenario }: { scenario: ReturnType<typeof useSimulatorStore.getState>['scenarios'][0] | undefined }) {
  const [horizon, setHorizon] = useState<'90d' | '1y' | '3y'>('1y');

  const trace = useMemo(() => {
    if (!scenario) return null;

    const horizonMonths = TIME_HORIZON_MONTHS[horizon];

    // Step 1: Cohort
    const cohortResult = filterCohort(scenario.cohortDefinition);
    const cohortSize = cohortResult.size > 0 ? cohortResult.size : 3000;

    // Step 2: Active interventions & signals
    const activeInterventions = INTERVENTIONS.filter((i) => scenario.interventions.includes(i.id));
    const allSignals: HealthMetric[] = [...new Set(activeInterventions.flatMap((i) => i.primarySignals))];
    const activeRules = CLINICAL_RULES.filter((r) => scenario.interventions.includes(r.interventionId));
    const affectedMetrics = [...new Set(activeRules.map((r) => r.signalId))];

    // Step 3: Reward calculation
    const rewardCalc = calculateRewards(scenario.rewardConfig, cohortSize);
    const scaledRewardCost = scaleRewardCostForHorizon(rewardCalc.totalRewardCost, horizonMonths, scenario.assumptions.dropoutRate);

    // Step 4: Claims impact per rule
    const ruleTraces = activeRules.map((rule) => {
      const metricConfig = METRIC_ACTUARIAL_CONFIG[rule.signalId];
      if (!metricConfig) return null;

      const effectiveImprovement = rule.effectSize * scenario.assumptions.realizationFactor;
      const effectiveMonths = Math.max(0, horizonMonths - metricConfig.outcomeLatencyMonths);
      const timeAdjustedImpact = effectiveImprovement * (effectiveMonths / horizonMonths);
      const benefitingLives = Math.round(cohortSize * rewardCalc.adjustedParticipation * rewardCalc.adjustedCompletion);
      const claimsImpact = metricConfig.baselineClaimCostPerMember *
        timeAdjustedImpact *
        benefitingLives *
        (1 - scenario.assumptions.claimsInflation * horizonMonths / 12);

      return {
        signalId: rule.signalId,
        signalLabel: HEALTH_METRIC_LABELS[rule.signalId],
        interventionId: rule.interventionId,
        effectSize: rule.effectSize,
        realizationFactor: scenario.assumptions.realizationFactor,
        effectiveImprovement,
        outcomeLatencyMonths: metricConfig.outcomeLatencyMonths,
        effectiveMonths,
        timeAdjustedImpact,
        baselineClaimCost: metricConfig.baselineClaimCostPerMember,
        benefitingLives,
        claimsInflation: scenario.assumptions.claimsInflation,
        claimsImpact: Math.round(claimsImpact),
        evidenceLevel: metricConfig.evidenceLevel,
        evidenceId: rule.evidenceId,
        description: rule.description,
      };
    }).filter(Boolean);

    const totalClaimsRaw = ruleTraces.reduce((sum, r) => sum + (r?.claimsImpact ?? 0), 0);
    const overlapDiscount = affectedMetrics.length <= 1 ? 1 : Math.max(0.58, 1 - (affectedMetrics.length - 1) * 0.12);
    const totalClaimsImpact = Math.round(totalClaimsRaw * overlapDiscount);

    // Step 5: Cross-sell & lapse
    const crossSellUplift = Math.round(rewardCalc.adjustedParticipation * 0.015 * cohortSize * 180);
    const lapseRateImpact = Math.round(-rewardCalc.adjustedPersistence * 0.03 * cohortSize);

    // Phase 1 result: Gross Value
    const grossTotalValue = totalClaimsImpact + crossSellUplift;

    // Phase 2: Reward Ceiling → Net ROI
    const rewardCeilingPct = scenario.rewardCeilingPct ?? 0.70;
    const rewardBudget = deriveRewardBudget(
      grossTotalValue,
      rewardCeilingPct,
      cohortSize,
      rewardCalc.adjustedParticipation,
      horizonMonths,
    );
    const cappedRewardCost = Math.min(scaledRewardCost, rewardBudget.totalBudget);
    const netROI = grossTotalValue - cappedRewardCost;

    // Confidence
    const availableSources = Object.entries(cohortResult.signalAvailability)
      .filter(([, rate]) => rate > 0.1)
      .map(([source]) => source);
    const confidence = computeConfidence(allSignals, availableSources as never[], scenario.interventions, scenario.assumptions.realizationFactor);

    return {
      cohortSize,
      horizonMonths,
      activeInterventions,
      allSignals,
      rewardCalc,
      scaledRewardCost,
      ruleTraces,
      totalClaimsRaw,
      overlapDiscount,
      totalClaimsImpact,
      affectedMetrics: affectedMetrics.length,
      crossSellUplift,
      lapseRateImpact,
      grossTotalValue,
      rewardCeilingPct,
      rewardBudget,
      cappedRewardCost,
      netROI,
      confidence,
    };
  }, [scenario, horizon]);

  if (!scenario) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-tertiary">Select a scenario from the Overview or Scenario Builder to see the full ROI trace.</p>
      </div>
    );
  }

  if (!trace) return null;

  return (
    <div className="space-y-4">
      {/* Horizon selector */}
      <div className="flex gap-2">
        {(['90d', '1y', '3y'] as const).map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              horizon === h ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary hover:bg-hover'
            }`}
          >
            {h === '90d' ? '90 Days' : h === '1y' ? '1 Year' : '3 Years'}
          </button>
        ))}
      </div>

      {/* Step 1: Cohort */}
      <TraceStep number={1} title="Cohort Sizing" color="#8b5cf6">
        <KV label="Cohort definition" value={scenario.cohortPresetId || 'Custom'} />
        <KV label="Filtered cohort size" value={trace.cohortSize.toLocaleString()} highlight />
        <KV label="Active interventions" value={trace.activeInterventions.map(i => i.name).join(', ')} />
        <KV label="Active signals" value={trace.allSignals.map(s => HEALTH_METRIC_LABELS[s]).join(', ')} />
      </TraceStep>

      {/* Step 2: Reward Calculation */}
      <TraceStep number={2} title="Reward Cost Calculation" color="#ef4444">
        <KV label="Budget per member" value={`$${scenario.rewardConfig.budgetPerMember}`} />
        <KV label="Raw participation" value={`${(scenario.rewardConfig.expectedParticipation * 100).toFixed(0)}%`} />
        <KV label="Raw completion" value={`${(scenario.rewardConfig.expectedCompletion * 100).toFixed(0)}%`} />
        <KV label="Raw persistence" value={`${(scenario.rewardConfig.expectedPersistence * 100).toFixed(0)}%`} />
        <KV label="Behavioural lift" value={`${trace.rewardCalc.behaviouralLift}x`} />
        <KV label="Adjusted participation" value={`${(trace.rewardCalc.adjustedParticipation * 100).toFixed(0)}%`} />
        <KV label="Adjusted completion" value={`${(trace.rewardCalc.adjustedCompletion * 100).toFixed(0)}%`} />
        <KV label="Adjusted persistence" value={`${(trace.rewardCalc.adjustedPersistence * 100).toFixed(0)}%`} />
        <KV label="Base annual reward cost" value={`$${trace.rewardCalc.totalRewardCost.toLocaleString()}`} />
        <KV label={`Scaled reward cost (${trace.horizonMonths}mo, ${(scenario.assumptions.dropoutRate * 100).toFixed(0)}% dropout)`} value={`$${trace.scaledRewardCost.toLocaleString()}`} highlight />
        <div className="mt-2 text-2xs font-mono text-tertiary bg-black/5 dark:bg-white/5 rounded p-2">
          cost = budget × adjCompletion × adjParticipation × cohortSize<br />
          = ${scenario.rewardConfig.budgetPerMember} × {trace.rewardCalc.adjustedCompletion} × {trace.rewardCalc.adjustedParticipation} × {trace.cohortSize}<br />
          = ${trace.rewardCalc.totalRewardCost.toLocaleString()} / year
        </div>
      </TraceStep>

      {/* Step 3: Per-Rule Claims Impact */}
      <TraceStep number={3} title="Claims Impact (per clinical rule)" color="#f59e0b">
        <div className="space-y-3">
          {trace.ruleTraces.map((rule, i) => rule && (
            <div key={i} className="rounded-lg border border-border/40 bg-surface/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary">{rule.signalLabel} ({INTERVENTION_LABELS[rule.interventionId as keyof typeof INTERVENTION_LABELS]})</span>
                <span className={`text-2xs px-1.5 py-0.5 rounded ${
                  rule.evidenceLevel === 'high' ? 'bg-green-500/10 text-green-500' :
                  rule.evidenceLevel === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>{rule.evidenceLevel}</span>
              </div>
              <div className="text-2xs text-tertiary mb-2 italic">{rule.description}</div>
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-2xs">
                <KVSmall label="Effect size (from literature)" value={rule.effectSize.toFixed(2)} />
                <KVSmall label="Realization factor" value={rule.realizationFactor.toFixed(2)} />
                <KVSmall label="Effective improvement" value={rule.effectiveImprovement.toFixed(4)} />
                <KVSmall label="Outcome latency" value={`${rule.outcomeLatencyMonths} months`} />
                <KVSmall label="Effective months" value={`${rule.effectiveMonths} of ${trace.horizonMonths}`} />
                <KVSmall label="Time-adjusted impact" value={rule.timeAdjustedImpact.toFixed(4)} />
                <KVSmall label="Baseline claim cost/member" value={`$${rule.baselineClaimCost.toLocaleString()}`} />
                <KVSmall label="Benefiting lives" value={rule.benefitingLives.toLocaleString()} />
                <KVSmall label="Claims inflation adj" value={`${(1 - rule.claimsInflation * trace.horizonMonths / 12).toFixed(4)}`} />
                <KVSmall label="Claims impact" value={`$${rule.claimsImpact.toLocaleString()}`} highlight />
              </div>
              <div className="mt-2 text-2xs font-mono text-tertiary bg-black/5 dark:bg-white/5 rounded p-2">
                ${rule.baselineClaimCost} × {rule.timeAdjustedImpact.toFixed(4)} × {rule.benefitingLives} × {(1 - rule.claimsInflation * trace.horizonMonths / 12).toFixed(4)} = ${rule.claimsImpact.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </TraceStep>

      {/* Step 4: Aggregation */}
      <TraceStep number={4} title="Aggregate & Overlap Discount" color="#f59e0b">
        <KV label="Total claims (before overlap)" value={`$${trace.totalClaimsRaw.toLocaleString()}`} />
        <KV label="Affected metrics" value={trace.affectedMetrics.toString()} />
        <KV label="Overlap discount" value={`${(trace.overlapDiscount * 100).toFixed(0)}%`} />
        <KV label="Total claims (after overlap)" value={`$${trace.totalClaimsImpact.toLocaleString()}`} highlight />
        <div className="mt-2 text-2xs font-mono text-tertiary bg-black/5 dark:bg-white/5 rounded p-2">
          overlapDiscount = max(0.58, 1 − ({trace.affectedMetrics} − 1) × 0.12) = {trace.overlapDiscount.toFixed(2)}<br />
          adjustedClaims = ${trace.totalClaimsRaw.toLocaleString()} × {trace.overlapDiscount.toFixed(2)} = ${trace.totalClaimsImpact.toLocaleString()}
        </div>
      </TraceStep>

      {/* Step 5: Gross Value (Phase 1) */}
      <TraceStep number={5} title="Phase 1: Gross Value" color="#3b82f6">
        <KV label="Claims impact (overlap-adjusted)" value={`$${trace.totalClaimsImpact.toLocaleString()}`} />
        <KV label="Cross-sell uplift" value={`$${trace.crossSellUplift.toLocaleString()}`} />
        <KV label="Lapse rate impact" value={`$${trace.lapseRateImpact.toLocaleString()}`} />
        <KV label="Gross Total Value" value={`$${trace.grossTotalValue.toLocaleString()}`} highlight />
        <div className="mt-2 text-2xs font-mono text-tertiary bg-black/5 dark:bg-white/5 rounded p-2">
          grossTotalValue = claimsImpact + crossSellUplift<br />
          = ${trace.totalClaimsImpact.toLocaleString()} + ${trace.crossSellUplift.toLocaleString()} = ${trace.grossTotalValue.toLocaleString()}
        </div>
      </TraceStep>

      {/* Step 6: Reward Ceiling → Net ROI (Phase 2) */}
      <TraceStep number={6} title="Phase 2: Reward Ceiling → Net ROI" color="#1D7A5E">
        <KV label="Gross Total Value" value={`$${trace.grossTotalValue.toLocaleString()}`} />
        <KV label="Reward ceiling" value={`${Math.round(trace.rewardCeilingPct * 100)}%`} />
        <KV label="Recommended reward budget" value={`$${trace.rewardBudget.totalBudget.toLocaleString()}`} />
        <KV label="Derived per-member budget" value={`$${trace.rewardBudget.budgetPerMember}`} />
        <KV label="Scaled reward cost (uncapped)" value={`$${trace.scaledRewardCost.toLocaleString()}`} />
        <KV label="Capped reward cost" value={`$${trace.cappedRewardCost.toLocaleString()}`} highlight />
        <KV label="Net ROI" value={`$${trace.netROI.toLocaleString()}`} highlight />
        <KV label="Confidence label" value={trace.confidence.label} />
        <div className={`mt-3 p-3 rounded-lg border ${
          trace.netROI >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="text-sm font-mono font-bold text-center" style={{ color: trace.netROI >= 0 ? '#22c55e' : '#ef4444' }}>
            ${trace.grossTotalValue.toLocaleString()} − ${trace.cappedRewardCost.toLocaleString()} = ${trace.netROI.toLocaleString()}
          </div>
        </div>
        <div className="mt-2 text-2xs font-mono text-tertiary bg-black/5 dark:bg-white/5 rounded p-2">
          recommendedBudget = grossTotalValue × ceilingPct = ${trace.grossTotalValue.toLocaleString()} × {trace.rewardCeilingPct} = ${trace.rewardBudget.totalBudget.toLocaleString()}<br />
          cappedCost = min(scaledRewardCost, recommendedBudget) = min(${trace.scaledRewardCost.toLocaleString()}, ${trace.rewardBudget.totalBudget.toLocaleString()}) = ${trace.cappedRewardCost.toLocaleString()}<br />
          netROI = grossTotalValue − cappedCost = ${trace.grossTotalValue.toLocaleString()} − ${trace.cappedRewardCost.toLocaleString()} = ${trace.netROI.toLocaleString()}
        </div>
      </TraceStep>
    </div>
  );
}

// ── Signal Table ──────────────────────────────────────────────────────────

function SignalTable() {
  return (
    <div className="card overflow-x-auto">
      <h3 className="text-sm font-semibold text-primary font-display mb-3">All 18 Signal Definitions</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-tertiary">
            <th className="py-2 pr-3">Signal</th>
            <th className="py-2 pr-3">Type</th>
            <th className="py-2 pr-3">Lever</th>
            <th className="py-2 pr-3">Sources</th>
            <th className="py-2 pr-3 text-right">Baseline Cost</th>
            <th className="py-2 pr-3 text-right">Effect Rate</th>
            <th className="py-2 pr-3 text-right">Latency</th>
            <th className="py-2 text-right">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {SIGNALS.map((signal) => {
            const config = METRIC_ACTUARIAL_CONFIG[signal.id];
            return (
              <tr key={signal.id} className="border-b border-border/30 hover:bg-hover/30">
                <td className="py-1.5 pr-3 font-medium text-primary">{signal.label}</td>
                <td className="py-1.5 pr-3 text-secondary">{signal.sourceType}</td>
                <td className="py-1.5 pr-3 text-secondary">{signal.behaviourLever}</td>
                <td className="py-1.5 pr-3 text-tertiary font-mono">{signal.sources.length}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">${config.baselineClaimCostPerMember}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{(config.expectedImprovementRate * 100).toFixed(0)}%</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{config.outcomeLatencyMonths}mo</td>
                <td className="py-1.5 text-right">
                  <span className={`text-2xs px-1.5 py-0.5 rounded ${
                    config.evidenceLevel === 'high' ? 'bg-green-500/10 text-green-500' :
                    config.evidenceLevel === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>{config.evidenceLevel}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Evidence Table ────────────────────────────────────────────────────────

function EvidenceTable() {
  return (
    <div className="card overflow-x-auto">
      <h3 className="text-sm font-semibold text-primary font-display mb-3">Evidence Library ({EVIDENCE_LIBRARY.length} citations)</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-tertiary">
            <th className="py-2 pr-3">Citation</th>
            <th className="py-2 pr-3">Year</th>
            <th className="py-2 pr-3">Design</th>
            <th className="py-2 pr-3 text-right">Sample Size</th>
            <th className="py-2 pr-3">Effect Size</th>
            <th className="py-2 pr-3 text-right">Numeric</th>
            <th className="py-2">Level</th>
          </tr>
        </thead>
        <tbody>
          {EVIDENCE_LIBRARY.map((citation) => (
            <tr key={citation.id} className="border-b border-border/30 hover:bg-hover/30">
              <td className="py-1.5 pr-3">
                <div className="font-medium text-primary">{citation.authors}</div>
                <div className="text-2xs text-tertiary">{citation.journal}</div>
              </td>
              <td className="py-1.5 pr-3 font-mono text-secondary">{citation.year}</td>
              <td className="py-1.5 pr-3 text-secondary">{citation.studyDesign.replace('_', ' ')}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-secondary">{citation.sampleSize.toLocaleString()}</td>
              <td className="py-1.5 pr-3 text-secondary max-w-[200px] truncate">{citation.effectSize}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-accent">{citation.effectSizeNumeric.toFixed(2)}</td>
              <td className="py-1.5">
                <span className={`text-2xs px-1.5 py-0.5 rounded ${
                  citation.evidenceLevel === 'high' ? 'bg-green-500/10 text-green-500' :
                  citation.evidenceLevel === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>{citation.evidenceLevel}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Clinical Rules Table ──────────────────────────────────────────────────

function ClinicalRulesTable() {
  return (
    <div className="card overflow-x-auto">
      <h3 className="text-sm font-semibold text-primary font-display mb-3">All {CLINICAL_RULES.length} Clinical Rules</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-tertiary">
            <th className="py-2 pr-3">Signal</th>
            <th className="py-2 pr-3">Intervention</th>
            <th className="py-2 pr-3 text-right">Effect Size</th>
            <th className="py-2 pr-3 text-right">Range</th>
            <th className="py-2 pr-3">Evidence</th>
            <th className="py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {CLINICAL_RULES.map((rule, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-hover/30">
              <td className="py-1.5 pr-3 font-medium text-primary">{HEALTH_METRIC_LABELS[rule.signalId]}</td>
              <td className="py-1.5 pr-3 text-secondary">{INTERVENTION_LABELS[rule.interventionId]}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-accent font-bold">{rule.effectSize.toFixed(2)}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-tertiary">[{rule.effectSizeRange[0].toFixed(2)}, {rule.effectSizeRange[1].toFixed(2)}]</td>
              <td className="py-1.5 pr-3 font-mono text-secondary text-2xs">{rule.evidenceId}</td>
              <td className="py-1.5 text-tertiary max-w-[300px] truncate">{rule.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Reward Math ───────────────────────────────────────────────────────────

function RewardMath({ scenario }: { scenario: ReturnType<typeof useSimulatorStore.getState>['scenarios'][0] | undefined }) {
  if (!scenario) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-tertiary">Select a scenario to see reward calculations.</p>
      </div>
    );
  }

  const cohortResult = filterCohort(scenario.cohortDefinition);
  const cohortSize = cohortResult.size > 0 ? cohortResult.size : 3000;
  const rewardCalc = calculateRewards(scenario.rewardConfig, cohortSize);

  return (
    <div className="space-y-4">
      {/* Reward config */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Reward Configuration: {scenario.rewardConfig.name}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <KV label="Budget per member" value={`$${scenario.rewardConfig.budgetPerMember}`} />
          <KV label="Outcome target" value={scenario.rewardConfig.outcomeTarget} />
          <KV label="Expected participation" value={`${(scenario.rewardConfig.expectedParticipation * 100).toFixed(0)}%`} />
          <KV label="Expected completion" value={`${(scenario.rewardConfig.expectedCompletion * 100).toFixed(0)}%`} />
          <KV label="Expected persistence" value={`${(scenario.rewardConfig.expectedPersistence * 100).toFixed(0)}%`} />
          <KV label="Reward type mix" value={Object.entries(scenario.rewardConfig.rewardTypeMix).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`).join(', ')} />
        </div>
      </div>

      {/* Behavioural modifiers */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Behavioural Economics Modifiers</h3>
        <div className="space-y-2">
          {BEHAVIOURAL_ECON_MODIFIERS.map((mod) => {
            const isActive = scenario.rewardConfig.behaviouralModifiers.includes(mod.id);
            return (
              <div key={mod.id} className={`rounded-lg border p-2.5 ${
                isActive ? 'border-accent/30 bg-accent/5' : 'border-border/40 bg-surface/40 opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">{mod.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-accent">+{(mod.liftFactor * 100).toFixed(0)}% lift</span>
                    <span className={`text-2xs px-1.5 py-0.5 rounded ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="text-2xs text-tertiary mt-0.5">{mod.description}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-2xs text-tertiary">
          Lift = Π(1 + factor × 0.70^rank), capped at 2.0<br />
          Active modifiers: {scenario.rewardConfig.behaviouralModifiers.join(', ')}<br />
          Total behavioural lift: <span className="text-accent">{rewardCalc.behaviouralLift}x</span>
        </div>
      </div>

      {/* Adjusted rates */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Adjusted Rates & Cost</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <KV label="Adjusted participation" value={`${(rewardCalc.adjustedParticipation * 100).toFixed(0)}%`} />
          <KV label="Adjusted completion" value={`${(rewardCalc.adjustedCompletion * 100).toFixed(0)}%`} />
          <KV label="Adjusted persistence" value={`${(rewardCalc.adjustedPersistence * 100).toFixed(0)}%`} />
          <KV label="Reward cost per member" value={`$${rewardCalc.rewardCostPerMember}`} />
          <KV label="Participating members" value={Math.round(cohortSize * rewardCalc.adjustedParticipation).toLocaleString()} />
          <KV label="Total annual reward cost" value={`$${rewardCalc.totalRewardCost.toLocaleString()}`} highlight />
        </div>
      </div>

      {/* All presets */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">All {REWARD_PRESETS.length} Reward Presets</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-tertiary">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Target</th>
              <th className="py-2 pr-3 text-right">Budget</th>
              <th className="py-2 pr-3 text-right">Participation</th>
              <th className="py-2 pr-3 text-right">Completion</th>
              <th className="py-2 text-right">Persistence</th>
            </tr>
          </thead>
          <tbody>
            {REWARD_PRESETS.map((rp) => (
              <tr key={rp.id} className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-primary">{rp.name}</td>
                <td className="py-1.5 pr-3 text-secondary">{rp.outcomeTarget}</td>
                <td className="py-1.5 pr-3 text-right font-mono">${rp.budgetPerMember}</td>
                <td className="py-1.5 pr-3 text-right font-mono">{(rp.expectedParticipation * 100).toFixed(0)}%</td>
                <td className="py-1.5 pr-3 text-right font-mono">{(rp.expectedCompletion * 100).toFixed(0)}%</td>
                <td className="py-1.5 text-right font-mono">{(rp.expectedPersistence * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Assumptions View ──────────────────────────────────────────────────────

function AssumptionsView({ scenario }: { scenario: ReturnType<typeof useSimulatorStore.getState>['scenarios'][0] | undefined }) {
  const assumptions = scenario?.assumptions ?? DEFAULT_ASSUMPTIONS;

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Scenario Assumptions</h3>
        <div className="space-y-3">
          <AssumptionRow
            label="Discount Rate"
            value={assumptions.discountRate}
            description="Annual discount rate for present-value calculations"
            impact="Higher = lower present value of future savings"
          />
          <AssumptionRow
            label="Dropout Rate"
            value={assumptions.dropoutRate}
            description="Annual programme dropout rate"
            impact="Higher = lower reward cost AND lower savings (both sides shrink)"
          />
          <AssumptionRow
            label="Verification Rate"
            value={assumptions.verificationRate}
            description="Fraction of cohort with verified wearable data (used for confidence, not population)"
            impact="Higher = higher actuary confidence score"
          />
          <AssumptionRow
            label="Claims Inflation"
            value={assumptions.claimsInflation}
            description="Annual claims cost inflation"
            impact="Higher = slightly reduces projected savings (inflation erodes nominal impact)"
          />
          <AssumptionRow
            label="Realization Factor"
            value={assumptions.realizationFactor}
            description="Conservative haircut on literature effect sizes"
            impact="Most impactful assumption — directly scales all claims savings"
          />
        </div>
      </div>

      {/* METRIC_ACTUARIAL_CONFIG */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Per-Metric Actuarial Configuration</h3>
        <p className="text-2xs text-tertiary mb-3">From METRIC_ACTUARIAL_CONFIG — the foundation for all claims impact calculations.</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-tertiary">
              <th className="py-2 pr-3">Metric</th>
              <th className="py-2 pr-3 text-right">Baseline Cost</th>
              <th className="py-2 pr-3 text-right">Risk Signal Rate</th>
              <th className="py-2 pr-3 text-right">Improvement Rate</th>
              <th className="py-2 pr-3 text-right">Realization</th>
              <th className="py-2 pr-3 text-right">Latency (mo)</th>
              <th className="py-2">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(METRIC_ACTUARIAL_CONFIG).map(([metric, config]) => (
              <tr key={metric} className="border-b border-border/30 hover:bg-hover/30">
                <td className="py-1.5 pr-3 font-medium text-primary">{HEALTH_METRIC_LABELS[metric as HealthMetric]}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">${config.baselineClaimCostPerMember.toLocaleString()}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{(config.riskSignalRate * 100).toFixed(0)}%</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{(config.expectedImprovementRate * 100).toFixed(0)}%</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{(config.realizationFactor * 100).toFixed(0)}%</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{config.outcomeLatencyMonths}</td>
                <td className="py-1.5">
                  <span className={`text-2xs px-1.5 py-0.5 rounded ${
                    config.evidenceLevel === 'high' ? 'bg-green-500/10 text-green-500' :
                    config.evidenceLevel === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>{config.evidenceLevel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cohort Presets */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Cohort Presets ({COHORT_PRESETS.length})</h3>
        <div className="space-y-2">
          {COHORT_PRESETS.map((preset) => (
            <div key={preset.id} className="rounded-lg border border-border/40 bg-surface/40 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">{preset.icon} {preset.name}</span>
                <span className="text-2xs font-mono text-tertiary">~{preset.estimatedSize.toLocaleString()} members</span>
              </div>
              <div className="text-2xs text-tertiary">{preset.description}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-2xs font-mono text-secondary">
                <span>Market: {preset.definition.market}</span>
                <span>|</span>
                <span>Product: {preset.definition.productType}</span>
                <span>|</span>
                <span>Age: {preset.definition.ageRange[0]}-{preset.definition.ageRange[1]}</span>
                <span>|</span>
                <span>Risk: {preset.definition.baselineRisk}</span>
                <span>|</span>
                <span>Device: {preset.definition.deviceClass}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Behaviour Levers */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Behaviour Levers ({BEHAVIOUR_LEVERS.length})</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-tertiary">
              <th className="py-2 pr-3">Lever</th>
              <th className="py-2 pr-3">Metrics</th>
              <th className="py-2 pr-3 text-right">Baseline Range</th>
              <th className="py-2 pr-3">Unit</th>
              <th className="py-2 text-right">Improvement Ceiling</th>
            </tr>
          </thead>
          <tbody>
            {BEHAVIOUR_LEVERS.map((lever) => (
              <tr key={lever.id} className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-primary">{lever.label}</td>
                <td className="py-1.5 pr-3 text-tertiary font-mono text-2xs">{lever.metrics.join(', ')}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary">{lever.baselineRange[0]}–{lever.baselineRange[1]}</td>
                <td className="py-1.5 pr-3 text-secondary">{lever.unit}</td>
                <td className="py-1.5 text-right font-mono text-secondary">{(lever.improvementCeiling * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Confidence View ───────────────────────────────────────────────────────

function ConfidenceView(_props: { scenario: ReturnType<typeof useSimulatorStore.getState>['scenarios'][0] | undefined }) {
  return (
    <div className="space-y-4">
      {/* Source confidence bands */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Source Confidence Bands</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-tertiary">
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Signal Type</th>
              <th className="py-2 pr-3 text-right">Base Confidence</th>
              <th className="py-2 pr-3 text-right">Min</th>
              <th className="py-2 text-right">Max</th>
            </tr>
          </thead>
          <tbody>
            {SOURCE_CONFIDENCE_BANDS.map((band) => (
              <tr key={`${band.source}-${band.signalType}`} className="border-b border-border/30">
                <td className="py-1.5 pr-3 font-medium text-primary">{band.source}</td>
                <td className="py-1.5 pr-3 text-secondary">{band.signalType}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-accent">{band.baseConfidence.toFixed(2)}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-tertiary">{band.minConfidence.toFixed(2)}</td>
                <td className="py-1.5 text-right font-mono text-tertiary">{band.maxConfidence.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modulating factors */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Confidence Modulating Factors</h3>
        {CONFIDENCE_MODULATING_FACTORS.map((factor) => (
          <div key={factor.id} className="rounded-lg border border-border/40 bg-surface/40 p-3 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-primary">{factor.label}</span>
              <span className="text-xs font-mono text-accent">{factor.defaultWeight.toFixed(2)} default</span>
            </div>
            <div className="text-2xs text-tertiary">{factor.description}</div>
            <div className="text-2xs font-mono text-secondary mt-1">Range: [{factor.min}, {factor.max}]</div>
          </div>
        ))}
      </div>

      {/* Confidence scoring formula */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Confidence Scoring Formula</h3>
        <div className="space-y-2 text-xs text-secondary">
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 font-mono text-2xs space-y-1.5">
            <div><span className="text-accent">dataConfidence</span> = avg(sourceConfidenceBands for active signals × modulating factors)</div>
            <div><span className="text-accent">evidenceConfidence</span> = avg(evidenceLevel scores for active interventions)</div>
            <div className="text-tertiary pl-4">where high=0.72, medium=0.54, low=0.34</div>
            <div><span className="text-accent">compositeConfidence</span> = (dataConf + evidenceConf) / 2 × realizationFactor boost</div>
            <div className="mt-2 border-t border-border/30 pt-2">
              <div>Label thresholds:</div>
              <div className="pl-4 text-tertiary">{'>'} 0.55 → "higher confidence"</div>
              <div className="pl-4 text-tertiary">{'>'} 0.35 → "directional"</div>
              <div className="pl-4 text-tertiary">{'≤'} 0.35 → "exploratory"</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared Components ─────────────────────────────────────────────────────

function TraceStep({ number, title, color, children }: { number: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {number}
        </div>
        <h3 className="text-sm font-semibold text-primary font-display">{title}</h3>
      </div>
      <div className="space-y-1.5 ml-10">
        {children}
      </div>
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-tertiary">{label}</span>
      <span className={`font-mono ${highlight ? 'text-accent font-bold' : 'text-secondary'}`}>{value}</span>
    </div>
  );
}

function KVSmall({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-tertiary">{label}</span>
      <span className={`font-mono ${highlight ? 'text-accent font-bold' : 'text-secondary'}`}>{value}</span>
    </div>
  );
}

function AssumptionRow({ label, value, description, impact }: { label: string; value: number; description: string; impact: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface/40 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-primary">{label}</span>
        <span className="text-sm font-mono text-accent font-bold">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="text-2xs text-tertiary">{description}</div>
      <div className="text-2xs text-secondary mt-0.5">Impact: {impact}</div>
    </div>
  );
}
