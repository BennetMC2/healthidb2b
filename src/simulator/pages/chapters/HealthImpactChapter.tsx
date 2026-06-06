import { useMemo } from 'react';
import { HeartPulse, Shield } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import RangeDisplay from '../../components/RangeDisplay';
import SourceCitation from '../../components/SourceCitation';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { runSimulation } from '../../engine/simulate';

export default function HealthImpactChapter() {
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
      <ChapterLayout chapter={5}>
        <EvidenceCallout title="Select campaigns first" type="warning">
          Go back to Chapter 3 to select your campaigns.
        </EvidenceCallout>
      </ChapterLayout>
    );
  }

  const campaigns = result.multiCampaign.campaigns;

  return (
    <ChapterLayout
      chapter={5}
      sources={campaigns.flatMap((c) => c.sources).filter((s, i, arr) => arr.indexOf(s) === i)}
    >
      <EvidenceCallout title="Per-campaign health impact" type="info">
        Each campaign runs its own dose-response model using metric-specific evidence.
        Avoided deaths are calculated from the shift magnitude × engagement × persistence × dose-response.
      </EvidenceCallout>

      {/* Per-campaign results */}
      <div className="space-y-4">
        {campaigns.map((cr) => (
          <div key={cr.campaignId} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <HeartPulse size={15} className="text-accent" />
                  {cr.campaignName}
                </div>
                <div className="text-xs text-tertiary mt-0.5">{cr.metric}</div>
              </div>
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-2xs font-medium text-accent">
                {cr.eligibleCohort.toLocaleString()} eligible
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <div>
                <div className="text-2xs text-tertiary">Avoided Deaths</div>
                <RangeDisplay range={cr.health.totals.avoidedDeaths} format="number" className="mt-1" />
              </div>
              <div>
                <div className="text-2xs text-tertiary">Mortality Reduction</div>
                <RangeDisplay range={cr.health.totals.mortalityReductionPct} format="decimal" className="mt-1" />
                <span className="text-2xs text-tertiary">%</span>
              </div>
              <div>
                <div className="text-2xs text-tertiary">Claims Savings</div>
                <RangeDisplay range={cr.perCampaignSavings} format="currency" className="mt-1" />
              </div>
              <div>
                <div className="text-2xs text-tertiary">Effective Participants</div>
                <RangeDisplay range={cr.behaviour.totalEffectiveParticipants} format="number" className="mt-1" />
              </div>
            </div>

            {/* Archetype contribution */}
            <div className="mt-4">
              <div className="text-2xs text-tertiary mb-2">Value by archetype</div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                {cr.health.totals.archetypeContribution
                  .filter((a) => a.pctOfTotalValue > 1)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="h-full"
                      style={{
                        width: `${a.pctOfTotalValue}%`,
                        backgroundColor: a.id === 'steady_movers' ? '#22c55e'
                          : a.id === 'super_engagers' ? '#3b82f6'
                          : a.id === 'sporadic_engagers' ? '#eab308'
                          : a.id === 'already_active' ? '#8b5cf6'
                          : '#94a3b8',
                      }}
                      title={`${a.name}: ${a.pctOfTotalValue.toFixed(0)}%`}
                    />
                  ))}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {cr.health.totals.archetypeContribution
                  .filter((a) => a.pctOfTotalValue > 1)
                  .map((a) => (
                    <span key={a.id} className="text-2xs text-tertiary">
                      {a.name}: {a.pctOfTotalValue.toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>

            {cr.health.sources.length > 0 && (
              <div className="mt-3">
                <SourceCitation source={cr.health.sources[0]} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Combined summary */}
      {campaigns.length > 1 && (
        <div className="card border-accent/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Shield size={15} className="text-accent" />
            Combined Health Impact
          </div>
          <div className="mt-2 text-xs text-tertiary">
            Overlap discount ({(result.multiCampaign.combined.overlapDiscount * 100).toFixed(0)}%) applied
            to prevent double-counting across health pathways.
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-2xs text-tertiary">Total Avoided Deaths</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-primary">
                {campaigns.reduce((s, c) => s + c.health.totals.avoidedDeaths.central, 0).toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-2xs text-tertiary">Combined Claims Savings</div>
              <RangeDisplay range={result.multiCampaign.combined.grossClaimsSavings} format="currency" className="mt-1" />
            </div>
            <div>
              <div className="text-2xs text-tertiary">Campaigns</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-primary">
                {campaigns.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </ChapterLayout>
  );
}
