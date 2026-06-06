import { useState } from 'react';
import { SIGNALS } from '../data/signals';
import { CLINICAL_RULES, INTERVENTIONS } from '../data/interventions';
import { BEHAVIOUR_LEVERS } from '../data/behaviourLevers';
import { BEHAVIOURAL_ECON_MODIFIERS } from '../data/behaviouralEconomics';
import { REWARD_PRESETS } from '../data/rewards';
import { EVIDENCE_LIBRARY } from '../data/evidence';
import { SOURCE_CONFIDENCE_BANDS, CONFIDENCE_MODULATING_FACTORS } from '../data/sourceConfidence';
import { COHORT_PRESETS } from '../data/cohortPresets';
import { MODEL_VERSION } from '../constants';

const LAYERS = [
  {
    id: 'L1',
    label: 'Signal & Parameter Matrix',
    color: '#22c55e',
    description: 'Wearable, clinical, and user-reported health signals',
    files: ['data/signals.ts', 'types.ts (SignalDefinition)'],
    inputs: ['Apple Health', 'Garmin', 'WHOOP', 'Oura', 'Fitbit', 'Samsung Health', 'Google Fit', 'Lab Results'],
    outputs: ['18 signal definitions', 'Source type classification', 'Behaviour lever mapping'],
    stats: () => ({
      'Total signals': SIGNALS.length,
      'Wearable signals': SIGNALS.filter(s => s.sourceType === 'wearable').length,
      'Clinical signals': SIGNALS.filter(s => s.sourceType === 'clinical').length,
      'User-reported': SIGNALS.filter(s => s.sourceType === 'user_reported').length,
      'Unique sources': [...new Set(SIGNALS.flatMap(s => s.sources))].length,
    }),
  },
  {
    id: 'L2',
    label: 'Confidence Scoring',
    color: '#3b82f6',
    description: 'Per signal x data source confidence with modulating factors',
    files: ['data/sourceConfidence.ts', 'engine/confidenceModel.ts'],
    inputs: ['Signal selection', 'Source availability', 'Modulating factors (consistency, recency, corroboration)'],
    outputs: ['Data confidence (0-1)', 'Evidence confidence (0-1)', 'Composite confidence', 'Confidence label'],
    stats: () => ({
      'Source confidence bands': SOURCE_CONFIDENCE_BANDS.length,
      'Modulating factors': CONFIDENCE_MODULATING_FACTORS.length,
      'Confidence labels': '3 (higher / directional / exploratory)',
    }),
  },
  {
    id: 'L3',
    label: 'Cohort Definitions & Risk Levers',
    color: '#8b5cf6',
    description: '6 behaviour levers x cohort profiles filtered from 36K identities',
    files: ['data/cohortPresets.ts', 'data/behaviourLevers.ts', 'engine/cohortEngine.ts'],
    inputs: ['Market', 'Product type', 'Age range', 'Baseline risk', 'Device class', 'Engagement tier'],
    outputs: ['Filtered cohort size', 'Baseline behaviour profile', 'Signal availability rates', '6 lever baselines'],
    stats: () => ({
      'Cohort presets': COHORT_PRESETS.length,
      'Behaviour levers': BEHAVIOUR_LEVERS.length,
      'Identity pool': '36,000 synthetic identities',
      'Filter dimensions': 10,
    }),
  },
  {
    id: 'L4',
    label: 'Behaviour Change Rules Engine',
    color: '#f59e0b',
    description: 'Clinical rules + behavioural-economics overlay',
    files: ['data/interventions.ts', 'data/behaviouralEconomics.ts', 'data/rules.ts'],
    inputs: ['Selected interventions', 'Clinical rules (effect sizes from literature)', 'Behavioural-econ modifiers'],
    outputs: ['Expected signal movement', 'Adjusted participation rates', 'Behaviour lift factor'],
    stats: () => ({
      'Interventions': INTERVENTIONS.length,
      'Clinical rules': CLINICAL_RULES.length,
      'Behavioural-econ modifiers': BEHAVIOURAL_ECON_MODIFIERS.length,
      'Evidence citations': EVIDENCE_LIBRARY.length,
    }),
  },
  {
    id: 'L5',
    label: 'Reward Function',
    color: '#ef4444',
    description: 'Per-client configurable incentives with behavioural-econ adjustments',
    files: ['data/rewards.ts', 'engine/rewardCalculator.ts'],
    inputs: ['Engagement strategy', 'Reward ceiling %', 'Outcome target', 'Behavioural modifiers'],
    outputs: ['Adjusted participation', 'Adjusted completion', 'Adjusted persistence', 'Derived reward budget'],
    stats: () => ({
      'Reward presets': REWARD_PRESETS.length,
      'Reward types': '4 (cash, loyalty, health-aspirational, status)',
      'Outcome targets': '4 (LTV, retention, claims, cross-sell)',
    }),
  },
  {
    id: 'L6',
    label: 'ROI Output',
    color: '#1D7A5E',
    description: 'Multi-horizon insurer ROI with full audit lineage',
    files: ['engine/roiCalculator.ts', 'engine/simulate.ts', 'engine/auditLog.ts'],
    inputs: ['Cohort size', 'Behaviour change estimates', 'Reward ceiling', 'Assumptions', 'Time horizons'],
    outputs: ['Gross value ($)', 'Net ROI ($)', 'Derived reward budget ($)', 'Claims impact ($)', 'Morbidity shift (bps)', 'Confidence bands'],
    stats: () => ({
      'Time horizons': '3 (90-day, 1-year, 3-year)',
      'Output metrics': 11,
      'Monthly projections': 'Per-month time series with S-curve ramp',
      'Audit entries': '7 per simulation run',
    }),
  },
];

