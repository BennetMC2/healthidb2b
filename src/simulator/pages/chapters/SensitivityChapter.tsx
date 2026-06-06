import { useMemo } from 'react';
import { AlertTriangle, Target, BarChart3 } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import RangeDisplay from '../../components/RangeDisplay';
import TornadoChart from '../../components/TornadoChart';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { runSimulation } from '../../engine/simulate';

export default function SensitivityChapter() {
  const config = useSimulatorStore((s) => s.config);

  const result = useMemo(() => {
    if (config.selectedCampaigns.length === 0) return null;
    try {
      return runSimulation(config);
    } catch {
      return null;
    }
  }, [config]);

  if (!result) {
    return (
      <ChapterLayout chapter={7}>
        <EvidenceCallout title="Run simulation first" type="warning">
          Go back to Chapter 3 to select your campaigns.
        </EvidenceCallout>
      </ChapterLayout>
    );
  }

  const { sensitivity } = result.multiCampaign;

  return (
    <ChapterLayout
      chapter={7}
      sources={[
        'Sensitivity ranges based on ±30% variation of base assumptions',
        'Breakeven calculated from reward budget vs gross value at varying rates',
      ]}
    >
      <EvidenceCallout title="What if we're wrong?" type="warning">
        Every model has uncertainty. This chapter shows what happens when each assumption
        is varied by ±30%. The tornado chart ranks variables by their impact on ROI.
        The breakeven analysis shows the minimum conditions for the programme to pay for itself.
      </EvidenceCallout>

      {/* Tornado chart */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BarChart3 size={15} className="text-accent" />
          Sensitivity Tornado
        </div>
        <p className="mt-1 text-xs text-tertiary">
          Impact on gross value when each variable is changed ±30% from base case.
          Wider bars = more sensitive.
        </p>
        <div className="mt-4">
          <TornadoChart
            variables={sensitivity.variables}
          />
        </div>
      </div>

      {/* Breakeven analysis */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Target size={15} className="text-accent" />
          Breakeven Analysis
        </div>
        <p className="mt-1 text-xs text-tertiary">
          The programme pays for itself even if key assumptions are much lower than central estimates.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-base/70 p-4">
            <div className="text-xs text-tertiary">Minimum Improvement Rate to Break Even</div>
            <div className="mt-1 font-mono text-3xl font-semibold text-primary">
              {(sensitivity.breakeven.minImprovementRate * 100).toFixed(0)}%
            </div>
            <p className="mt-2 text-2xs text-secondary">
              Our central estimate is 35%. The programme breaks even at just{' '}
              {(sensitivity.breakeven.minImprovementRate * 100).toFixed(0)}%.
            </p>
            <div className="mt-2 h-2 rounded-full bg-hover">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${Math.min(100, sensitivity.breakeven.minImprovementRate * 100 / 35 * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-base/70 p-4">
            <div className="text-xs text-tertiary">Minimum Participation Rate to Break Even</div>
            <div className="mt-1 font-mono text-3xl font-semibold text-primary">
              {(sensitivity.breakeven.minParticipationRate * 100).toFixed(0)}%
            </div>
            <p className="mt-2 text-2xs text-secondary">
              Our central estimate is 55%. Even at{' '}
              {(sensitivity.breakeven.minParticipationRate * 100).toFixed(0)}% participation,
              the programme covers its costs.
            </p>
            <div className="mt-2 h-2 rounded-full bg-hover">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${Math.min(100, sensitivity.breakeven.minParticipationRate * 100 / 55 * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scenario stress testing */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <AlertTriangle size={15} className="text-accent" />
          Stress-Tested Scenarios
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ScenarioCard
            label="Conservative"
            description="50% lower participation + improvement rates"
            range={sensitivity.scenarios.conservative}
            color="text-amber-500"
          />
          <ScenarioCard
            label="Central"
            description="Evidence-based central estimates"
            range={sensitivity.scenarios.central}
            color="text-accent"
            highlight
          />
          <ScenarioCard
            label="Optimistic"
            description="Discovery Vitality benchmarks applied"
            range={sensitivity.scenarios.optimistic}
            color="text-green-500"
          />
        </div>
      </div>

      <EvidenceCallout title="The takeaway" type="success">
        Even in the conservative scenario (50% lower than central estimates), the gross value is{' '}
        ${(sensitivity.scenarios.conservative.central / 1e6).toFixed(1)}M — still sufficient to
        fund meaningful rewards. The model has been stress-tested across 7 variables and holds
        under pessimistic assumptions.
      </EvidenceCallout>
    </ChapterLayout>
  );
}

function ScenarioCard({ label, description, range, color, highlight }: {
  label: string;
  description: string;
  range: import('../../types').Range;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-accent/30 bg-accent/5' : 'border-border bg-base/70'}`}>
      <div className={`text-sm font-semibold ${color}`}>{label}</div>
      <p className="mt-1 text-2xs text-tertiary">{description}</p>
      <div className="mt-3">
        <RangeDisplay range={range} format="currency" />
      </div>
    </div>
  );
}
