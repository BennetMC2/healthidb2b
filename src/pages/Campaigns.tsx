import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { Plus, Zap, Radio, Target, Filter, Activity, Heart, Moon, Users, Repeat2, Megaphone } from 'lucide-react';
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

type CampaignFamily = 'signal' | 'acquisition' | 'retention' | 'engagement';

interface StudioCampaignTemplate extends CampaignTemplate {
  family: CampaignFamily;
  familyLabel: string;
  audience: string;
  action: string;
  source: 'AI recommended' | 'Studio template';
  metrics: Array<{ label: string; value: string }>;
  consentNote?: string;
}

const familyFilters: Array<{ id: 'all' | CampaignFamily; label: string }> = [
  { id: 'all', label: 'All families' },
  { id: 'signal', label: 'Signal improvement' },
  { id: 'acquisition', label: 'Open pool acquisition' },
  { id: 'retention', label: 'Retention' },
  { id: 'engagement', label: 'Engagement' },
];

const campaignTemplates: StudioCampaignTemplate[] = [
  {
    id: 'vo2-max-activation',
    name: 'Cardio Fitness Activation',
    description: 'Reward low or declining VO2 Max members for verified Zone 2 consistency and a positive cardio-fitness trend.',
    family: 'signal',
    familyLabel: 'Signal improvement',
    audience: '3,847 addressable existing members',
    action: '650 HP/member for 8 weeks of verified Zone 2 consistency.',
    source: 'AI recommended',
    metrics: [
      { label: 'Book value', value: '$4.2M' },
      { label: 'ROI', value: '4.2x' },
      { label: 'Payback', value: '8 mo' },
    ],
    type: 'stream',
    useCase: 'claims_reduction',
    icon: 'activity',
    challenge: { metric: 'vo2_max', operator: 'gte', target: 2, unit: 'mL/kg/min uplift' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'garmin', 'whoop'],
      ageRanges: ['35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 58000,
    suggestedPoints: 650,
  },
  {
    id: 'hrv-recovery',
    name: 'HRV Recovery',
    description: 'Intervene before recovery drift becomes claims risk by rewarding verified recovery days.',
    family: 'signal',
    familyLabel: 'Signal improvement',
    audience: '1,204 members with HRV drift',
    action: '520 HP/member for 21 verified recovery days.',
    source: 'AI recommended',
    metrics: [
      { label: 'Book value', value: '$1.8M' },
      { label: 'ROI', value: '3.4x' },
      { label: 'Payback', value: '12 mo' },
    ],
    type: 'stream',
    useCase: 'claims_reduction',
    icon: 'heart',
    challenge: { metric: 'hrv', operator: 'gte', target: 8, unit: 'ms recovery' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'oura', 'whoop'],
      ageRanges: ['35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 36000,
    suggestedPoints: 520,
  },
  {
    id: 'sleep-regularity',
    name: 'Sleep Regularity',
    description: 'Stabilise sleep debt by rewarding consistent sleep windows and verified sleep sufficiency.',
    family: 'signal',
    familyLabel: 'Signal improvement',
    audience: '2,186 members with sleep debt',
    action: '480 HP/member for 30 verified regular sleep nights.',
    source: 'AI recommended',
    metrics: [
      { label: 'Book value', value: '$1.25M' },
      { label: 'ROI', value: '3.1x' },
      { label: 'Payback', value: '11 mo' },
    ],
    type: 'stream',
    useCase: 'claims_reduction',
    icon: 'moon',
    challenge: { metric: 'sleep_hours', operator: 'gte', target: 6.5, unit: 'hrs' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'oura', 'whoop'],
      ageRanges: ['25-34', '35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 42000,
    suggestedPoints: 480,
  },
  {
    id: 'resting-heart-rate-improvement',
    name: 'Resting Heart Rate Improvement',
    description: 'Run a controlled pilot for members with elevated or worsening resting heart rate.',
    family: 'signal',
    familyLabel: 'Signal improvement',
    audience: '946 members with elevated resting HR',
    action: '600 HP/member for 12 active weeks and a 3 bpm improvement.',
    source: 'AI recommended',
    metrics: [
      { label: 'Book value', value: '$840K' },
      { label: 'ROI', value: '2.7x' },
      { label: 'Payback', value: '14 mo' },
    ],
    type: 'stream',
    useCase: 'claims_reduction',
    icon: 'heart',
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 3, unit: 'bpm improvement' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'garmin', 'fitbit'],
      ageRanges: ['35-44', '45-54', '55-64'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 31000,
    suggestedPoints: 600,
  },
  {
    id: 'open-pool-cardio-acquisition',
    name: 'Open Pool Cardio Acquisition',
    description: 'Invite anonymous HealthID members with strong activity consistency to opt into partner onboarding.',
    family: 'acquisition',
    familyLabel: 'Open pool acquisition',
    audience: '8,400 anonymous opted-in HealthID members',
    action: '350 HP for consented onboarding after a verified cardio receipt.',
    source: 'Studio template',
    consentNote: 'Anonymous until consent; identity is only disclosed during partner onboarding.',
    metrics: [
      { label: 'Target pool', value: '8.4K' },
      { label: 'Est. opt-in', value: '6.8%' },
      { label: 'Cost/signup', value: '$18' },
    ],
    type: 'snapshot',
    useCase: 'acquisition',
    icon: 'users',
    challenge: { metric: 'active_minutes', operator: 'gte', target: 150, unit: 'min/wk' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'garmin', 'whoop'],
      ageRanges: ['25-34', '35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 50000,
    suggestedPoints: 350,
  },
  {
    id: 'open-pool-sleep-acquisition',
    name: 'Open Pool Sleep Improver Offer',
    description: 'Acquire verified sleep-improvers from the open pool with a consented wellness offer.',
    family: 'acquisition',
    familyLabel: 'Open pool acquisition',
    audience: '5,900 anonymous sleep-improvement candidates',
    action: '300 HP for opt-in plus a verified 14-night sleep receipt.',
    source: 'Studio template',
    consentNote: 'Campaign Studio targets anonymous segments; partner sees identity only after consent.',
    metrics: [
      { label: 'Target pool', value: '5.9K' },
      { label: 'Est. opt-in', value: '5.4%' },
      { label: 'Trust mix', value: '72% H/M' },
    ],
    type: 'snapshot',
    useCase: 'acquisition',
    icon: 'users',
    challenge: { metric: 'sleep_quality', operator: 'gte', target: 78, unit: 'score' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'oura', 'whoop'],
      ageRanges: ['25-34', '35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 36000,
    suggestedPoints: 300,
  },
  {
    id: 'renewal-readiness-streak',
    name: 'Renewal Readiness Streak',
    description: 'Retain members approaching renewal by rewarding verified sleep, activity, and resting HR receipts.',
    family: 'retention',
    familyLabel: 'Retention',
    audience: '2,100 members inside Q3 renewal window',
    action: '420 HP/member for a 60-day verified readiness streak.',
    source: 'Studio template',
    metrics: [
      { label: 'Renewal lift', value: '+4.2 pts' },
      { label: 'Retained value', value: '$1.6M' },
      { label: 'Budget', value: '$42K' },
    ],
    type: 'stream',
    useCase: 'renewal',
    icon: 'repeat',
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 72, unit: 'bpm' },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: ['apple_health', 'garmin', 'oura', 'whoop'],
      ageRanges: ['35-44', '45-54', '55-64'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 42000,
    suggestedPoints: 420,
  },
  {
    id: 'device-connection-activation',
    name: 'Device Connection Activation',
    description: 'Increase future campaign readiness by rewarding device connection and first verified receipt.',
    family: 'engagement',
    familyLabel: 'Engagement',
    audience: '6,800 single-source or dormant members',
    action: '180 HP for connecting a wearable and emitting a first verified receipt.',
    source: 'Studio template',
    metrics: [
      { label: 'New sources', value: '+2.4K' },
      { label: 'Receipt lift', value: '+31%' },
      { label: 'Budget', value: '$24K' },
    ],
    type: 'snapshot',
    useCase: 'renewal',
    icon: 'megaphone',
    challenge: { metric: 'active_minutes', operator: 'gte', target: 30, unit: 'min' },
    targeting: {
      reputationTiers: ['low', 'medium'],
      dataSources: ['apple_health', 'google_fit', 'samsung_health'],
      ageRanges: ['18-24', '25-34', '35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: 24000,
    suggestedPoints: 180,
  },
];

function TemplateIcon({ icon }: { icon: string }) {
  const className = 'text-accent';
  if (icon === 'activity') return <Activity size={15} className={className} />;
  if (icon === 'heart') return <Heart size={15} className={className} />;
  if (icon === 'moon') return <Moon size={15} className={className} />;
  if (icon === 'users') return <Users size={15} className={className} />;
  if (icon === 'repeat') return <Repeat2 size={15} className={className} />;
  if (icon === 'megaphone') return <Megaphone size={15} className={className} />;
  return <Target size={15} className={className} />;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading(300);
  const allCampaigns = useCampaignStore((s) => s.campaigns);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const [typeFilter, setTypeFilter] = useState<'all' | CampaignType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [familyFilter, setFamilyFilter] = useState<'all' | CampaignFamily>('all');
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  const visibleTemplates = useMemo(() => {
    if (familyFilter === 'all') return campaignTemplates;
    return campaignTemplates.filter((template) => template.family === familyFilter);
  }, [familyFilter]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    totalEligible: campaigns.reduce((s, c) => s + c.funnel.eligible, 0),
    totalBudget: campaigns.reduce((s, c) => s + c.rewards.budgetCeiling, 0),
    acquisition: campaigns.filter((c) => c.useCase === 'acquisition').length,
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

      <div className="card-elevated border-accent/15" data-walkthrough="campaigns-hero">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.22em] text-accent/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Campaign studio
            </div>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-primary xl:whitespace-nowrap">
              Launch campaigns that acquire, retain, and improve members.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary">
              Use Health Points to target anonymous open-pool members, retain existing policyholders, and move verified wearable signals in ways that improve book value.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-2xs text-tertiary">
              <span className="badge bg-accent/10 border-accent/20 text-accent">Health Points priced</span>
              <span className="badge bg-elevated border-border text-secondary">Anonymous until consent</span>
              <span className="badge bg-elevated border-border text-secondary">Wearable signal verified</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button
              onClick={() => navigate('/app/campaigns/new')}
              className="btn-primary text-xs"
            >
              <Plus size={13} />
              Create Campaign
            </button>
            <button
              onClick={() => navigate('/app/explorer')}
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
        <MetricCard label="Reachable Members" value={formatNumber(stats.totalEligible)} />
        <MetricCard label="Acquisition Plays" value={stats.acquisition} subValue={formatCurrency(stats.totalBudget)} />
      </div>

      <div data-walkthrough="campaigns-templates">
        <SectionHeader title="Campaign families" description="Select the commercial motion first, then tune the signal, cohort, and Health Points price." />
        <div className="mb-3 flex flex-wrap gap-2">
          {familyFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFamilyFilter(filter.id)}
              className={`badge cursor-pointer ${familyFilter === filter.id ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {visibleTemplates.map((template) => (
            <article
              key={template.id}
              className="card hover:bg-hover transition-colors duration-100"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TemplateIcon icon={template.icon} />
                  <span className="text-sm font-medium text-primary">{template.name}</span>
                </div>
                <span className="badge bg-elevated border-border text-tertiary">{template.source}</span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="badge bg-accent/10 border-accent/20 text-accent">{template.familyLabel}</span>
                <MetricBadge metric={template.challenge.metric} />
                <TypeBadge type={template.type} />
              </div>
              <p className="text-xs leading-relaxed text-tertiary mb-3">{template.description}</p>
              <div className="mb-3 rounded border border-border bg-base/60 px-3 py-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">Audience</div>
                <div className="mt-1 text-xs text-secondary">{template.audience}</div>
                {template.consentNote && <div className="mt-2 text-2xs text-tertiary">{template.consentNote}</div>}
              </div>
              <div className="mb-3 rounded border border-border bg-base/60 px-3 py-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Health Points action</div>
                <div className="mt-1 text-xs text-secondary">{template.action}</div>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {template.metrics.map((metric) => (
                  <div key={`${template.id}-${metric.label}`} className="rounded border border-border bg-surface px-2 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">{metric.label}</div>
                    <div className="mt-1 font-mono text-xs font-semibold text-primary">{metric.value}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/app/campaigns/new', { state: { template } })}
                className="btn-primary w-full justify-center text-xs"
              >
                <Plus size={13} />
                Create Campaign
              </button>
            </article>
          ))}
        </div>
      </div>

      <SectionHeader
        title="Campaign portfolio"
        description="Live campaigns and drafts across signal improvement, acquisition, retention, and member engagement."
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
            onClick={() => navigate('/app/campaigns/new')}
            className="btn-primary text-xs"
          >
            <Plus size={13} />
            Create Campaign
          </button>
        </div>
      </div>

      <div className="space-y-2" data-walkthrough="campaigns-portfolio">
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
              onClick={() => navigate(`/app/campaigns/${campaign.id}`)}
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
