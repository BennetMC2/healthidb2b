import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { Plus, Zap, Radio, Target, Filter } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import CampaignOnboardingModal from '@/components/campaigns/CampaignOnboardingModal';
import { campaignTemplates } from '@/data';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { StatusBadge, TypeBadge, UseCaseBadge, MetricBadge } from '@/components/ui/Badge';
import CampaignPopover from '@/components/campaigns/CampaignPopover';
import Tabs from '@/components/ui/Tabs';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { formatNumber, formatCurrency, formatPercent, formatDate } from '@/utils/format';
import type { CampaignType, CampaignStatus } from '@/types';

export default function Campaigns() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading(300);
  const allCampaigns = useCampaignStore((s) => s.campaigns);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const [typeFilter, setTypeFilter] = useState<'all' | CampaignType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('healthid_campaigns_onboarded')
  );

  // Partner-scoped campaigns
  const campaigns = useMemo(
    () => allCampaigns.filter((c) => c.partnerId === currentPartner.id),
    [allCampaigns, currentPartner.id],
  );

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [campaigns, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    totalBudget: campaigns.reduce((s, c) => s + c.rewards.budgetCeiling, 0),
    totalVerified: campaigns.reduce((s, c) => s + c.funnel.verified, 0),
  }), [campaigns]);

  const typeTabs = [
    { id: 'all', label: 'All', count: campaigns.length },
    { id: 'snapshot', label: 'Snapshot', count: campaigns.filter((c) => c.type === 'snapshot').length },
    { id: 'stream', label: 'Stream', count: campaigns.filter((c) => c.type === 'stream').length },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full animate-pulse">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
        <div className="skeleton h-10 rounded" />
        <div className="flex-1 skeleton rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {showOnboarding && (
        <CampaignOnboardingModal onDismiss={() => setShowOnboarding(false)} />
      )}

      {/* Section Header */}
      <SectionHeader title="Campaigns" description="Campaigns are how you engage the pool. Create a challenge, define the health metric, and receive cryptographic proof receipts — never raw data." icon={<Target size={16} />} />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Campaigns" value={stats.total} icon={<Zap size={14} />} />
        <MetricCard label="Active" value={stats.active} icon={<Radio size={14} />} />
        <MetricCard label="Total Budget" value={formatCurrency(stats.totalBudget)} />
        <MetricCard label="Verified Proofs" value={formatNumber(stats.totalVerified)} />
      </div>

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Tabs
          tabs={typeTabs}
          activeTab={typeFilter}
          onChange={(id) => setTypeFilter(id as 'all' | CampaignType)}
        /><InfoTooltip content="Snapshot = one-time proof challenge. Stream = continuous verification subscription." /></div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CampaignStatus)}
            className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="btn-primary text-xs"
          >
            <Plus size={13} />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaign List + Templates — single scrollable area */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin space-y-4">
        <div className="space-y-1 min-w-[520px]">
          {filtered.length === 0 && (
            <EmptyState
              icon={<Filter size={20} className="text-tertiary" />}
              title="No campaigns match your filters"
              description="Try changing the type or status filter to see more campaigns."
              action={{ label: 'Clear Filters', onClick: () => { setTypeFilter('all'); setStatusFilter('all'); } }}
            />
          )}
          {filtered.map((campaign) => (
            <CampaignPopover key={campaign.id} campaign={campaign}>
              <button
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                className="w-full card hover:bg-hover transition-colors duration-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary truncate">
                        {campaign.name}
                      </span>
                      <MetricBadge metric={campaign.challenge.metric} />
                      <UseCaseBadge useCase={campaign.useCase} />
                      <TypeBadge type={campaign.type} />
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="text-xs text-tertiary truncate">
                      {campaign.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono text-secondary">
                        {formatNumber(campaign.funnel.enrolled)}
                      </div>
                      <div className="text-2xs text-tertiary">enrolled</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-secondary">
                        {formatNumber(campaign.funnel.verified)}
                      </div>
                      <div className="text-2xs text-tertiary">verified</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-secondary">
                        {formatPercent(campaign.funnel.verified / Math.max(campaign.funnel.enrolled, 1))}
                      </div>
                      <div className="text-2xs text-tertiary">rate</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-secondary">
                        {formatCurrency(campaign.rewards.budgetSpent)}
                      </div>
                      <div className="text-2xs text-tertiary">
                        of {formatCurrency(campaign.rewards.budgetCeiling)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xs text-tertiary">
                        {formatDate(campaign.startDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </CampaignPopover>
          ))}
        </div>

        {/* Templates — below campaign list, scrolls naturally */}
        <div>
          <SectionHeader title="Campaign Templates" description="Pre-configured campaigns for common use cases. One-click to launch." />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {campaignTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => navigate('/campaigns/new', { state: { template } })}
                className="card hover:bg-hover transition-colors duration-100 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary">{template.name}</span>
                  <MetricBadge metric={template.challenge.metric} />
                  <TypeBadge type={template.type} />
                </div>
                <p className="text-xs text-tertiary mb-2">{template.description}</p>
                <div className="flex items-center gap-3 text-2xs text-tertiary">
                  <span>{formatCurrency(template.suggestedBudget)} budget</span>
                  <span>{template.suggestedPoints} HP/proof</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