const ENGINE_COMPONENTS = [
  {
    name: 'cohortEngine',
    file: 'engine/cohortEngine.ts',
    purpose: 'Filter 36K identities by cohort definition',
    formula: 'cohort = identities.filter(age, risk, device, engagement, clinical)',
  },
  {
    name: 'confidenceModel',
    file: 'engine/confidenceModel.ts',
    purpose: 'Score data + evidence confidence',
    formula: 'composite = (dataConf + evidenceConf) / 2',
  },
  {
    name: 'rewardCalculator',
    file: 'engine/rewardCalculator.ts',
    purpose: 'Compute reward costs with behavioural-econ lift',
    formula: 'cost = budget × adjCompletion × adjParticipation × cohortSize',
  },
  {
    name: 'roiCalculator',
    file: 'engine/roiCalculator.ts',
    purpose: 'Value-first ROI: gross value → reward ceiling → net ROI',
    formula: 'netROI = grossTotalValue − min(scaledRewardCost, grossTotalValue × ceilingPct)',
  },
  {
    name: 'auditLog',
    file: 'engine/auditLog.ts',
    purpose: 'Full provenance per simulation run',
    formula: '7 audit entries tracking signals, rules, evidence, assumptions',
  },
  {
    name: 'simulate',
    file: 'engine/simulate.ts',
    purpose: 'Orchestrator combining all 6 layers',
    formula: 'L1→L2→L3→L4→L5→L6 with full lineage',
  },
];

