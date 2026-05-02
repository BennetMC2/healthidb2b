import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shield, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { fetchConsumerCampaignStatus } from '@/lib/consumerCampaigns';
import { formatTimestamp } from '@/utils/format';

const memberTypeLabels = {
  policyholder: 'Policyholder',
  dependent: 'Dependent',
  applicant: 'Applicant',
} as const;

const trendLabels = {
  improving: 'Improving',
  stable: 'Stable',
  watch: 'Watch closely',
} as const;

const rewardLabels = {
  none: 'No reward issued yet',
  earned: 'Reward earned',
  redeemed: 'Reward redeemed',
} as const;

const proofLabels = {
  none: 'No proof verified yet',
  verified: 'Private proof verified',
} as const;

export default function CampaignMemberDetail() {
  const { id, memberId } = useParams();
  const navigate = useNavigate();
  const campaign = useCampaignStore((s) => s.campaigns.find((entry) => entry.id === id));
  const updateB2CSync = useCampaignStore((s) => s.updateB2CSync);

  useEffect(() => {
    const externalCampaignId = campaign?.b2cSync?.externalCampaignId;
    const campaignId = campaign?.id;
    if (!externalCampaignId || !campaignId) return;
    const syncExternalCampaignId = externalCampaignId;
    const syncCampaignId = campaignId;

    let cancelled = false;
    async function loadConsumerStatus() {
      try {
        const status = await fetchConsumerCampaignStatus(syncExternalCampaignId);
        if (cancelled) return;
        updateB2CSync(syncCampaignId, {
          memberSummaries: status.memberSummaries,
          timeline: status.timeline,
          redemptionCount: status.redemptionCount,
          lastSyncedAt: new Date().toISOString(),
        });
      } catch {
        // Ignore sync errors on detail drill-down.
      }
    }

    void loadConsumerStatus();
    return () => {
      cancelled = true;
    };
  }, [campaign?.b2cSync?.externalCampaignId, campaign?.id, updateB2CSync]);

  if (!campaign || !memberId) {
    return <div className="flex h-full items-center justify-center text-secondary">Member record not found</div>;
  }

  const member = campaign.b2cSync?.memberSummaries?.find((entry) => entry.memberId === memberId);
  const timeline = (campaign.b2cSync?.timeline ?? []).filter((entry) => entry.memberId === memberId);

  if (!member) {
    return <div className="flex h-full items-center justify-center text-secondary">No anonymized member record available yet</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card-elevated border-accent/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <button onClick={() => navigate(`/campaigns/${campaign.id}`)} className="btn-ghost flex items-center gap-2 p-1">
              <ArrowLeft size={16} />
              Back to campaign
            </button>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent-muted px-3 py-1 text-2xs font-medium uppercase tracking-wide text-accent">
                Anonymized member record
              </span>
              <span className="rounded-full bg-hover px-3 py-1 text-2xs text-secondary">
                {memberTypeLabels[member.memberType]}
              </span>
              <span className="rounded-full bg-hover px-3 py-1 text-2xs text-secondary">
                {member.market}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-primary">{member.anonymizedId}</h1>
            <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-secondary">
              Insurer-safe member progression view. Only programme status, verification state, and reward delivery are shown here.
            </p>
          </div>
          <div className="card bg-surface/80 lg:w-[280px]">
            <div className="metric-label">Challenge state</div>
            <div className="mt-2 text-xl font-semibold text-primary capitalize">{member.challengeStatus}</div>
            <p className="mt-2 text-xs leading-relaxed text-tertiary">
              {proofLabels[member.proofStatus]} · {rewardLabels[member.rewardStatus]}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="card">
          <div className="metric-label">Coverage relationship</div>
          <div className="mt-2 flex items-center gap-2 text-primary">
            <Users size={14} />
            <span className="text-lg font-semibold">{memberTypeLabels[member.memberType]}</span>
          </div>
        </div>
        <div className="card">
          <div className="metric-label">Trend direction</div>
          <div className="mt-2 flex items-center gap-2 text-primary">
            <TrendingUp size={14} />
            <span className="text-lg font-semibold">{trendLabels[member.trend]}</span>
          </div>
        </div>
        <div className="card">
          <div className="metric-label">Data fidelity</div>
          <div className="mt-2 text-lg font-semibold capitalize text-primary">{member.fidelity}</div>
          <p className="mt-1 text-xs text-tertiary">{member.connectedSources.length} connected source{member.connectedSources.length === 1 ? '' : 's'}</p>
        </div>
        <div className="card">
          <div className="metric-label">Health band</div>
          <div className="mt-2 text-lg font-semibold capitalize text-primary">{member.healthBand}</div>
          <p className="mt-1 text-xs text-tertiary">Score {member.healthScore ?? 'n/a'}</p>
        </div>
        <div className="card">
          <div className="metric-label">Reward state</div>
          <div className="mt-2 flex items-center gap-2 text-primary">
            <Wallet size={14} />
            <span className="text-lg font-semibold">{member.rewardStatus === 'redeemed' ? 'Redeemed' : member.rewardStatus === 'earned' ? 'Earned' : 'Pending'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="card">
          <SectionHeader
            title="Member progression"
            description="The insurer sees progression states and verification movement, not biometric exhaust."
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface/80 px-4 py-3">
              <div className="text-2xs uppercase tracking-wide text-tertiary">Proof state</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
                <Shield size={14} className="text-success" />
                {proofLabels[member.proofStatus]}
              </div>
              {member.latestProofAt && (
                <p className="mt-2 text-xs text-tertiary">Latest proof at {formatTimestamp(member.latestProofAt)}</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface/80 px-4 py-3">
              <div className="text-2xs uppercase tracking-wide text-tertiary">Reward and redemption</div>
              <div className="mt-2 text-sm font-medium text-primary">{rewardLabels[member.rewardStatus]}</div>
              {member.latestRedemption ? (
                <p className="mt-2 text-xs leading-relaxed text-tertiary">
                  Latest redemption: {member.latestRedemption.item} with {member.latestRedemption.partner} for {member.latestRedemption.hpCost} HP.
                </p>
              ) : member.latestRewardAt ? (
                <p className="mt-2 text-xs text-tertiary">Reward issued at {formatTimestamp(member.latestRewardAt)}</p>
              ) : (
                <p className="mt-2 text-xs text-tertiary">No reward delivery has been recorded yet.</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface/80 px-4 py-3 md:col-span-2">
              <div className="text-2xs uppercase tracking-wide text-tertiary">Connected verification sources</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {member.connectedSources.length > 0 ? member.connectedSources.map((source) => (
                  <span key={source} className="rounded-full bg-hover px-3 py-1 text-2xs text-secondary">
                    {source}
                  </span>
                )) : (
                  <span className="text-xs text-tertiary">No connected sources are visible in the insurer-safe view yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sparkles size={13} className="text-accent" />
            <span className="text-xs font-medium text-secondary">Member activity record</span>
            <InfoTooltip content="Every event shown here is an insurer-safe state change originating in the member app." />
          </div>
          <div className="mt-3 space-y-3">
            {timeline.length > 0 ? timeline.map((event) => (
              <div key={event.id} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary">{event.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-secondary">{event.detail}</p>
                  </div>
                  <span className="text-2xs text-tertiary">{formatTimestamp(event.timestamp)}</span>
                </div>
              </div>
            )) : (
              <div className="text-xs text-tertiary">No activity has synced back for this member yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHeader
          title="Privacy receipt"
          description="This is the insurer-safe contract behind the member record."
        />
        <div className="rounded-xl bg-hover px-4 py-4 text-sm leading-relaxed text-secondary">
          HealthID shares state transitions, verification status, and reward delivery while keeping raw sleep, recovery, heart rate, and device-level records inside the member context.
        </div>
      </div>
    </div>
  );
}
