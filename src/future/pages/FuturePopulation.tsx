import { Radar, ShieldCheck, Users, Watch } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { identities } from '@/data';
import { FutureHero, FuturePanel } from '../FuturePrimitives';
import { formatCompact } from '@/utils/format';

const cohortSlices = [
  { name: 'Cardiometabolic Watchlist', lives: '8.4k', fit: 'High intervention fit', note: 'High claims relevance with moderate wearable coverage.' },
  { name: 'Active Prevention Cohort', lives: '11.2k', fit: 'Strong engagement fit', note: 'Good for sleep, RHR, and VO2-oriented recovery campaigns.' },
  { name: 'Underwriting-Ready Applicants', lives: '5.1k', fit: 'Fast underwriting path', note: 'High-trust, lab-enabled, easier to explain to buyers.' },
];

export default function FuturePopulation() {
  const highTrust = identities.filter((identity) => identity.reputationTier === 'high').length;
  const labEnabled = identities.filter((identity) => identity.connectedSources.includes('lab_results')).length;
  const verificationReady = identities.filter((identity) => identity.verificationCount > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <FutureHero
        eyebrow="Risk And Reach"
        title="Population should feel like an insurer reach-and-fit engine, not a spreadsheet of members."
        description="The product should show which lives are reachable, which are intervention-worthy, and which create the best fit for claims reduction versus underwriting-adjacent motions."
        badges={['Reachable lives', 'Verification readiness', 'Commercial fit']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Reachable Lives" value={formatCompact(identities.length)} icon={<Users size={14} />} />
        <MetricCard label="High-Trust Lives" value={formatCompact(highTrust)} icon={<ShieldCheck size={14} />} />
        <MetricCard label="Verification-Ready" value={formatCompact(verificationReady)} icon={<Radar size={14} />} />
        <MetricCard label="Lab-Enabled Lives" value={formatCompact(labEnabled)} icon={<Watch size={14} />} />
      </div>

      <FuturePanel
        title="What this workspace should optimize for"
        description="Population should not just be about filtering. It should help the insurer understand intervention yield, verification readiness, and decision quality before launch."
      >
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className="rounded-2xl border border-border bg-hover/35 px-4 py-4">
            <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Decision questions</div>
            <div className="mt-3 space-y-3 text-sm text-secondary">
              <div>Who can we actually reach with enough signal quality to matter?</div>
              <div>Which cohort creates the strongest claims-reduction hypothesis?</div>
              <div>Which adjacent underwriting path is easier to sell if the buyer is skeptical?</div>
              <div>Where are we overfitting to engagement rather than insurer value?</div>
            </div>
          </div>
          <div className="space-y-3">
            {cohortSlices.map((slice) => (
              <div key={slice.name} className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-primary">{slice.name}</div>
                    <div className="mt-1 text-xs text-tertiary">{slice.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-accent font-mono">{slice.lives}</div>
                    <div className="text-2xs text-tertiary">{slice.fit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FuturePanel>

      <SectionHeader
        title="Design Rule"
        description="A great population workspace tells the insurer who to target and why, not just who matches the filters."
      />
    </div>
  );
}
