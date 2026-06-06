import { useSimulatorStore } from '../store/useSimulatorStore';
import { DEFAULT_ASSUMPTIONS, MODEL_VERSION } from '../constants';
import { METRIC_ACTUARIAL_CONFIG } from '@/utils/actuarial';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import type { HealthMetric } from '@/types';
import { formatPercent, formatCurrency } from '@/utils/format';
import AdvancedToggle from '../components/AdvancedToggle';

export default function SimulatorSettings() {
  const { scenarios, activeScenarioId, updateAssumptions } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);

  const assumptions = scenario?.assumptions ?? DEFAULT_ASSUMPTIONS;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Model version */}
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-2xs text-tertiary">Model Version</div>
          <div className="text-xl font-semibold text-primary font-display font-mono">{MODEL_VERSION}</div>
        </div>
        <div>
          <div className="text-2xs text-tertiary">Active Scenario</div>
          <div className="text-sm text-primary">{scenario?.name ?? 'None selected'}</div>
        </div>
      </div>

      {/* Default assumptions */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-primary font-display">Default Assumptions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: 'discountRate' as const, label: 'Discount Rate', desc: 'Annual rate used to discount future cash flows' },
            { key: 'dropoutRate' as const, label: 'Dropout Rate', desc: 'Annual attrition rate from the programme' },
            { key: 'verificationRate' as const, label: 'Verification Rate', desc: 'Proportion of cohort that achieves verified status' },
            { key: 'claimsInflation' as const, label: 'Claims Inflation', desc: 'Annual claims cost inflation rate' },
            { key: 'realizationFactor' as const, label: 'Realization Factor', desc: 'Discount applied to theoretical effect sizes' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="rounded-lg border border-border/60 bg-surface/40 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-primary">{label}</span>
                <span className="text-sm text-accent font-mono">{formatPercent(assumptions[key])}</span>
              </div>
              <p className="text-2xs text-tertiary mb-2">{desc}</p>
              {scenario && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(assumptions[key] * 100)}
                  onChange={(e) => updateAssumptions(scenario.id, { [key]: Number(e.target.value) / 100 })}
                  className="w-full"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Per-metric baseline claim costs */}
      <AdvancedToggle label="Per-Metric Baseline Claim Costs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-2xs text-tertiary">
                <th className="py-2 pr-3 font-normal">Metric</th>
                <th className="py-2 px-3 font-normal text-right">Baseline Cost</th>
                <th className="py-2 px-3 font-normal text-right">Risk Signal Rate</th>
                <th className="py-2 px-3 font-normal text-right">Realization</th>
                <th className="py-2 px-3 font-normal text-right">Expected Improvement</th>
                <th className="py-2 pl-3 font-normal">Evidence Level</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(METRIC_ACTUARIAL_CONFIG) as [HealthMetric, typeof METRIC_ACTUARIAL_CONFIG[HealthMetric]][]).map(([metric, config]) => {
                const levelColor = config.evidenceLevel === 'high' ? 'text-green-500' : config.evidenceLevel === 'medium' ? 'text-amber-400' : 'text-secondary';
                return (
                  <tr key={metric} className="border-b border-border/30">
                    <td className="py-2 pr-3 text-secondary font-medium">{HEALTH_METRIC_LABELS[metric]}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(config.baselineClaimCostPerMember)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatPercent(config.riskSignalRate)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatPercent(config.realizationFactor)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatPercent(config.expectedImprovementRate)}</td>
                    <td className={`py-2 pl-3 font-medium ${levelColor}`}>{config.evidenceLevel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdvancedToggle>

      {/* Confidence bands */}
      <AdvancedToggle label="Confidence Band Configuration">
        <div className="space-y-2 text-xs text-secondary">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
              <div className="text-2xs text-green-500">Higher Confidence</div>
              <div className="text-sm font-mono text-primary mt-1">≥ 62%</div>
              <div className="text-2xs text-tertiary mt-1">Scenario range: 78%-128%</div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="text-2xs text-amber-400">Directional</div>
              <div className="text-sm font-mono text-primary mt-1">40%-62%</div>
              <div className="text-2xs text-tertiary mt-1">Scenario range: 55%-140%</div>
            </div>
            <div className="rounded-lg border border-border bg-surface/40 p-3">
              <div className="text-2xs text-secondary">Exploratory</div>
              <div className="text-sm font-mono text-primary mt-1">&lt; 40%</div>
              <div className="text-2xs text-tertiary mt-1">Scenario range: 35%-155%</div>
            </div>
          </div>
        </div>
      </AdvancedToggle>
    </div>
  );
}
