import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  LineChart,
  Pause,
  Play,
  Shield,
  Skull,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { useToastStore } from '@/stores/useToastStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import KillCampaignModal from '@/components/campaigns/KillCampaignModal';
import ScaleCampaignModal from '@/components/campaigns/ScaleCampaignModal';
import {
  StatusBadge,
  TypeBadge,
  MetricBadge,
  ChallengeDisplay,
  DataSourceBadge,
} from '@/components/ui/Badge';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import CampaignTimeSeriesChart from '@/components/campaigns/CampaignTimeSeriesChart';
import ActuarialROICalculator from '@/components/campaigns/ActuarialROICalculator';
import B2CPreviewPane from '@/components/campaigns/B2CPreviewPane';
import BehaviorShiftEvidence from '@/components/campaigns/BehaviorShiftEvidence';
import LossRatioDelta from '@/components/campaigns/LossRatioDelta';
import { deleteConsumerCampaign, fetchConsumerCampaignStatus } from '@/lib/consumerCampaigns';
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatTimestamp,
} from '@/utils/format';
import { USE_CASE_LABELS } from '@/utils/constants';
import type { Campaign, StreamCampaign } from '@/types';

const funnelTooltips: Record<string, string> = {
  Eligible: 'Members matching campaign eligibility and source requirements.',
  Invited: 'Members who have been placed into the insurer programme.',
  Enrolled: 'Members with active consent and connected verification sources.',
  Verified: 'Binary outcome receipts successfully generated for the programme.',
  Rewarded: 'Members who have received the campaign incentive after a verified interval.',
};

