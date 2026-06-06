import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useSimulationResultStore } from '../store/useSimulationResultStore';
import OutputSummaryPanel from '../components/OutputSummaryPanel';
import MultiHorizonChart from '../components/MultiHorizonChart';
import LeverBreakdownTable from '../components/LeverBreakdownTable';
import ScenarioComparePanel from '../components/ScenarioComparePanel';
import { formatCurrencyCompact } from '@/utils/format';

export default function OutputDashboard() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId } = useSimulatorStore();
  const { results } = useSimulationResultStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);
  const output = scenario ? results[scenario.id] : undefined;

  const [activeTab, setActiveTab] = useState<'results' | 'compare'>('results');
  const [horizon, setHorizon] = useState<'90d' | '1y' | '3y'>('1y');
  const [compareScenarioId, setCompareScenarioId] = useState<string>('');

  if (!scenario || !output) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No simulation results available.</p>
        <button onClick={() => navigate('/simulator/run')} className="btn-ghost text-sm mt-2">Run Simulation</button>
      </div>
    );
  }

  const compareOutput = compareScenarioId ? results[compareScenarioId] : undefined;
  const otherScenarios = scenarios.filter((s) => s.id !== scenario.id && results[s.id]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-3 py-2 text-sm border-b-2 transition-colors ${
            activeTab === 'results' ? 'text-accent border-accent' : 'text-tertiary border-transparent hover:text-secondary'
          }`}
        >
          Results
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 py-2 text-sm border-b-2 transition-colors ${
            activeTab === 'compare' ? 'text-accent border-accent' : 'text-tertiary border-transparent hover:text-secondary'
          }`}
        >
          Compare
        </button>
      </div>

      {activeTab === 'results' && (
        <>
          {/* Horizon selector */}
          <div className="flex items-center gap-2">
            {(['90d', '1y', '3y'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  horizon === h ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-surface text-secondary'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Summary metrics */}
          <OutputSummaryPanel output={output} horizon={horizon} />

          {/* Value Waterfall */}
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-3">Value Waterfall</h3>
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="text-2xs text-tertiary mb-1">Gross Value</div>
                <div className="h-16 w-full rounded-lg bg-accent/15 flex items-center justify-center">
                  <span className="text-sm font-mono font-bold text-accent">{formatCurrencyCompact(output.horizons[horizon].grossTotalValue)}</span>
                </div>
              </div>
              <div className="text-lg text-tertiary shrink-0">−</div>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="text-2xs text-tertiary mb-1">Reward Cost</div>
                <div className="h-16 w-full rounded-lg bg-red-500/10 flex items-center justify-center">
                  <span className="text-sm font-mono font-bold text-red-400">{formatCurrencyCompact(output.horizons[horizon].recommendedRewardBudget)}</span>
                </div>
              </div>
              <div className="text-lg text-tertiary shrink-0">=</div>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="text-2xs text-tertiary mb-1">Net ROI</div>
                <div className="h-16 w-full rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="text-sm font-mono font-bold text-green-500">{formatCurrencyCompact(output.horizons[horizon].netROI)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-horizon chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-3">Multi-Horizon Projections</h3>
            <MultiHorizonChart output={output} />
          </div>

          {/* Lever breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-3">Per-Lever ROI Contribution</h3>
            <LeverBreakdownTable breakdowns={output.leverBreakdowns} />
          </div>

          {/* Plain English summary */}
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-2">Summary</h3>
            <p className="text-sm text-secondary leading-relaxed">{output.plainEnglishSummary}</p>
          </div>

          {/* Scenario range */}
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-2">Scenario Range</h3>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xs text-tertiary">Low</div>
                <div className="text-sm font-mono text-secondary">{formatCurrencyCompact(output.horizons[horizon].scenarioRangeLow)}</div>
              </div>
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-accent/40 rounded-full" style={{ width: '60%', marginLeft: '20%' }} />
              </div>
              <div>
                <div className="text-2xs text-tertiary">High</div>
                <div className="text-sm font-mono text-secondary">{formatCurrencyCompact(output.horizons[horizon].scenarioRangeHigh)}</div>
              </div>
            </div>
            <div className="mt-2 text-2xs text-accent">{output.confidenceLabel}</div>
          </div>

          {/* Caveats */}
          <div className="card">
            <h3 className="text-sm font-semibold text-primary font-display mb-2">Caveats</h3>
            <ul className="space-y-1">
              {output.caveats.map((c, i) => (
                <li key={i} className="text-xs text-tertiary flex gap-2">
                  <span className="text-amber-400 shrink-0">*</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div>
            <label className="text-2xs text-tertiary block mb-1">Compare with</label>
            <select
              value={compareScenarioId}
              onChange={(e) => setCompareScenarioId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
            >
              <option value="">Select a scenario</option>
              {otherScenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {compareOutput && (
            <ScenarioComparePanel
              scenarios={[
                { name: scenario.name, output },
                { name: scenarios.find((s) => s.id === compareScenarioId)!.name, output: compareOutput },
              ]}
              horizon={horizon}
            />
          )}

          {!compareOutput && compareScenarioId === '' && (
            <p className="text-sm text-tertiary py-4">Select a scenario to compare against.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/bridge')} className="btn-primary text-sm">View Health-to-Value Bridge →</button>
        <button onClick={() => navigate('/simulator/compare')} className="btn-ghost text-sm">Full Comparison →</button>
      </div>
    </div>
  );
}