export default function ArchitectureDiagram() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showEngine, setShowEngine] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-primary font-display">6-Layer Actuarial Behaviour Model</h2>
            <p className="text-sm text-tertiary mt-1">
              End-to-end pipeline: health signals → confidence scoring → cohort risk levers → behaviour change rules → reward function → ROI output with full audit lineage.
            </p>
          </div>
          <span className="text-2xs font-mono text-accent/80 bg-accent/8 px-2 py-1 rounded-lg">{MODEL_VERSION}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-center">
          <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
            <div className="text-lg font-bold text-primary font-mono">{SIGNALS.length}</div>
            <div className="text-2xs text-tertiary">Health Signals</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
            <div className="text-lg font-bold text-primary font-mono">{CLINICAL_RULES.length}</div>
            <div className="text-2xs text-tertiary">Clinical Rules</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
            <div className="text-lg font-bold text-primary font-mono">{EVIDENCE_LIBRARY.length}</div>
            <div className="text-2xs text-tertiary">Evidence Citations</div>
          </div>
        </div>
      </div>

      {/* Layer Flow Diagram */}
      <div className="space-y-0">
        {LAYERS.map((layer, i) => {
          const isExpanded = expandedLayer === layer.id;
          const stats = layer.stats();

          return (
            <div key={layer.id}>
              {/* Layer card */}
              <button
                onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: layer.color }}
                  >
                    {layer.id}
                  </div>
                  <div className={`flex-1 rounded-xl border px-5 py-3 transition-all ${
                    isExpanded ? 'border-accent/30 bg-accent/3' : 'border-border/60 bg-surface/40 hover:bg-hover/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-primary font-display">{layer.label}</div>
                        <div className="text-2xs text-tertiary mt-0.5">{layer.description}</div>
                      </div>
                      <span className="text-2xs text-tertiary">{isExpanded ? '▾' : '▸'}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="ml-16 mt-2 mb-2 rounded-xl border border-border/40 bg-surface/60 p-4 space-y-4">
                  {/* Inputs → Outputs */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-2xs uppercase tracking-wider text-accent/80 mb-1.5">Inputs</div>
                      <ul className="space-y-0.5">
                        {layer.inputs.map((input, j) => (
                          <li key={j} className="text-xs text-secondary flex items-start gap-1.5">
                            <span className="text-accent/50 mt-0.5">→</span> {input}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-2xs uppercase tracking-wider text-accent/80 mb-1.5">Outputs</div>
                      <ul className="space-y-0.5">
                        {layer.outputs.map((output, j) => (
                          <li key={j} className="text-xs text-secondary flex items-start gap-1.5">
                            <span className="text-green-500/50 mt-0.5">←</span> {output}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <div className="text-2xs uppercase tracking-wider text-accent/80 mb-1.5">Key Numbers</div>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-border/40 bg-surface/40 px-2.5 py-1.5">
                          <div className="text-xs font-medium text-primary font-mono">{String(value)}</div>
                          <div className="text-2xs text-tertiary">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Files */}
                  <div>
                    <div className="text-2xs uppercase tracking-wider text-accent/80 mb-1.5">Source Files</div>
                    <div className="flex flex-wrap gap-1.5">
                      {layer.files.map((file, j) => (
                        <span key={j} className="text-2xs font-mono text-accent/70 bg-accent/8 px-2 py-0.5 rounded">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Arrow between layers */}
              {i < LAYERS.length - 1 && (
                <div className="flex items-center ml-[22px] my-0">
                  <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: LAYERS[i + 1].color, opacity: 0.25 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Engine Components */}
      <div className="card">
        <button
          onClick={() => setShowEngine(!showEngine)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-semibold text-primary font-display">Simulation Engine Components</h3>
          <span className="text-2xs text-tertiary">{showEngine ? '▾ Collapse' : '▸ Expand'}</span>
        </button>

        {showEngine && (
          <div className="mt-4 space-y-3">
            {ENGINE_COMPONENTS.map((component) => (
              <div key={component.name} className="rounded-lg border border-border/40 bg-surface/40 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-primary font-display">{component.name}</span>
                  <span className="text-2xs font-mono text-accent/70 bg-accent/8 px-1.5 py-0.5 rounded">
                    {component.file}
                  </span>
                </div>
                <p className="text-xs text-tertiary mb-1.5">{component.purpose}</p>
                <div className="text-2xs font-mono text-secondary bg-black/10 dark:bg-white/5 px-2.5 py-1.5 rounded">
                  {component.formula}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Flow Summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Data Flow Summary</h3>
        <div className="text-xs text-secondary space-y-2 font-mono leading-relaxed">
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 space-y-1.5">
            <div><span className="text-[#22c55e]">L1</span> 18 health signals (3 source types, 8 data sources)</div>
            <div className="text-tertiary pl-4">↓ signal selection + source availability</div>
            <div><span className="text-[#3b82f6]">L2</span> Confidence scoring (data × evidence × modulating factors)</div>
            <div className="text-tertiary pl-4">↓ composite confidence score</div>
            <div><span className="text-[#8b5cf6]">L3</span> Cohort filtering (36K identities → target population)</div>
            <div className="text-tertiary pl-4">↓ cohort size + baseline behaviours</div>
            <div><span className="text-[#f59e0b]">L4</span> Behaviour change rules ({CLINICAL_RULES.length} clinical rules + behavioural-econ lift)</div>
            <div className="text-tertiary pl-4">↓ expected signal movement + participation rates</div>
            <div><span className="text-[#ef4444]">L5</span> Engagement strategy (participation × completion × persistence + ceiling %)</div>
            <div className="text-tertiary pl-4">↓ adjusted engagement rates + reward ceiling</div>
            <div><span className="text-[#1D7A5E]">L6</span> ROI output (gross value → reward ceiling → net ROI, per horizon)</div>
          </div>
        </div>
      </div>

      {/* Key Formulas */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Core ROI Formulas</h3>
        <div className="space-y-3">
          <FormulaBlock
            label="Effective Improvement (per clinical rule)"
            formula="effectSize × realizationFactor"
            note="Effect size from literature, haircut by realization factor (conservative discount)"
          />
          <FormulaBlock
            label="Time-Adjusted Impact"
            formula="effectiveImprovement × (effectiveMonths / horizonMonths)"
            note="Only counts months after outcome latency period"
          />
          <FormulaBlock
            label="Benefiting Lives"
            formula="cohortSize × adjustedParticipation × adjustedCompletion"
            note="Same funnel as reward cost — participating and completing members"
          />
          <FormulaBlock
            label="Claims Impact (per metric)"
            formula="baselineClaimCost × timeAdjustedImpact × benefitingLives × (1 − inflation)"
            note="Summed across all active clinical rules, then overlap-discounted"
          />
          <FormulaBlock
            label="Overlap Discount"
            formula="max(0.58, 1 − (metricCount − 1) × 0.12)"
            note="Multi-metric scenarios get a correlation discount"
          />
          <FormulaBlock
            label="Gross Total Value"
            formula="grossTotalValue = claimsImpact + crossSellUplift"
            note="Total value of behaviour change, independent of reward spend"
          />
          <FormulaBlock
            label="Reward Ceiling"
            formula="recommendedBudget = grossTotalValue × rewardCeilingPct"
            note="Default 70% — how much of the value can be spent on incentives"
          />
          <FormulaBlock
            label="Behavioural Lift"
            formula="Π (1 + liftFactor × 0.70^i) with diminishing returns, capped at 2.0"
            note="Loss aversion +50%, anchoring +15%, streaks +25%, framing +10%"
          />
          <FormulaBlock
            label="Net ROI"
            formula="grossTotalValue − min(scaledRewardCost, recommendedBudget)"
            note="Always positive when ceiling < 100% — the insurer's guaranteed return"
          />
        </div>
      </div>

      {/* Assumptions & Caveats */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Key Assumptions & Caveats</h3>
        <ul className="space-y-1.5 text-xs text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">1.</span>
            Effect sizes from clinical literature — not validated against carrier-specific claims.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">2.</span>
            Realization factor (default 65%) conservatively discounts literature estimates.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">3.</span>
            Behavioural-econ modifiers calibrated from RCT evidence (Patel 2019 STEP UP).
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">4.</span>
            Outcome latency varies by metric (4-11 months) — short horizons may show limited claims impact.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">5.</span>
            Overlap discount for multi-metric scenarios assumes correlated risk factors.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">6.</span>
            S-curve ramp-up models gradual adoption using logistic function.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5 shrink-0">7.</span>
            36K synthetic identities for cohort sizing — not real member data.
          </li>
        </ul>
      </div>
    </div>
  );
}

function FormulaBlock({ label, formula, note }: { label: string; formula: string; note: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface/40 p-3">
      <div className="text-xs font-medium text-primary mb-1">{label}</div>
      <div className="text-sm font-mono text-accent bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded mb-1.5">
        {formula}
      </div>
      <div className="text-2xs text-tertiary">{note}</div>
    </div>
  );
}