function getCommercialModel(campaign: Campaign) {
  const isEngagement = campaign.name.toLowerCase().includes('device connection');

  if (campaign.useCase === 'acquisition') {
    return {
      signalLabel: 'Opt-in signal',
      signalDescription: 'Verified signup conversion across the anonymous open-pool campaign.',
      cards: {
        reachable: 'Anonymous Target Pool',
        activation: 'Opt-in Rate',
        verified: 'Verified Signups',
        signal: 'Acquisition Signal',
        value: 'Acquisition',
      },
      howItWorks:
        'The partner targets an anonymous HealthID segment. Identity stays hidden in Campaign Studio until a user consents to partner onboarding.',
      footer:
        'This campaign is measured on acquisition quality: verified signups, cost per consented onboarding, and projected acquired book value.',
    };
  }

  if (campaign.useCase === 'renewal' && !isEngagement) {
    return {
      signalLabel: 'Renewal signal',
      signalDescription: 'Verified engagement and readiness across the members approaching renewal.',
      cards: {
        reachable: 'Members At Renewal Risk',
        activation: 'Engagement Recovered',
        verified: 'Verified Streaks',
        signal: 'Renewal Signal',
        value: 'Retention',
      },
      howItWorks:
        'Members approaching renewal complete lightweight wearable proofs that restore engagement and reduce renewal friction.',
      footer:
        'This campaign is measured on retained book value, renewal lift, verified streaks, and member engagement recovery.',
    };
  }

  if (isEngagement) {
    return {
      signalLabel: 'Readiness signal',
      signalDescription: 'First-receipt conversion across dormant or single-source members.',
      cards: {
        reachable: 'Dormant Members',
        activation: 'Devices Connected',
        verified: 'First Receipts',
        signal: 'Readiness Signal',
        value: 'Engagement',
      },
      howItWorks:
        'Members connect a wearable and emit a first receipt, increasing source coverage for future signal-improvement campaigns.',
      footer:
        'This campaign is measured on device connections, first receipts, receipt growth, and future campaign readiness.',
    };
  }

  if (campaign.useCase === 'underwriting') {
    return {
      signalLabel: 'Underwriting signal',
      signalDescription: 'Proof completion across applicants screened without raw lab or health record custody.',
      cards: {
        reachable: 'Applicants Screened',
        activation: 'Proof Completion',
        verified: 'Eligible Receipts',
        signal: 'Lab Signal',
        value: 'Underwriting',
      },
      howItWorks:
        'Applicants generate a binary proof against the configured threshold. The partner receives the receipt, not the raw lab value.',
      footer:
        'This campaign is measured on underwriting efficiency, manual review avoided, eligible receipts, and proof completion.',
    };
  }

  return {
    signalLabel: 'Healthy-life signal',
    signalDescription: 'Verified behaviour-change conversion across the enrolled cohort.',
    cards: {
      reachable: 'Reachable Members',
      activation: 'Cohort Activated',
      verified: 'Verified Outcome',
      signal: 'Wearable Signal',
      value: 'Healthy-Life Value',
    },
    howItWorks:
      'Members continue using connected wearables as normal. Health Points are paid when the verified behaviour-change rule is met.',
    footer:
      'This campaign is measured on healthy-life value uplift, morbidity shift, payback, and Health Points ROI.',
  };
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showKillModal, setShowKillModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const updateStatus = useCampaignStore((s) => s.updateStatus);
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign);
  const updateBudgetCeiling = useCampaignStore((s) => s.updateBudgetCeiling);
  const updateB2CSync = useCampaignStore((s) => s.updateB2CSync);
  const allPartners = usePartnerStore((s) => s.allPartners);
  const loading = useSimulatedLoading(400);
  const campaign = useCampaignStore((s) => s.campaigns.find((c) => c.id === id));
  const externalCampaignId = campaign?.b2cSync?.externalCampaignId;
  const campaignId = campaign?.id;

  useEffect(() => {
    if (!externalCampaignId || !campaignId) return;

    let cancelled = false;
    const syncExternalCampaignId = externalCampaignId;
    const syncCampaignId = campaignId;

    async function loadConsumerStatus() {
      try {
        const status = await fetchConsumerCampaignStatus(syncExternalCampaignId);
        if (cancelled) return;
        updateB2CSync(syncCampaignId, {
          externalCampaignId: status.externalCampaignId,
          consumerCampaignId: status.consumerCampaignId,
          consumerAppUrl: status.memberAppUrl,
          dispatchStatus: status.dispatchStatus,
          eligibleUsers: status.eligibleUsers,
          inviteCount: status.inviteCount,
          acceptedCount: status.acceptedCount,
          verifiedCount: status.verifiedCount,
          rewardedCount: status.rewardedCount,
          proofOpportunityCreated: status.proofOpportunityCreated,
          lastDispatchAt: status.dispatchedAt,
          lastSyncedAt: new Date().toISOString(),
          lastError: status.error,
          memberSummaries: status.memberSummaries,
          timeline: status.timeline,
          redemptionCount: status.redemptionCount,
          channels: status.channels,
        });
      } catch {
        // Ignore consumer sync errors; the campaign still renders from local state.
      }
    }

    void loadConsumerStatus();

    return () => {
      cancelled = true;
    };
  }, [externalCampaignId, campaignId, updateB2CSync]);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-full text-secondary">
        Campaign not found
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full animate-pulse">
        <div className="skeleton h-28 rounded-xl" />
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
        <div className="flex-1 skeleton rounded-xl" />
      </div>
    );
  }

  const funnel = campaign.funnel;
  const commercialModel = getCommercialModel(campaign);
  const completionRate = funnel.verified / Math.max(funnel.enrolled, 1);
  const cohortActivation = funnel.enrolled / Math.max(funnel.eligible, 1);
  const budgetRemaining = Math.max(campaign.rewards.budgetCeiling - campaign.rewards.budgetSpent, 0);
  const funnelSteps = [
    { label: 'Eligible', value: funnel.eligible },
    { label: 'Invited', value: funnel.invited },
    { label: 'Enrolled', value: funnel.enrolled },
    { label: 'Verified', value: funnel.verified },
    { label: 'Rewarded', value: funnel.rewarded },
  ];
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);

  const partner = allPartners.find((entry) => entry.id === campaign.partnerId) ?? allPartners[0];
  const syncedMembers = campaign.b2cSync?.memberSummaries ?? [];
  const syncedTimeline = campaign.b2cSync?.timeline ?? [];
  const memberTypeLabels = {
    policyholder: 'Policyholder',
    dependent: 'Dependent',
    applicant: 'Applicant',
  } as const;
  const trendLabels = {
    improving: 'Improving',
    stable: 'Stable',
    watch: 'Watch',
  } as const;
  const rewardStateLabels = {
    none: 'No reward yet',
    earned: 'Reward earned',
    redeemed: 'Reward redeemed',
  } as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="card-elevated border-accent/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/app/campaigns')}
                className="btn-ghost p-1"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={campaign.type} />
                <StatusBadge status={campaign.status} />
                <span className="badge bg-elevated border-border text-secondary">{commercialModel.cards.value}</span>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-primary">{campaign.name}</h1>
            <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-secondary">
              {campaign.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-6 text-2xs text-tertiary">
              <span>Launched {formatDate(campaign.startDate)}</span>
              <span>
                {campaign.type === 'stream'
                  ? `${(campaign as StreamCampaign).streamDuration} day programme`
                  : 'Single verification event'}
              </span>
              <span>{campaign.targeting.regions?.join(' / ') || 'Broad market targeting'}</span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 lg:w-[270px]">
            <div className="card bg-surface/80">
              <div className="metric-label">{commercialModel.signalLabel}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="metric-value">{formatPercent(completionRate)}</span>
                <ArrowUpRight size={16} className="text-success" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-tertiary">
                {commercialModel.signalDescription}
              </p>
            </div>
            {campaign.status === 'active' && (
              <button
                onClick={() => setShowScaleModal(true)}
                className="btn-primary text-xs justify-center"
              >
                <TrendingUp size={12} />
                Scale Campaign
              </button>
            )}
            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <>
                <button
                  onClick={() => setShowPauseConfirm(true)}
                  className={`btn ${campaign.status === 'active'
                    ? 'bg-warning-muted text-warning border border-warning/20 hover:bg-warning-muted'
                    : 'bg-success-muted text-success border border-success/20 hover:bg-success-muted'
                  } text-2xs justify-center`}
                >
                  {campaign.status === 'active' ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
                </button>
                <button
                  onClick={() => setShowKillModal(true)}
                  className="btn-destructive text-xs justify-center"
                >
                  <Skull size={12} />
                  Kill Campaign
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showPauseConfirm && (
        <ConfirmDialog
          title={campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
          description={campaign.status === 'active'
            ? `Are you sure you want to pause "${campaign.name}"? No new verifications will be processed.`
            : `Resume "${campaign.name}"? Verification processing will restart.`
          }
          confirmLabel={campaign.status === 'active' ? 'Pause' : 'Resume'}
          onConfirm={() => {
            const newStatus = campaign.status === 'active' ? 'paused' as const : 'active' as const;
            updateStatus(campaign.id, newStatus);
            addToast({ message: `Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'}`, variant: 'success' });
            setShowPauseConfirm(false);
          }}
          onCancel={() => setShowPauseConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Campaign"
          description={`Delete "${campaign.name}" from Campaign Studio? This removes it from this workspace view.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={async () => {
            const externalCampaignId = campaign.b2cSync?.externalCampaignId ?? campaign.id;
            try {
              await deleteConsumerCampaign(externalCampaignId);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Consumer campaign delete failed';
              addToast({ message, variant: 'default' });
            }
            deleteCampaign(campaign.id);
            addToast({ message: 'Campaign deleted', variant: 'success' });
            setShowDeleteConfirm(false);
            navigate('/app/campaigns');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showKillModal && (
        <KillCampaignModal
          campaign={campaign}
          onConfirm={async () => {
            const externalCampaignId = campaign.b2cSync?.externalCampaignId ?? campaign.id;
            try {
              await deleteConsumerCampaign(externalCampaignId);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Consumer campaign delete failed';
              addToast({ message, variant: 'default' });
            }
            deleteCampaign(campaign.id);
            addToast({ message: 'Campaign killed and budget reallocated', variant: 'success' });
            setShowKillModal(false);
            navigate('/app/campaigns');
          }}
          onCancel={() => setShowKillModal(false)}
        />
      )}

      {showScaleModal && (
        <ScaleCampaignModal
          campaign={campaign}
          onConfirm={(newBudget) => {
            updateBudgetCeiling(campaign.id, newBudget);
            addToast({ message: `Budget updated to $${newBudget.toLocaleString()}`, variant: 'success' });
            setShowScaleModal(false);
          }}
          onCancel={() => setShowScaleModal(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <MetricCard label={commercialModel.cards.reachable} value={formatNumber(funnel.eligible)} icon={<Users size={14} />} />
        <MetricCard label={commercialModel.cards.activation} value={formatPercent(cohortActivation)} subValue={`${formatNumber(funnel.enrolled)} enrolled`} icon={<Activity size={14} />} />
        <MetricCard label={commercialModel.cards.verified} value={formatPercent(completionRate)} subValue={`${formatNumber(funnel.verified)} receipts`} icon={<Shield size={14} />} />
        <MetricCard label="Remaining Budget" value={formatCurrency(budgetRemaining)} subValue={`of ${formatCurrency(campaign.rewards.budgetCeiling)}`} icon={<Wallet size={14} />} />
        <MetricCard label={commercialModel.cards.signal} value={campaign.challenge.target} subValue={campaign.challenge.unit} icon={<LineChart size={14} />} />
        <MetricCard label="Business Motion" value={commercialModel.cards.value} />
      </div>

      <LossRatioDelta campaign={campaign} />

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <MetricBadge metric={campaign.challenge.metric} />
            <span className="text-xs text-secondary">{USE_CASE_LABELS[campaign.useCase]}</span>
          </div>
          <p className="text-sm text-secondary leading-relaxed mb-4">
            {campaign.purpose}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-2xs">
            <div>
              <span className="text-tertiary block mb-1">Verification rule</span>
              <ChallengeDisplay challenge={campaign.challenge} additionalChallenges={campaign.additionalChallenges} />
            </div>
            <div>
              <span className="text-tertiary block mb-1">Programme duration</span>
              <span className="text-secondary font-medium">
                {campaign.type === 'stream'
                  ? `${(campaign as StreamCampaign).streamDuration} days · ${(campaign as StreamCampaign).frequency}`
                  : campaign.endDate
                    ? `${formatDate(campaign.startDate)} — ${formatDate(campaign.endDate)}`
                    : `From ${formatDate(campaign.startDate)}`}
              </span>
            </div>
            <div>
              <span className="text-tertiary block mb-1">Targeting logic</span>
              <span className="text-secondary font-medium block">
                {[
                  campaign.targeting.regions?.length ? `${campaign.targeting.regions.length} market${campaign.targeting.regions.length > 1 ? 's' : ''}` : null,
                  campaign.targeting.ageRanges?.length ? campaign.targeting.ageRanges.join(', ') : null,
                  campaign.targeting.reputationTiers?.length ? campaign.targeting.reputationTiers.join('/') + ' trust' : null,
                ].filter(Boolean).join(' · ') || 'Open pool'}
              </span>
              {campaign.targeting.dataSources && campaign.targeting.dataSources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {campaign.targeting.dataSources.map((s) => (
                    <DataSourceBadge key={s} source={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <SectionHeader
            title="How this campaign works"
            description="Operating summary of how the programme runs."
          />
          <div className="space-y-3 text-xs text-secondary leading-relaxed">
            <p>
              {commercialModel.howItWorks}
            </p>
            <p>
              The partner receives cohort movement, verification evidence, and reward status without taking custody of raw health data.
            </p>
            <p className="rounded-xl bg-hover px-3 py-3 text-tertiary">
              {commercialModel.footer}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampaignTimeSeriesChart campaignId={campaign.id} />
        <ActuarialROICalculator
          metric={campaign.challenge.metric}
          type={campaign.type}
          useCase={campaign.useCase}
          maxParticipants={funnel.enrolled}
          budgetCeiling={campaign.rewards.budgetCeiling}
        />
      </div>

      <BehaviorShiftEvidence campaign={campaign} />

      <div className="flex flex-col 2xl:flex-row gap-4">
        <div className="card w-full 2xl:w-[300px] flex-shrink-0">
          <SectionHeader
            title="Activation funnel"
            description="Follow the programme from reachable cohort through to verified outcome delivery."
          />
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-secondary">{step.label}</span>
                    <InfoTooltip content={funnelTooltips[step.label]} />
                  </div>
                  <span className="text-xs font-mono text-secondary">
                    {formatNumber(step.value)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
                    style={{ width: `${Math.max(6, Math.sqrt(step.value / maxFunnel) * 100)}%` }}
                  />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="text-2xs text-tertiary text-right mt-1">
                    {formatPercent(funnelSteps[i + 1].value / Math.max(step.value, 1))} conversion
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 card p-0 flex flex-col" data-walkthrough="verification-feed">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sparkles size={13} className="text-accent" />
            <span className="text-xs font-medium text-secondary">
              Live member activity
            </span>
            <span className="text-2xs text-tertiary font-mono">
              {syncedTimeline.length} events
            </span>
            <InfoTooltip content="Member-side actions flowing back from HealthID: accepts, proofs, rewards, and redemptions without revealing raw health records." />
          </div>
          <div>
            {syncedTimeline.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/app/campaigns/${campaign.id}/members/${event.memberId}`)}
                className="w-full flex items-center gap-3 px-4 py-2 border-b border-border/50 hover:bg-hover/70 transition-colors cursor-pointer text-left"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  event.type === 'proof_verified' || event.type === 'reward_issued' || event.type === 'reward_redeemed'
                    ? 'bg-success'
                    : event.type === 'accepted'
                    ? 'bg-warning'
                    : 'bg-accent'
                }`} />
                <span className="text-2xs text-tertiary w-[76px] sm:w-[120px] flex-shrink-0 truncate">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className="text-2xs font-medium text-secondary w-[92px] flex-shrink-0 truncate">
                  {event.anonymizedId}
                </span>
                <span className="text-2xs text-secondary flex-1 min-w-0 truncate">
                  {event.title}
                </span>
                <span className="hidden md:block text-2xs text-tertiary w-[180px] text-right flex-shrink-0 truncate">
                  {event.detail}
                </span>
              </button>
            ))}
            {syncedTimeline.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-tertiary">
                No member activity synced yet
              </div>
            )}
          </div>
        </div>

        <div className="w-full 2xl:w-auto">
          <B2CPreviewPane campaign={campaign} partner={partner} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-4">
        <div className="card">
          <SectionHeader
            title="Anonymized member statuses"
            description="Insurer-safe view of who has progressed, verified, and redeemed value."
          />
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => navigate(`/app/cohorts?campaignId=${campaign.id}`)}
              className="btn-ghost text-xs"
            >
              Open in Cohorts
            </button>
          </div>
          <div className="space-y-3">
            {syncedMembers.length > 0 ? syncedMembers.map((member) => (
              <button
                key={member.memberId}
                onClick={() => navigate(`/app/campaigns/${campaign.id}/members/${member.memberId}`)}
                className="w-full rounded-xl border border-border bg-surface/80 px-4 py-3 text-left transition-colors hover:bg-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{member.anonymizedId}</span>
                      <span className="rounded-full bg-hover px-2 py-0.5 text-2xs text-secondary">
                        {memberTypeLabels[member.memberType]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-secondary">
                      {trendLabels[member.trend]} · {member.fidelity} fidelity · {member.connectedSources.length} sources
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xs text-tertiary">{rewardStateLabels[member.rewardStatus]}</p>
                    <p className="mt-1 text-xs font-medium text-secondary capitalize">{member.challengeStatus}</p>
                  </div>
                </div>
              </button>
            )) : (
              <div className="text-xs text-tertiary">No anonymized member states available yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <SectionHeader
            title="Campaign analyst"
            description="Summary generated from live member-side movement."
          />
          <div className="space-y-3 text-xs leading-relaxed text-secondary">
            <p>
              {syncedMembers.filter((member) => member.challengeStatus !== 'invited').length} members have moved beyond invitation, with {syncedMembers.filter((member) => member.proofStatus === 'verified').length} already producing verification-backed outcomes.
            </p>
            <p>
              {campaign.b2cSync?.redemptionCount ?? 0} redemptions have been recorded so far, showing value delivery beyond point issuance alone.
            </p>
            <p className="rounded-xl bg-hover px-3 py-3 text-tertiary">
              Members are guided privately in HealthID, the insurer sees verified movement only, and rewards can be traced through to redemption.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
