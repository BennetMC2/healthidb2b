import { useMemo } from 'react';
import { Users } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { getCampaignTemplate } from '../../data/campaignTemplates';
import { getMetricEvidence } from '../../data/metricEvidence';
import { ARCHETYPES, getMetricAdaptedArchetypes } from '../../data/archetypes';
import { ARCHETYPE_COLORS } from '../../constants';

export default function BehaviourChapter() {
  const config = useSimulatorStore((s) => s.config);

  const campaignArchetypes = useMemo(() => {
    return config.selectedCampaigns.map((id) => {
      const template = getCampaignTemplate(id);
      if (!template) return null;
      const evidence = getMetricEvidence(template.metric);
      const shares = getMetricAdaptedArchetypes(template.metric, config.archetypeWeights);
      return { template, evidence, shares };
    }).filter(Boolean) as { template: NonNullable<ReturnType<typeof getCampaignTemplate>>; evidence: ReturnType<typeof getMetricEvidence>; shares: Record<string, number> }[];
  }, [config.selectedCampaigns, config.archetypeWeights]);

  return (
    <ChapterLayout
      chapter={4}
      sources={[
        'Patel MS et al. 2016, Annals of Internal Medicine (archetype calibration)',
        'Discovery Vitality 13-year longitudinal data (persistence rates)',
        'RAND 2013 Workplace Wellness (participation rates)',
      ]}
    >
      <EvidenceCallout title="I've seen wellness programmes fail" type="warning">
        So have we. That's why we don't model uniform participation. 45% of your book will
        never engage (non-starters). Another 17% will try and drop out within weeks. Only
        ~16% will sustain meaningful behaviour change. This model accounts for that reality.
      </EvidenceCallout>

      {/* Archetype overview */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Users size={15} className="text-accent" />
          6 Behavioural Archetypes
        </div>
        <p className="mt-1 text-xs text-tertiary">
          Calibrated from RCTs and real-world programmes. Each archetype has a different
          step change, decay curve, and persistence rate.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPES.map((arch) => (
            <div key={arch.id} className="rounded-lg border border-border bg-base/70 p-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ARCHETYPE_COLORS[arch.id] }}
                />
                <span className="text-xs font-semibold text-primary">{arch.name}</span>
                <span className="ml-auto font-mono text-xs text-secondary">
                  {(arch.defaultCohortShare * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-1 text-2xs text-tertiary leading-relaxed">{arch.description}</p>
              <div className="mt-2 flex items-center gap-3 text-2xs">
                <span className="text-secondary">
                  +{arch.stepChangeMean.toLocaleString()} steps
                </span>
                {arch.persistenceAt12Mo > 0 && (
                  <span className="text-secondary">
                    {(arch.persistenceAt12Mo * 100).toFixed(0)}% at 12mo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-campaign archetype adaptation */}
      {campaignArchetypes.length > 0 && (
        <div className="card">
          <div className="text-sm font-semibold text-primary">
            Per-Campaign Archetype Distribution
          </div>
          <p className="mt-1 text-xs text-tertiary">
            Different metrics attract different engagement profiles. VO₂ Max campaigns
            draw more super-engagers; sleep campaigns have more non-starters.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left text-tertiary font-medium">Archetype</th>
                  <th className="py-2 text-right text-tertiary font-medium">Default</th>
                  {campaignArchetypes.map((ca) => (
                    <th key={ca.template.id} className="py-2 text-right text-tertiary font-medium">
                      {ca.template.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARCHETYPES.map((arch) => (
                  <tr key={arch.id} className="border-b border-border/50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: ARCHETYPE_COLORS[arch.id] }}
                        />
                        <span className="text-primary font-medium">{arch.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono text-secondary">
                      {(arch.defaultCohortShare * 100).toFixed(0)}%
                    </td>
                    {campaignArchetypes.map((ca) => {
                      const share = ca.shares[arch.id] ?? 0;
                      const diff = share - arch.defaultCohortShare;
                      return (
                        <td key={ca.template.id} className="py-2 text-right font-mono">
                          <span className="text-primary">{(share * 100).toFixed(1)}%</span>
                          {Math.abs(diff) > 0.005 && (
                            <span className={`ml-1 text-2xs ${diff > 0 ? 'text-green-500' : 'text-red-400'}`}>
                              {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EvidenceCallout title="Why this matters for ROI" type="success">
        By modelling 6 distinct archetypes instead of a single "participation rate",
        we show that a small group of steady movers and super-engagers (16% of the book)
        drives the majority of value. This is consistent with Discovery Vitality's
        13-year longitudinal data: 3× mortality differential between engaged and unengaged members.
      </EvidenceCallout>
    </ChapterLayout>
  );
}
