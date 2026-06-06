import { useMemo } from 'react';
import { Users, Smartphone, Watch, Stethoscope } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { buildPopulationCohort } from '../../engine/populationModel';
import { MARKET_LABELS } from '../../constants';

export default function PopulationChapter() {
  const config = useSimulatorStore((s) => s.config);
  const updateConfig = useSimulatorStore((s) => s.updateConfig);

  const cohort = useMemo(
    () => buildPopulationCohort(config.market, config.cohortSize),
    [config.market, config.cohortSize],
  );

  return (
    <ChapterLayout
      chapter={1}
      sources={cohort.sources}
    >
      {/* Market + cohort size selector */}
      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-2xs text-tertiary block mb-1.5">Market</label>
          <div className="flex gap-2">
            {(['hong_kong', 'singapore'] as const).map((m) => (
              <button
                key={m}
                onClick={() => updateConfig({ market: m })}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  config.market === m
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-secondary hover:border-accent/40'
                }`}
              >
                {MARKET_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-2xs text-tertiary block mb-1.5">Book Size (insured lives)</label>
          <div className="flex gap-2">
            {[50_000, 100_000, 250_000, 500_000].map((size) => (
              <button
                key={size}
                onClick={() => updateConfig({ cohortSize: size })}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-mono font-medium transition-colors ${
                  config.cohortSize === size
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-secondary hover:border-accent/40'
                }`}
              >
                {(size / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Census demographics */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Users size={15} className="text-accent" />
          Census Demographics
        </div>
        <p className="mt-1 text-xs text-tertiary">
          {cohort.totalSize.toLocaleString()} lives distributed across 8 age-sex bands from {MARKET_LABELS[config.market]} census data.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left text-tertiary font-medium">Age Band</th>
                <th className="py-2 text-right text-tertiary font-medium">Male</th>
                <th className="py-2 text-right text-tertiary font-medium">Female</th>
                <th className="py-2 text-right text-tertiary font-medium">Total</th>
                <th className="py-2 text-right text-tertiary font-medium">Avg Steps</th>
                <th className="py-2 text-right text-tertiary font-medium">Mortality/1K</th>
              </tr>
            </thead>
            <tbody>
              {cohort.cells
                .filter((_, i) => i % 2 === 0) // Show one row per age band (male)
                .map((cell) => {
                  const femaleCell = cohort.cells.find(
                    (c) => c.ageBand === cell.ageBand && c.gender === 'female',
                  );
                  return (
                    <tr key={cell.ageBand} className="border-b border-border/50">
                      <td className="py-2 font-medium text-primary">{cell.ageBand}</td>
                      <td className="py-2 text-right text-secondary font-mono">{cell.count.toLocaleString()}</td>
                      <td className="py-2 text-right text-secondary font-mono">{(femaleCell?.count ?? 0).toLocaleString()}</td>
                      <td className="py-2 text-right text-primary font-mono font-medium">
                        {(cell.count + (femaleCell?.count ?? 0)).toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-secondary font-mono">{cell.baselineSteps.central.toLocaleString()}</td>
                      <td className="py-2 text-right text-secondary font-mono">{cell.baselineMortalityPer1000.toFixed(2)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signal coverage */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Watch size={15} className="text-accent" />
          Signal Coverage
        </div>
        <p className="mt-1 text-xs text-tertiary">
          Not everyone has the same data signals. Campaign eligibility depends on signal availability.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SignalCard
            icon={<Smartphone size={20} />}
            label="Phone (Steps)"
            count={cohort.signalCoverageTotals.phoneCount}
            pct={cohort.summary.pctWithPhone}
            color="text-blue-500"
          />
          <SignalCard
            icon={<Watch size={20} />}
            label="Wearable (HR, HRV, Sleep)"
            count={cohort.signalCoverageTotals.wearableCount}
            pct={cohort.summary.pctWithWearable}
            color="text-purple-500"
          />
          <SignalCard
            icon={<Stethoscope size={20} />}
            label="Clinical (HbA1c, BP)"
            count={cohort.totalSize}
            pct={1.0}
            color="text-amber-500"
          />
        </div>
      </div>

      <EvidenceCallout title="Why this matters" source={cohort.sources[0]}>
        Signal coverage determines which campaigns are viable. With{' '}
        {(cohort.summary.pctWithWearable * 100).toFixed(0)}% wearable penetration in{' '}
        {MARKET_LABELS[config.market]}, cardiac and sleep campaigns reach{' '}
        {cohort.signalCoverageTotals.wearableCount.toLocaleString()} lives.
        Phone-based campaigns (active minutes) reach{' '}
        {(cohort.summary.pctWithPhone * 100).toFixed(0)}% of the book.
      </EvidenceCallout>
    </ChapterLayout>
  );
}

function SignalCard({
  icon,
  label,
  count,
  pct,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-base/70 p-4">
      <div className={`${color}`}>{icon}</div>
      <div className="mt-2 text-xs text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold text-primary">
        {count.toLocaleString()}
      </div>
      <div className="mt-1 text-2xs text-secondary">{(pct * 100).toFixed(0)}% of book</div>
      <div className="mt-2 h-1.5 rounded-full bg-hover">
        <div className={`h-full rounded-full bg-current ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
