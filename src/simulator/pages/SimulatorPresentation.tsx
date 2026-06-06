import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { runSimulation } from '../engine/simulate';
import RangeDisplay from '../components/RangeDisplay';
import EvidenceCallout from '../components/EvidenceCallout';
import TornadoChart from '../components/TornadoChart';
import { MARKET_LABELS, CHAPTERS } from '../constants';
import { getCampaignTemplate } from '../data/campaignTemplates';

export default function SimulatorPresentation() {
  const navigate = useNavigate();
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
      <div className="mx-auto max-w-5xl py-10 text-center">
        <p className="text-sm text-tertiary">No simulation results. Please configure and run first.</p>
        <button onClick={() => navigate('/simulator/build/1')} className="btn-primary mt-4 text-sm">
          Start Building
        </button>
      </div>
    );
  }

  const { cohort, multiCampaign, financials } = result;
  const campaigns = multiCampaign.campaigns;
  const combined = multiCampaign.combined;
  const horizonYears = config.horizonMonths / 12;

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/simulator')} className="btn-ghost text-sm">
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {/* Title slide */}
      <div className="text-center py-8">
        <div className="text-2xs uppercase tracking-[0.2em] text-accent/80">
          Campaign-Centric ROI Model
        </div>
        <h1 className="mt-3 text-4xl font-semibold text-primary font-display">
          {MARKET_LABELS[config.market]} — {cohort.totalSize.toLocaleString()} Lives
        </h1>
        <p className="mt-2 text-sm text-tertiary">
          {campaigns.length} campaign{campaigns.length > 1 ? 's' : ''} ·{' '}
          {horizonYears} year{horizonYears > 1 ? 's' : ''} · {(config.rewardCeilingPct * 100).toFixed(0)}% reward ceiling
        </p>
      </div>

      {/* Ch1: Population */}
      <Section chapter={1}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Lives" value={cohort.totalSize.toLocaleString()} />
          <StatCard label="Avg Age" value={cohort.summary.avgAge.toFixed(0)} />
          <StatCard label="Wearable Penetration" value={`${(cohort.summary.pctWithWearable * 100).toFixed(0)}%`} />
        </div>
      </Section>

      {/* Ch3: Campaigns */}
      <Section chapter={3}>
        <div className="grid gap-3 sm:grid-cols-3">
          {campaigns.map((cr) => {
            const template = getCampaignTemplate(cr.campaignId);
            return (
              <div key={cr.campaignId} className="card">
                <div className="text-sm font-semibold text-primary">{cr.campaignName}</div>
                <div className="text-2xs text-tertiary">{cr.metric}</div>
                <div className="mt-2 text-xs text-secondary">
                  {cr.eligibleCohort.toLocaleString()} eligible ({template?.requiredSignal} signal)
                </div>
              </div>
            );
          })}
        </div>
        {campaigns.length > 1 && (
          <div className="mt-2 text-xs text-tertiary">
            Overlap discount: {(combined.overlapDiscount * 100).toFixed(0)}%
          </div>
        )}
      </Section>

      {/* Ch5: Health Impact */}
      <Section chapter={5}>
        <div className="space-y-3">
          {campaigns.map((cr) => (
            <div key={cr.campaignId} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium text-primary">{cr.campaignName}</div>
                <div className="text-2xs text-tertiary">{cr.eligibleCohort.toLocaleString()} eligible</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-primary">
                  {cr.health.totals.avoidedDeaths.central.toFixed(1)}
                </div>
                <div className="text-2xs text-tertiary">avoided deaths</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Ch6: Financial */}
      <Section chapter={6}>
        <div className="text-center py-4">
          <div className="font-mono text-6xl font-semibold text-primary">
            {combined.roiMultiple.central.toFixed(1)}×
          </div>
          <div className="mt-1 text-sm text-tertiary">ROI Multiple</div>
          <RangeDisplay range={combined.roiMultiple} format="multiple" className="mt-2 justify-center" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Gross Value" value={`$${(financials.grossTotalValue.central / 1e6).toFixed(1)}M`} />
          <StatCard label="Reward Budget" value={`$${(financials.affordableRewardBudget.central / 1e6).toFixed(1)}M`} />
          <StatCard label="Net ROI" value={`$${(financials.netROI.central / 1e6).toFixed(1)}M`} />
        </div>
      </Section>

      {/* Ch7: Sensitivity */}
      <Section chapter={7}>
        <TornadoChart
          variables={multiCampaign.sensitivity.variables}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-amber-500 font-semibold">Conservative</div>
            <RangeDisplay range={multiCampaign.sensitivity.scenarios.conservative} format="currency" className="mt-1" />
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="text-xs text-accent font-semibold">Central</div>
            <RangeDisplay range={multiCampaign.sensitivity.scenarios.central} format="currency" className="mt-1" />
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-green-500 font-semibold">Optimistic</div>
            <RangeDisplay range={multiCampaign.sensitivity.scenarios.optimistic} format="currency" className="mt-1" />
          </div>
        </div>
      </Section>

      {/* Bottom line */}
      <EvidenceCallout title="The bottom line" type="success">
        Over {horizonYears} year{horizonYears > 1 ? 's' : ''}, these {campaigns.length} campaign{campaigns.length > 1 ? 's' : ''}{' '}
        generate ${(financials.grossTotalValue.central / 1e6).toFixed(1)}M in projected value at a{' '}
        {combined.roiMultiple.central.toFixed(1)}× ROI multiple. Even in the conservative scenario, the programme pays for itself.
      </EvidenceCallout>
    </div>
  );
}

function Section({ chapter, children }: { chapter: number; children: React.ReactNode }) {
  const def = CHAPTERS.find((c) => c.id === chapter);
  if (!def) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
          {chapter}
        </span>
        <h2 className="text-lg font-semibold text-primary font-display">{def.title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-base/70 p-4 text-center">
      <div className="text-2xs text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold text-primary">{value}</div>
    </div>
  );
}
