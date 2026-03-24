import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Pause, Play } from 'lucide-react';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { verifications } from '@/data';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { useToastStore } from '@/stores/useToastStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { StatusBadge, TypeBadge, ProofBadge, UseCaseBadge, MetricBadge, ChallengeDisplay, DataSourceBadge } from '@/components/ui/Badge';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import ProofAnimation from '@/components/campaigns/ProofAnimation';
import CampaignTimeSeriesChart from '@/components/campaigns/CampaignTimeSeriesChart';
import B2CPreviewPane from '@/components/campaigns/B2CPreviewPane';
import { formatNumber, formatCurrency, formatPercent, formatDate, formatHash, formatTimestamp, formatDuration } from '@/utils/format';
import { USE_CASE_LABELS, formatOperator } from '@/utils/constants';
import { useDemoStore } from '@/stores/useDemoStore';
import type { VerificationReceipt, VerificationStatus, StreamCampaign } from '@/types';

const funnelTooltips: Record<string, string> = {
  Eligible: 'Identities matching targeting criteria in the Open Pool.',
  Invited: 'Proof requests sent to eligible identities.',
  Enrolled: 'Opted in and data source connection confirmed.',
  Verified: 'ZK proof generated and cryptographically validated.',
  Rewarded: 'Health Points distributed for verified proofs.',
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedReceipt, setSelectedReceipt] = useState<VerificationReceipt | null>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const demoActive = useDemoStore((s) => s.isActive);
  const notifyUserAction = useDemoStore((s) => s.notifyUserAction);
  const addToast = useToastStore((s) => s.addToast);
  const updateStatus = useCampaignStore((s) => s.updateStatus);
  const loading = useSimulatedLoading(400);
  const campaign = useCampaignStore((s) => s.campaigns.find((c) => c.id === id));

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
        <div className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded" />
          <div className="skeleton h-6 w-64" />
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
        <div className="flex-1 skeleton rounded" />
      </div>
    );
  }

  const campaignVerifications = verifications
    .filter((v) => v.campaignId === campaign.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const funnel = campaign.funnel;
  const funnelSteps = [
    { label: 'Eligible', value: funnel.eligible },
    { label: 'Invited', value: funnel.invited },
    { label: 'Enrolled', value: funnel.enrolled },
    { label: 'Verified', value: funnel.verified },
    { label: 'Rewarded', value: funnel.rewarded },
  ];
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);

  const statusColors: Record<VerificationStatus, string> = {
    pending: 'text-warning',
    verified: 'text-success',
    failed: 'text-error',
    expired: 'text-tertiary',
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/campaigns')}
          className="btn-ghost p-1"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-primary">{campaign.name}</h1>
            <TypeBadge type={campaign.type} />
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-tertiary mt-0.5">
            {campaign.description} &middot; {formatDate(campaign.startDate)}
            {campaign.endDate && ` — ${formatDate(campaign.endDate)}`}
          </p>
        </div>
        {/* Operational Controls */}
        {(campaign.status === 'active' || campaign.status === 'paused') && (
          <button
            onClick={() => setShowPauseConfirm(true)}
            className={`btn-ghost text-xs flex items-center gap-1 ${campaign.status === 'active' ? 'text-warning' : 'text-success'}`}
          >
            {campaign.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
          </button>
        )}
      </div>

      {/* Pause/Resume Confirm Dialog */}
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

      {/* Purpose & Characteristics */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <UseCaseBadge useCase={campaign.useCase} />
          <span className="text-xs text-secondary">{USE_CASE_LABELS[campaign.useCase]}</span>
        </div>
        <p className="text-xs text-secondary leading-relaxed mb-3">
          {campaign.purpose}
        </p>
        <div className="grid grid-cols-3 gap-3 text-2xs">
          <div>
            <span className="text-tertiary block mb-0.5">Challenge</span>
            <ChallengeDisplay challenge={campaign.challenge} additionalChallenges={campaign.additionalChallenges} />
          </div>
          <div>
            <span className="text-tertiary block mb-0.5">Duration</span>
            <span className="text-secondary font-medium">
              {campaign.type === 'stream'
                ? `${(campaign as StreamCampaign).streamDuration} days · ${(campaign as StreamCampaign).frequency}`
                : campaign.endDate
                  ? `${formatDate(campaign.startDate)} — ${formatDate(campaign.endDate)}`
                  : `From ${formatDate(campaign.startDate)}`}
            </span>
          </div>
          <div>
            <span className="text-tertiary block mb-0.5">Targeting</span>
            <span className="text-secondary font-medium block">
              {[
                campaign.targeting.regions?.length ? `${campaign.targeting.regions.length} region${campaign.targeting.regions.length > 1 ? 's' : ''}` : null,
                campaign.targeting.ageRanges?.length ? campaign.targeting.ageRanges.join(', ') : null,
                campaign.targeting.reputationTiers?.length ? campaign.targeting.reputationTiers.join('/') + ' trust' : null,
              ].filter(Boolean).join(' · ') || 'Open pool'}
            </span>
            {campaign.targeting.dataSources && campaign.targeting.dataSources.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.targeting.dataSources.map((s) => (
                  <DataSourceBadge key={s} source={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Enrolled" value={formatNumber(funnel.enrolled)} />
        <MetricCard label="Verified" value={formatNumber(funnel.verified)} />
        <MetricCard
          label="Verification Rate"
          value={formatPercent(funnel.verified / Math.max(funnel.enrolled, 1))}
        />
        <MetricCard
          label="Budget Used"
          value={formatCurrency(campaign.rewards.budgetSpent)}
          subValue={`of ${formatCurrency(campaign.rewards.budgetCeiling)}`}
        />
        <div className="card flex flex-col gap-1.5">
          <span className="metric-label">Challenge</span>
          <MetricBadge metric={campaign.challenge.metric} />
          <span className="text-2xs font-mono text-tertiary">
            {formatOperator(campaign.challenge.operator)} {campaign.challenge.target} {campaign.challenge.unit}
          </span>
        </div>
      </div>

      {/* Time-Series Chart */}
      <CampaignTimeSeriesChart campaignId={campaign.id} />

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Funnel */}
        <div className="card w-[280px] flex-shrink-0">
          <SectionHeader
            title="Campaign Funnel"
            description="Conversion pipeline from eligible pool through to verified and rewarded identities."
          />
          <div className="space-y-2">
            {funnelSteps.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-secondary">{step.label}</span>
                    <InfoTooltip content={funnelTooltips[step.label]} />
                  </div>
                  <span className="text-xs font-mono text-secondary">
                    {formatNumber(step.value)}
                  </span>
                </div>
                <div className="h-[18px] bg-base rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-accent/30 rounded-sm transition-all duration-500"
                    style={{ width: `${(step.value / maxFunnel) * 100}%` }}
                  />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="text-2xs text-tertiary text-right mt-0.5">
                    {formatPercent(funnelSteps[i + 1].value / Math.max(step.value, 1))} conv.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification Feed */}
        <div className="flex-1 card p-0 flex flex-col min-h-0" data-walkthrough="verification-feed">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Shield size={13} className="text-accent" />
            <span className="text-xs font-medium text-secondary">
              Verification Feed
            </span>
            <span className="text-2xs text-tertiary font-mono">
              {campaignVerifications.length} receipts
            </span>
            <InfoTooltip content="Live feed of anonymous cryptographic receipts. Each entry is a ZK proof — no raw health data is transmitted or stored. Click a receipt to see the proof process." />
          </div>
          <div className="flex-1 overflow-auto scrollbar-thin">
            {campaignVerifications.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedReceipt(v);
                  if (demoActive) notifyUserAction();
                }}
                className="w-full flex items-center gap-3 px-3 py-1.5 border-b border-border/50 hover:bg-hover/50 transition-colors cursor-pointer text-left"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  v.status === 'verified' ? 'bg-success' :
                  v.status === 'pending' ? 'bg-warning' :
                  v.status === 'failed' ? 'bg-error' : 'bg-tertiary'
                }`} />
                <span className="text-2xs text-tertiary w-[120px] flex-shrink-0">
                  {formatTimestamp(v.timestamp)}
                </span>
                <ProofBadge type={v.proofType} />
                <span className="font-mono text-2xs text-accent/60 truncate-hash flex-1">
                  {formatHash(v.proofHash)}
                </span>
                <span className={`text-2xs font-medium ${statusColors[v.status]}`}>
                  {v.status}
                </span>
                <span className="text-2xs font-mono text-tertiary w-[60px] text-right">
                  {formatDuration(v.proofGenerationMs)}
                </span>
              </button>
            ))}
            {campaignVerifications.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-tertiary">
                No verification receipts yet
              </div>
            )}
          </div>
        </div>

        {/* B2C Preview */}
        <B2CPreviewPane />
      </div>

      {/* Proof Animation Modal */}
      {selectedReceipt && (
        <ProofAnimation
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
