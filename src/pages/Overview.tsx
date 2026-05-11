import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CreditCard,
  Radar,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
  Waypoints,
} from 'lucide-react';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatNumber, formatPercent, formatRelativeTime } from '@/utils/format';
import { USE_CASE_LABELS } from '@/utils/constants';
import type { Campaign, CampaignMemberSummary } from '@/types';

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function ratio(numerator: number, denominator: number): number {
  return numerator / Math.max(denominator, 1);
}

export default function Overview() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading(300);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const allCampaigns = useCampaignStore((s) => s.campaigns);

  const campaigns = useMemo(
    () => allCampaigns.filter((campaign) => campaign.partnerId === currentPartner.id),
    [allCampaigns, currentPartner.id],
  );

  const overview = useMemo(() => {
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active');
    const reachableMembers = sum(campaigns, (campaign) => campaign.funnel.eligible);
    const invitedMembers = sum(campaigns, (campaign) => campaign.funnel.invited);
    const enrolledMembers = sum(campaigns, (campaign) => campaign.funnel.enrolled);
    const verifiedOutcomes = sum(campaigns, (campaign) => campaign.funnel.verified);
    const rewardedMembers = sum(campaigns, (campaign) => campaign.funnel.rewarded);
    const redemptionCount = sum(campaigns, (campaign) => campaign.b2cSync?.redemptionCount ?? 0);
    const rewardsBudget = sum(campaigns, (campaign) => campaign.rewards.budgetSpent);

    const memberSummaries = Array.from(
      campaigns
        .flatMap((campaign) =>
          (campaign.b2cSync?.memberSummaries ?? []).map((member) => ({
            ...member,
            campaignId: campaign.id,
            campaignName: campaign.name,
          })),
        )
        .reduce((map, member) => {
          const existing = map.get(member.memberId);
          const memberTimestamp = new Date(member.latestProofAt ?? member.latestRewardAt ?? 0).getTime();
          const existingTimestamp = existing
            ? new Date(existing.latestProofAt ?? existing.latestRewardAt ?? 0).getTime()
            : -1;

          if (!existing || memberTimestamp >= existingTimestamp) {
            map.set(member.memberId, member);
          }

          return map;
        }, new Map<string, CampaignMemberSummary & { campaignId: string; campaignName: string }>())
        .values(),
    );

    const activity = campaigns
      .flatMap((campaign) =>
        (campaign.b2cSync?.timeline ?? []).map((event) => ({
          ...event,
          campaignId: campaign.id,
          campaignName: campaign.name,
        })),
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const highTrustMembers = memberSummaries.filter((member) => member.fidelity === 'high').length;
    const improvingMembers = memberSummaries.filter((member) => member.trend === 'improving').length;
    const watchMembers = memberSummaries.filter((member) => member.trend === 'watch').length;

    const useCaseMix = Object.entries(
      campaigns.reduce<Record<string, number>>((acc, campaign) => {
        acc[campaign.useCase] = (acc[campaign.useCase] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([useCase, count]) => ({ useCase, count }))
      .sort((a, b) => b.count - a.count);

    const leadingUseCase = useCaseMix[0]?.useCase as Campaign['useCase'] | undefined;

    const leadingCampaign = [...campaigns].sort((a, b) => {
      const aScore = a.funnel.verified * 3 + a.funnel.rewarded * 2 + (a.b2cSync?.redemptionCount ?? 0);
      const bScore = b.funnel.verified * 3 + b.funnel.rewarded * 2 + (b.b2cSync?.redemptionCount ?? 0);
      return bScore - aScore;
    })[0];

    const weeklyWindow = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyActivity = activity.filter((event) => new Date(event.timestamp).getTime() >= weeklyWindow);

    return {
      activeCampaigns,
      reachableMembers,
      invitedMembers,
      enrolledMembers,
      verifiedOutcomes,
      rewardedMembers,
      redemptionCount,
      rewardsBudget,
      memberSummaries,
      activity,
      weeklyActivity,
      highTrustMembers,
      improvingMembers,
      watchMembers,
      leadingUseCase,
      leadingCampaign,
    };
  }, [campaigns]);

  const partnerAngle = useMemo(() => {
    if (currentPartner.tier === 'enterprise') {
      return {
        primary: 'Launch verified outcomes programmes across large APAC books without creating a raw-data custody problem.',
        secondary: 'This view should help a regional insurer connect wearable signal, proof receipts, and underwriting-value-backed rewards.',
      };
    }

    if (currentPartner.tier === 'professional') {
      return {
        primary: 'Operate a narrower but commercially legible underwriting and engagement loop with explicit proof and trust boundaries.',
        secondary: 'The focus here is not dashboard breadth. It is fast insurer adoption through campaigns that can be defended in front of risk, compliance, and distribution teams.',
      };
    }

    return {
      primary: 'Stand up a credible zero-custody insurer operating loop without pretending to be a full incumbent platform on day one.',
      secondary: 'The strongest path is a tight pilot wedge: reachable cohort, verified movement, and rewards funded by underwriting logic rather than marketing spend.',
    };
  }, [currentPartner.tier]);

  if (loading) {
    return (
      <div className="h-full overflow-auto scrollbar-thin">
        <div className="px-6 py-8 space-y-4 animate-pulse">
          <div className="skeleton h-40 rounded-xl" />
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton h-56 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="skeleton h-72 rounded-xl" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        <section className="card-elevated border-accent/15 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-60">
            <div className="absolute left-[-8%] top-[-18%] h-[260px] w-[260px] rounded-full bg-accent/12 blur-3xl" />
            <div className="absolute right-[-8%] bottom-[-24%] h-[240px] w-[240px] rounded-full bg-accent-secondary/12 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-[860px]">
              <div className="flex flex-wrap items-center gap-2 text-2xs uppercase tracking-[0.22em] text-accent/80">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Zero-custody insurer operating system
                <Badge variant="accent">{currentPartner.label}</Badge>
              </div>
              <h1 className="mt-3 text-[2rem] font-semibold leading-tight text-primary sm:text-[2.35rem]">
                Wearable signal becomes verifiable truth, insurer action, and rewards tied to underwriting value.
              </h1>
              <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-secondary">
                {partnerAngle.primary}
              </p>
              <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-tertiary">
                {partnerAngle.secondary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="accent">Data stays with the user</Badge>
                <Badge variant="success">Receipt-level verification</Badge>
                <Badge variant="default">Underwriting-funded rewards</Badge>
                <Badge variant="muted">Synthetic environment</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate('/campaigns/new')} className="btn-primary text-xs">
                Define outcome
              </button>
              <button onClick={() => navigate('/campaigns')} className="btn-ghost text-xs">
                Open execution
              </button>
              <button onClick={() => navigate('/compliance')} className="btn-ghost text-xs">
                Review trust boundary
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <MetricCard label="Active programmes" value={overview.activeCampaigns.length} icon={<Target size={14} />} />
          <MetricCard label="Reachable cohort" value={formatNumber(overview.reachableMembers)} icon={<Users size={14} />} />
          <MetricCard
            label="Verified outcomes"
            value={formatNumber(overview.verifiedOutcomes)}
            subValue={formatPercent(ratio(overview.verifiedOutcomes, overview.enrolledMembers))}
            icon={<Shield size={14} />}
          />
          <MetricCard
            label="High-trust members"
            value={formatNumber(overview.highTrustMembers)}
            subValue={formatPercent(ratio(overview.highTrustMembers, overview.memberSummaries.length))}
            icon={<Radar size={14} />}
          />
          <MetricCard
            label="Rewards released"
            value={formatNumber(overview.rewardedMembers)}
            subValue={formatCurrency(overview.rewardsBudget)}
            icon={<Wallet size={14} />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="card">
            <SectionHeader
              title="Operating Loop"
              description="The product should read as an insurer workflow, not as a generic dashboard."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {[
                {
                  title: 'Outcome',
                  description: 'Choose the insurer objective to drive: underwriting, claims reduction, renewal, or acquisition.',
                  icon: <Target size={14} className="text-accent" />,
                },
                {
                  title: 'Cohort',
                  description: `Shape a reachable population from ${formatNumber(overview.reachableMembers)} eligible members without pulling raw data into the insurer surface.`,
                  icon: <Users size={14} className="text-accent" />,
                },
                {
                  title: 'Intervention',
                  description: `${overview.activeCampaigns.length} live programmes convert that objective into a measurable insurer motion with incentives and cadence.`,
                  icon: <Activity size={14} className="text-accent" />,
                },
                {
                  title: 'Verification',
                  description: `${formatNumber(overview.verifiedOutcomes)} private receipts prove what happened without disclosing the underlying record.`,
                  icon: <Shield size={14} className="text-accent" />,
                },
                {
                  title: 'Decision',
                  description: 'Use verified movement to justify reward release, re-underwriting logic, or next-best action for the book.',
                  icon: <Waypoints size={14} className="text-accent" />,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    {item.icon}
                    {item.title}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-tertiary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader
              title="Why Now"
              description="Three external shifts make this commercially legible now rather than theoretical."
            />
            <div className="space-y-3">
              {[
                {
                  title: 'Wearables solved the signal layer',
                  description: 'VO2 max, HRV, sleep, glucose, and other longitudinal biomarkers are now cheap and ambient.',
                },
                {
                  title: 'ZK solved the trust layer',
                  description: 'Receipt-level verification can be delivered without turning insurers into custodians of raw health records.',
                },
                {
                  title: 'AI solved the interface layer',
                  description: 'Decision support can now sit on top of longitudinal truth instead of giving generic advice to a stateless user.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                  <div className="text-sm font-medium text-primary">{item.title}</div>
                  <p className="mt-2 text-xs leading-relaxed text-tertiary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card">
            <SectionHeader
              title="Current Book"
              description="Live seeded state from the current partner portfolio, framed around the product thesis rather than a raw activity feed."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Leading motion</div>
                <div className="mt-2 text-lg font-semibold text-primary">
                  {overview.leadingUseCase ? USE_CASE_LABELS[overview.leadingUseCase] : 'No active motion'}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  The live book should ultimately be organized around insurer outcomes, not around campaign volume alone.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Highest-performing programme</div>
                <div className="mt-2 text-lg font-semibold text-primary">
                  {overview.leadingCampaign?.name ?? 'No programme available'}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  {overview.leadingCampaign
                    ? `${formatNumber(overview.leadingCampaign.funnel.verified)} proofs and ${formatNumber(overview.leadingCampaign.funnel.rewarded)} reward events recorded so far.`
                    : 'Launch the first programme to establish verification and reward history.'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Activation</div>
                <div className="mt-2 text-lg font-semibold text-primary">
                  {formatPercent(ratio(overview.enrolledMembers, overview.invitedMembers || overview.reachableMembers))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  {formatNumber(overview.enrolledMembers)} members are actively in motion after invite and consent.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Reward value delivered</div>
                <div className="mt-2 text-lg font-semibold text-primary">
                  {formatNumber(overview.redemptionCount)} redemptions
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  Rewards should be sized to actuarial value created, not to a marketing coupon budget.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <SectionHeader
              title="Trust Labels"
              description="The deck and reset are right about this: the trust boundary has to be explicit on the main screen."
            />
            <div className="space-y-3">
              {[
                {
                  label: 'Verified in-product',
                  variant: 'success' as const,
                  description: `${formatNumber(overview.verifiedOutcomes)} receipt events, campaign progression, and reward-state changes inside the seeded environment.`,
                },
                {
                  label: 'Modeled',
                  variant: 'accent' as const,
                  description: 'Commercial upside, claims-reduction implications, and reward economics are directional scenario outputs rather than filed actuarial truth.',
                },
                {
                  label: 'Synthetic',
                  variant: 'warning' as const,
                  description: 'Member populations, proof events, and campaign timelines are internally consistent but still generated for demo use.',
                },
                {
                  label: 'Target-state architecture',
                  variant: 'default' as const,
                  description: 'Raw health data remains out of insurer-facing surfaces; the insurer receives proof receipts, verification metadata, and auditable decisions.',
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.variant}>{item.label}</Badge>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-tertiary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
          <div className="card">
            <SectionHeader
              title="Strategy Readout"
              description="What the current environment is saying about this partner right now."
            />
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <BrainCircuit size={14} className="text-accent" />
                  Suggested strategic reading
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  {overview.watchMembers > overview.improvingMembers
                    ? 'Watch-state members outnumber improving members, which suggests the next programme wave should emphasize source quality, re-engagement, and proof reliability before adding more rewards volume.'
                    : 'Improving members currently outnumber watch-state members, which suggests the book is ready for a stronger underwriting or claims-reduction narrative rather than a pure engagement story.'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CreditCard size={14} className="text-accent" />
                  Rewards posture
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  The consumer app linkage is most compelling when rewards are the output of verified insurer value, not a standalone loyalty layer. That is the bridge between the deck and the current product.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/70 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles size={14} className="text-accent" />
                  Product rule
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  If a feature does not increase trust in the signal, improve cohort quality, or support an insurer decision, it is probably supporting material rather than core product.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <SectionHeader
              title="Jump Into The System"
              description="The rest of the app still uses the existing shell, so Overview should route users into the most important operating surfaces."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: 'Campaign engine',
                  description: 'Review and launch interventions aligned to underwriting, claims, renewal, or acquisition goals.',
                  action: () => navigate('/campaigns'),
                },
                {
                  title: 'Member pool',
                  description: 'Inspect the reachable cohort and source-connectivity posture before designing the next programme.',
                  action: () => navigate('/explorer'),
                },
                {
                  title: 'Verification trail',
                  description: 'Open the receipt and proof surface that makes the trust story diligence-friendly.',
                  action: () => navigate('/compliance'),
                },
                {
                  title: 'Live member movement',
                  description: overview.activity[0]
                    ? `${overview.activity[0].title} · ${formatRelativeTime(overview.activity[0].timestamp)}`
                    : 'No recent activity available yet.',
                  action: () =>
                    overview.activity[0]
                      ? navigate(`/campaigns/${overview.activity[0].campaignId}/members/${overview.activity[0].memberId}`)
                      : navigate('/campaigns'),
                },
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="rounded-2xl border border-border bg-surface/70 px-4 py-4 text-left transition-colors hover:bg-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-primary">{item.title}</div>
                      <p className="mt-2 text-xs leading-relaxed text-tertiary">{item.description}</p>
                    </div>
                    <ArrowRight size={14} className="mt-0.5 text-tertiary" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
