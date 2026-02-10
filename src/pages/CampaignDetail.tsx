import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { campaigns, verifications } from '@/data';
import { StatusBadge, TypeBadge, ProofBadge } from '@/components/ui/Badge';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import ProofAnimation from '@/components/campaigns/ProofAnimation';
import { formatNumber, formatCurrency, formatPercent, formatDate, formatHash, formatTimestamp, formatDuration } from '@/utils/format';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import { useDemoStore } from '@/stores/useDemoStore';
import type { VerificationReceipt, VerificationStatus } from '@/types';

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
  const demoActive = useDemoStore((s) => s.isActive);
  const notifyUserAction = useDemoStore((s) => s.notifyUserAction);
  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-full text-secondary">
        Campaign not found
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
        <MetricCard
          label="Challenge"
          value={HEALTH_METRIC_LABELS[campaign.challenge.metric]}
          subValue={`${campaign.challenge.operator} ${campaign.challenge.target}${campaign.challenge.unit ? ' ' + campaign.challenge.unit : ''}`}
        />
      </div>

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
