import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { Plus, Zap, Radio, Target, Filter, Activity, Heart, Moon } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import CampaignOnboardingModal from '@/components/campaigns/CampaignOnboardingModal';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { StatusBadge, TypeBadge, UseCaseBadge, MetricBadge } from '@/components/ui/Badge';
import CampaignPopover from '@/components/campaigns/CampaignPopover';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { formatNumber, formatCurrency, formatPercent, formatDate } from '@/utils/format';
import type { CampaignTemplate, CampaignType, CampaignStatus } from '@/types';

const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'resting-heart-rate-90d',
    name: 'Resting Heart Rate Recovery',
    description: '90-day life insurer campaign that rewards members for improving resting heart rate consistency with wearable-verified weekly checkpoints.',
    type: 'stream',
    icon: 'heart',
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 60, unit: 'bpm' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'garmin', 'oura', 'whoop'],
      ageRanges: ['25-34', '35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 42000,
    suggestedPoints: 140,
  },
  {
    id: 'vo2-max-improvement',
    name: 'VO2 Max Uplift Programme',
    description: '180-day cohort campaign designed to improve cardiorespiratory fitness in higher-value life insurance segments.',
    type: 'stream',
    icon: 'activity',
    challenge: { metric: 'vo2_max', operator: 'gte', target: 42, unit: 'ml/kg/min' },
    targeting: {
      reputationTiers: ['high'],
      dataSources: ['apple_health', 'garmin', 'whoop'],
      ageRanges: ['35-44', '45-54', '55-64'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 58000,
    suggestedPoints: 180,
  },
  {
    id: 'sleep-resilience',
    name: 'Sleep Resilience Campaign',
    description: '120-day sleep consistency campaign aimed at improving recovery signals and long-term morbidity outlook in core life cohorts.',
    type: 'stream',
    icon: 'moon',
    challenge: { metric: 'sleep_quality', operator: 'gte', target: 82, unit: '/100' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'oura', 'whoop'],
      ageRanges: ['25-34', '35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 36000,
    suggestedPoints: 125,
  },
];

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
    totalEligible: campaigns.reduce((s, c) => s + c.funnel.eligible, 0),
    totalBudget: campaigns.reduce((s, c) => s + c.rewards.budgetCeiling, 0),
    totalVerified: campaigns.reduce((s, c) => s + c.funnel.verified, 0),
  }), [campaigns]);

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
    <div className="flex flex-col gap-4">
      {showOnboarding && (
        <CampaignOnboardingModal onDismiss={() => setShowOnboarding(false)} />
      )}

      <div className="card-elevated border-accent/15">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.22em] text-accent/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Hong Kong + Japan Life Insurance Scenario
            </div>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-primary">
              Design claims-reduction campaigns around verified health outcomes.
            </h1>
            <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-secondary">
              Configure the target outcome, define the cohort, and launch a programme that converts member-side health activity into verification-grade insurer evidence.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-2xs text-tertiary">
              <span className="badge bg-accent/10 border-accent/20 text-accent">Claims reduction</span>
              <span className="badge bg-elevated border-border text-secondary">Underwriting support</span>
              <span className="badge bg-elevated border-border text-secondary">Member engagement</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/campaigns/new')}
              className="btn-primary text-xs"
            >
              <Plus size={13} />
              Design Campaign
            </button>
            <button
              onClick={() => navigate('/explorer')}
              className="btn-ghost text-xs"
            >
              View Member Pool
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Campaigns" value={stats.total} icon={<Zap size={14} />} />
        <MetricCard label="Live programmes" value={stats.active} icon={<Radio size={14} />} />
        <MetricCard label="Reachable Lives" value={formatNumber(stats.totalEligible)} />
        <MetricCard label="Verified Outcomes" value={formatNumber(stats.totalVerified)} subValue={formatCurrency(stats.totalBudget)} />
      </div>

      <div>
        <SectionHeader title="Starter templates" description="Use proven insurer programme structures, then adapt them to the portfolio." />
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {campaignTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => navigate('/campaigns/new', { state: { template } })}
              className="card hover:bg-hover transition-colors duration-100 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-primary">{template.name}</span>
                <MetricBadge metric={template.challenge.metric} />
                <TypeBadge type={template.type} />
              </div>
              <p className="text-xs leading-relaxed text-tertiary mb-3">{template.description}</p>
              <div className="flex items-center gap-2 mb-3">
                {template.id === 'resting-heart-rate-90d' && <Heart size={14} className="text-accent" />}
                {template.id === 'vo2-max-improvement' && <Activity size={14} className="text-accent" />}
                {template.id === 'sleep-resilience' && <Moon size={14} className="text-accent" />}
                <span className="text-2xs text-secondary">
                  Target: {template.challenge.operator} {template.challenge.target} {template.challenge.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-2xs text-tertiary">
                <span>{formatCurrency(template.suggestedBudget)} programme budget</span>
                <span>{template.suggestedPoints} pts / verified interval</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SectionHeader
        title="Campaign Portfolio"
        description="Live campaigns and drafts for the current insurer environment across claims reduction, underwriting support, and adjacent member programmes."
        icon={<Target size={16} />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-2xs text-tertiary">
          <span>Filter the portfolio by programme type and status.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | CampaignType)}
            className="h-[32px] px-2 bg-base border border-border rounded text-xs text-secondary min-w-[150px]"
          >
            <option value="all">All Campaign Types</option>
            <option value="snapshot">Snapshot</option>
            <option value="stream">Stream</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CampaignStatus)}
            className="h-[32px] px-2 bg-base border border-border rounded text-xs text-secondary min-w-[140px]"
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

      <div className="space-y-2">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Filter size={20} className="text-tertiary" />}
            title="No campaigns match the current filters"
            description="Adjust the programme type or status filter to broaden the results."
            action={{ label: 'Clear Filters', onClick: () => { setTypeFilter('all'); setStatusFilter('all'); } }}
          />
        )}
        {filtered.map((campaign) => (
          <CampaignPopover key={campaign.id} campaign={campaign}>
            <button
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
              className="w-full card hover:bg-hover transition-colors duration-100 cursor-pointer text-left"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
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

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-6 flex-shrink-0">
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
    </div>
  );
}
