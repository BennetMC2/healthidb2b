import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Radio,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { StatusBadge, TypeBadge, UseCaseBadge } from '@/components/ui/Badge';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '@/utils/format';
import { USE_CASE_LABELS } from '@/utils/constants';
import type { Campaign, CampaignMemberSummary } from '@/types';

type PortfolioQualityMetric = {
  label: string;
  value: string;
  note: string;
  tone?: 'default' | 'success' | 'warning';
};

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

  const portfolio = useMemo(() => {
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active');
    const reachableMembers = sum(campaigns, (campaign) => campaign.funnel.eligible);
    const invitedMembers = sum(campaigns, (campaign) => campaign.funnel.invited);
    const enrolledMembers = sum(campaigns, (campaign) => campaign.funnel.enrolled);
    const verifiedOutcomes = sum(campaigns, (campaign) => campaign.funnel.verified);
    const rewardedMembers = sum(campaigns, (campaign) => campaign.funnel.rewarded);
    const redemptionCount = sum(campaigns, (campaign) => campaign.b2cSync?.redemptionCount ?? 0);
    const budgetIssued = sum(campaigns, (campaign) => campaign.rewards.budgetSpent);

    const activity = campaigns
      .flatMap((campaign) =>
        (campaign.b2cSync?.timeline ?? []).map((event) => ({
          ...event,
          campaignId: campaign.id,
          campaignName: campaign.name,
        })),
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyActivity = activity.filter((event) => new Date(event.timestamp).getTime() >= weekAgo);

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

    const qualityMetrics: PortfolioQualityMetric[] = [
      {
        label: 'Activation',
        value: formatPercent(ratio(enrolledMembers, invitedMembers || reachableMembers)),
        note: `${formatNumber(enrolledMembers)} members actively progressing through a programme.`,
        tone: ratio(enrolledMembers, invitedMembers || reachableMembers) >= 0.35 ? 'success' : 'default',
      },
      {
        label: 'Verification',
        value: formatPercent(ratio(verifiedOutcomes, enrolledMembers)),
        note: `${formatNumber(verifiedOutcomes)} private receipts issued across live cohorts.`,
        tone: ratio(verifiedOutcomes, enrolledMembers) >= 0.45 ? 'success' : 'default',
      },
      {
        label: 'Redemption',
        value: formatPercent(ratio(redemptionCount, rewardedMembers)),
        note: `${formatNumber(redemptionCount)} rewards converted into member value.`,
        tone: ratio(redemptionCount, rewardedMembers) >= 0.3 ? 'success' : 'warning',
      },
      {
        label: 'Signal quality',
        value: formatPercent(
          ratio(
            memberSummaries.filter((member) => member.fidelity === 'high').length,
            memberSummaries.length,
          ),
        ),
        note: `${formatNumber(memberSummaries.filter((member) => member.fidelity !== 'low').length)} members have medium or high source confidence.`,
      },
    ];

    const programmesNeedingAttention = campaigns
      .filter((campaign) => {
        const activation = ratio(campaign.funnel.enrolled, campaign.funnel.invited || campaign.funnel.eligible);
        const verification = ratio(campaign.funnel.verified, campaign.funnel.enrolled);
        return Boolean(campaign.b2cSync?.lastError) || activation < 0.15 || verification < 0.2;
      })
      .sort((a, b) => {
        const aError = a.b2cSync?.lastError ? 1 : 0;
        const bError = b.b2cSync?.lastError ? 1 : 0;
        return bError - aError;
      })
      .slice(0, 4);

    const topProgrammes = [...campaigns]
      .sort((a, b) => {
        const aScore = a.funnel.verified * 3 + a.funnel.rewarded * 2 + (a.b2cSync?.redemptionCount ?? 0);
        const bScore = b.funnel.verified * 3 + b.funnel.rewarded * 2 + (b.b2cSync?.redemptionCount ?? 0);
        return bScore - aScore;
      })
      .slice(0, 5);

    const policyholderCount = memberSummaries.filter((member) => member.memberType === 'policyholder').length;
    const dependentCount = memberSummaries.filter((member) => member.memberType === 'dependent').length;
    const applicantCount = memberSummaries.filter((member) => member.memberType === 'applicant').length;
    const watchCount = memberSummaries.filter((member) => member.trend === 'watch').length;
    const improvingCount = memberSummaries.filter((member) => member.trend === 'improving').length;

    const useCaseMix = Object.entries(
      campaigns.reduce<Record<string, number>>((acc, campaign) => {
        acc[campaign.useCase] = (acc[campaign.useCase] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([useCase, count]) => ({ useCase, count }))
      .sort((a, b) => b.count - a.count);

    const redemptionPartners = memberSummaries
      .map((member) => member.latestRedemption?.partner)
      .filter((partner): partner is string => Boolean(partner))
      .reduce<Record<string, number>>((acc, partner) => {
        acc[partner] = (acc[partner] ?? 0) + 1;
        return acc;
      }, {});

    const topRedemptionPartner = Object.entries(redemptionPartners).sort((a, b) => b[1] - a[1])[0]?.[0];
    const strongestProgramme = topProgrammes[0];

    let analystSummary = 'Portfolio activity is building, but more live proof volume is needed before programme performance can be compared confidently.';
    if (strongestProgramme) {
      const strongestVerificationRate = ratio(
        strongestProgramme.funnel.verified,
        strongestProgramme.funnel.enrolled,
      );
      analystSummary = `${strongestProgramme.name} is currently the leading programme, with ${formatPercent(strongestVerificationRate)} verification across enrolled members.`;

      if (topRedemptionPartner) {
        analystSummary += ` Redemption is concentrating in ${topRedemptionPartner}, which suggests members are responding best to premium travel-led rewards.`;
      }

      if (watchCount > 0) {
        analystSummary += ` ${formatNumber(watchCount)} members are in a watch state and should be reviewed for re-engagement or source issues.`;
      }
    }

    return {
      activeCampaigns,
      reachableMembers,
      invitedMembers,
      enrolledMembers,
      verifiedOutcomes,
      rewardedMembers,
      redemptionCount,
      budgetIssued,
      activity,
      weeklyActivity,
      memberSummaries,
      qualityMetrics,
      programmesNeedingAttention,
      topProgrammes,
      policyholderCount,
      dependentCount,
      applicantCount,
      watchCount,
      improvingCount,
      useCaseMix,
      analystSummary,
    };
  }, [campaigns]);

  if (loading) {
    return (
      <div className="h-full overflow-auto scrollbar-thin">
        <div className="px-6 py-8 space-y-4 animate-pulse">
          <div className="skeleton h-32 rounded-xl" />
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="skeleton h-64 rounded-xl" />
            <div className="skeleton h-64 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
            <div className="skeleton h-[360px] rounded-xl" />
            <div className="skeleton h-[360px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const recentAccepted = portfolio.weeklyActivity.filter((event) => event.type === 'accepted').length;
  const recentProofs = portfolio.weeklyActivity.filter((event) => event.type === 'proof_verified').length;
  const recentRewards = portfolio.weeklyActivity.filter((event) => event.type === 'reward_issued').length;
  const recentRedemptions = portfolio.weeklyActivity.filter((event) => event.type === 'reward_redeemed').length;

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        <section className="card-elevated border-accent/15">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-[780px]">
              <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.22em] text-accent/80">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Portfolio overview
              </div>
              <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-primary">
                Command center for verified member programmes.
              </h1>
              <p className="mt-3 max-w-[680px] text-sm leading-relaxed text-secondary">
                Monitor activation, verification, reward delivery, and redemption across the {currentPartner.label} portfolio. This page is designed for quick operating review, not campaign setup.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate('/campaigns/new')} className="btn-primary text-xs">
                Launch programme
              </button>
              <button onClick={() => navigate('/campaigns')} className="btn-ghost text-xs">
                Review campaigns
              </button>
              <button onClick={() => navigate('/explorer')} className="btn-ghost text-xs">
                Open member pool
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <MetricCard label="Active programmes" value={portfolio.activeCampaigns.length} icon={<Radio size={14} />} />
          <MetricCard label="Reachable members" value={formatNumber(portfolio.reachableMembers)} icon={<Users size={14} />} />
          <MetricCard label="Enrolled members" value={formatNumber(portfolio.enrolledMembers)} subValue={formatPercent(ratio(portfolio.enrolledMembers, portfolio.invitedMembers || portfolio.reachableMembers))} icon={<Activity size={14} />} />
          <MetricCard label="Verified outcomes" value={formatNumber(portfolio.verifiedOutcomes)} subValue={formatPercent(ratio(portfolio.verifiedOutcomes, portfolio.enrolledMembers))} icon={<Shield size={14} />} />
          <MetricCard label="Rewards redeemed" value={formatNumber(portfolio.redemptionCount)} subValue={formatCurrency(portfolio.budgetIssued)} icon={<Wallet size={14} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card">
            <SectionHeader
              title="What changed this week"
              description="Cross-programme member movement and reward conversion in the last seven days."
            />
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Challenge accepts',
                  value: formatNumber(recentAccepted),
                  note: 'Members moved from invite to active consent.',
                },
                {
                  label: 'Proofs issued',
                  value: formatNumber(recentProofs),
                  note: 'Private verification receipts completed.',
                },
                {
                  label: 'Rewards released',
                  value: formatNumber(recentRewards),
                  note: 'Members qualified for programme incentives.',
                },
                {
                  label: 'Redemptions completed',
                  value: formatNumber(recentRedemptions),
                  note: 'Member value delivered through the reward layer.',
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface/70 px-4 py-3">
                  <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-primary font-display">{item.value}</div>
                  <p className="mt-1 text-xs leading-relaxed text-tertiary">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader
              title="Portfolio quality"
              description="Operating quality across activation, verification, redemption, and signal confidence."
            />
            <div className="space-y-3">
              {portfolio.qualityMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-surface/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-primary">{metric.label}</div>
                      <p className="mt-1 text-xs leading-relaxed text-tertiary">{metric.note}</p>
                    </div>
                    <div className={`text-xl font-semibold font-display ${
                      metric.tone === 'success' ? 'text-success' : metric.tone === 'warning' ? 'text-warning' : 'text-primary'
                    }`}>
                      {metric.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-4">
          <div className="card">
            <SectionHeader
              title="Programme leaderboard"
              description="Top live programmes ranked by verified movement, rewards released, and member follow-through."
            />
            <div className="space-y-3">
              {portfolio.topProgrammes.map((campaign) => {
                const activation = ratio(campaign.funnel.enrolled, campaign.funnel.invited || campaign.funnel.eligible);
                const verification = ratio(campaign.funnel.verified, campaign.funnel.enrolled);
                const redemption = ratio(campaign.b2cSync?.redemptionCount ?? 0, campaign.funnel.rewarded);

                return (
                  <button
                    key={campaign.id}
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    className="w-full rounded-xl border border-border bg-surface/70 px-4 py-4 text-left transition-colors hover:bg-hover"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{campaign.name}</span>
                          <TypeBadge type={campaign.type} />
                          <UseCaseBadge useCase={campaign.useCase} />
                          <StatusBadge status={campaign.status} />
                        </div>
                        <p className="mt-2 max-w-[720px] text-xs leading-relaxed text-secondary">
                          {campaign.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-2xs text-tertiary">
                          <span>{formatNumber(campaign.funnel.invited)} invited</span>
                          <span>{formatNumber(campaign.funnel.enrolled)} enrolled</span>
                          <span>{formatNumber(campaign.funnel.verified)} verified</span>
                          <span>{formatNumber(campaign.b2cSync?.redemptionCount ?? 0)} redeemed</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 lg:w-[280px]">
                        {[
                          { label: 'Activation', value: formatPercent(activation) },
                          { label: 'Verification', value: formatPercent(verification) },
                          { label: 'Redemption', value: formatPercent(redemption) },
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg border border-border bg-base px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-tertiary">{item.label}</div>
                            <div className="mt-1 text-sm font-semibold text-primary">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card">
              <SectionHeader
                title="Analyst view"
                description="Portfolio-level summary generated from live programme movement."
                icon={<Sparkles size={16} />}
              />
              <div className="rounded-xl border border-accent/15 bg-accent-muted/30 px-4 py-4">
                <p className="text-sm leading-relaxed text-secondary">{portfolio.analystSummary}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-border bg-surface/70 px-3 py-3">
                  <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Policyholders</div>
                  <div className="mt-2 text-xl font-semibold text-primary font-display">{formatNumber(portfolio.policyholderCount)}</div>
                </div>
                <div className="rounded-xl border border-border bg-surface/70 px-3 py-3">
                  <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Improving</div>
                  <div className="mt-2 text-xl font-semibold text-success font-display">{formatNumber(portfolio.improvingCount)}</div>
                </div>
                <div className="rounded-xl border border-border bg-surface/70 px-3 py-3">
                  <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Watch</div>
                  <div className="mt-2 text-xl font-semibold text-warning font-display">{formatNumber(portfolio.watchCount)}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <SectionHeader
                title="Attention required"
                description="Programmes with low activation, weak verification, or sync issues."
                icon={<AlertTriangle size={16} />}
              />
              <div className="space-y-3">
                {portfolio.programmesNeedingAttention.length === 0 ? (
                  <div className="rounded-xl border border-border bg-surface/70 px-4 py-4 text-sm text-tertiary">
                    No material issues flagged across the current programme set.
                  </div>
                ) : (
                  portfolio.programmesNeedingAttention.map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="w-full rounded-xl border border-border bg-surface/70 px-4 py-3 text-left transition-colors hover:bg-hover"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-primary">{campaign.name}</div>
                          <p className="mt-1 text-xs leading-relaxed text-tertiary">
                            {campaign.b2cSync?.lastError
                              ? campaign.b2cSync.lastError
                              : `Activation ${formatPercent(ratio(campaign.funnel.enrolled, campaign.funnel.invited || campaign.funnel.eligible))} · verification ${formatPercent(ratio(campaign.funnel.verified, campaign.funnel.enrolled))}`}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-tertiary" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-4">
          <div className="card">
            <SectionHeader
              title="Live member activity"
              description="Recent cross-app movement from the member experience into insurer-visible programme state."
            />
            <div className="space-y-3">
              {portfolio.activity.slice(0, 8).map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate(`/campaigns/${event.campaignId}/members/${event.memberId}`)}
                  className="w-full rounded-xl border border-border bg-surface/70 px-4 py-3 text-left transition-colors hover:bg-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-primary">{event.title}</span>
                        <span className="rounded-full bg-hover px-2 py-0.5 text-2xs text-secondary">
                          {event.campaignName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-secondary">{event.detail}</p>
                      <p className="mt-1 text-2xs text-tertiary">
                        {event.anonymizedId} · {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-tertiary" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card">
              <SectionHeader
                title="Programme mix"
                description="Current book split by operating motion and insurer member relationship."
              />
              <div className="space-y-3">
                {portfolio.useCaseMix.map((entry) => (
                  <div key={entry.useCase} className="rounded-xl border border-border bg-surface/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-primary">{USE_CASE_LABELS[entry.useCase as Campaign['useCase']]}</div>
                      <div className="text-sm font-semibold text-primary font-display">{entry.count}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
                  <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Dependents</div>
                  <div className="mt-2 text-xl font-semibold text-primary font-display">{formatNumber(portfolio.dependentCount)}</div>
                </div>
                <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
                  <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Applicants</div>
                  <div className="mt-2 text-xl font-semibold text-primary font-display">{formatNumber(portfolio.applicantCount)}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <SectionHeader
                title="Next actions"
                description="Suggested jumps for portfolio review and execution."
              />
              <div className="space-y-2">
                {[
                  {
                    label: 'Review campaigns with live verification',
                    action: () => navigate('/campaigns'),
                  },
                  {
                    label: 'Open campaign-linked member pool',
                    action: () => navigate('/explorer'),
                  },
                  {
                    label: 'Inspect verification trail and proof receipts',
                    action: () => navigate('/compliance'),
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-surface/70 px-4 py-3 text-left text-sm text-primary transition-colors hover:bg-hover"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={14} className="text-tertiary" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
