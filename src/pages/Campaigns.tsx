import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { Plus, Target, Filter, Activity, Heart, Moon, Users, Repeat2, Megaphone, Trash2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import CampaignOnboardingModal from '@/components/campaigns/CampaignOnboardingModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { useToastStore } from '@/stores/useToastStore';
import { StatusBadge, TypeBadge, MetricBadge } from '@/components/ui/Badge';
import SectionHeader from '@/components/ui/SectionHeader';
import MetricCard from '@/components/ui/MetricCard';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { formatNumber, formatCurrencyCompact } from '@/utils/format';
import { ProofReceiptAnimation } from '@/components/enterprise/EnterpriseWidgets';
import { deleteConsumerCampaign } from '@/lib/consumerCampaigns';
import { playEconomicsById } from '@/lib/playEconomics';
import { useModelStore } from '@/stores/useModelStore';
import type { Campaign, CampaignTemplate, CampaignType, CampaignStatus } from '@/types';

type CampaignFamily = 'signal' | 'acquisition' | 'retention' | 'engagement';

interface StudioCampaignTemplate extends CampaignTemplate {
  family: CampaignFamily;
  familyLabel: string;
  audience: string;
  action: string;
  source: 'Model-ranked' | 'Studio template';
  metrics: Array<{ label: string; value: string }>;
  consentNote?: string;
}

const familyFilters: Array<{ id: CampaignFamily; label: string }> = [
  { id: 'signal', label: 'Signal improvement' },
  { id: 'acquisition', label: 'Open pool acquisition' },
  { id: 'retention', label: 'Retention' },
  { id: 'engagement', label: 'Engagement' },
];

/** Display metrics for a signal play, read from the canonical per-play
 *  economics (the same source the AI Actuary cards and Simulator use), so the
 *  same play shows identical book value / ROI / payback everywhere. */
function computeSignalMetrics(
  campaignId: string,
  modelScalar: number,
): { metrics: Array<{ label: string; value: string }>; bookValue: number } {
  const econ = playEconomicsById(campaignId, modelScalar);
  if (!econ) return { metrics: [], bookValue: 0 };
  return {
    metrics: [
      { label: 'Est. book value', value: formatCurrencyCompact(econ.bookValue) },
      { label: 'Modelled ROI', value: `${econ.roi.toFixed(1)}x` },
      { label: 'Payback', value: econ.payback != null ? `${econ.payback} mo` : '—' },
    ],
    bookValue: econ.bookValue,
  };
}

// Build the signal-campaign catalog for the active Model. Re-priced whenever the
// selected Model changes (the templates' book value / ROI / payback move).
function buildSignalCatalog(modelScalar: number): {
  campaignTemplates: StudioCampaignTemplate[];
  signalBookValues: Record<string, number>;
} {
const vo2Metrics = computeSignalMetrics('ins_vo2_activation', modelScalar);
const hrvMetrics = computeSignalMetrics('ins_hrv_recovery', modelScalar);
const sleepMetrics = computeSignalMetrics('ins_sleep_regularity', modelScalar);
const rhrMetrics = computeSignalMetrics('ins_resting_hr_improvement', modelScalar);

const signalBookValues: Record<string, number> = {
  'Cardio Fitness Activation': vo2Metrics.bookValue,
  'HRV Recovery': hrvMetrics.bookValue,
  'Sleep Regularity': sleepMetrics.bookValue,
  'Resting Heart Rate Improvement': rhrMetrics.bookValue,
};

const campaignTemplates: StudioCampaignTemplate[] = [
  {
    id: 'vo2-max-activation',
    name: 'Cardio Fitness Activation',
    description: 'Reward low or declining VO2 Max members for verified Zone 2 consistency and a positive cardio-fitness trend.',
    family: 'signal',
    familyLabel: 'Signal improvement',
    audience: '3,847 addressable existing members',
    action: '650 HP/member for 8 weeks of verified Zone 2 consistency.',
    source: 'Model-ranked',
    metrics: vo2Metrics.metrics,
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
    source: 'Model-ranked',
    metrics: hrvMetrics.metrics,
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
    source: 'Model-ranked',
    metrics: sleepMetrics.metrics,
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
    source: 'Model-ranked',
    metrics: rhrMetrics.metrics,
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
  return { campaignTemplates, signalBookValues };
}

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

function OutputTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}

function campaignFamily(campaign: Pick<Campaign, 'name' | 'useCase'>): CampaignFamily {
  if (campaign.name === 'Device Connection Activation') return 'engagement';
  if (campaign.useCase === 'acquisition') return 'acquisition';
  if (campaign.useCase === 'renewal') return 'retention';
  if (campaign.useCase === 'underwriting') return 'signal';
  if (campaign.useCase === 'dynamic_premium') return 'signal';
  return 'signal';
}

function familyLabel(family: CampaignFamily) {
  return familyFilters.find((filter) => filter.id === family)?.label ?? 'Signal improvement';
}

function portfolioFamilyLabel(campaign: Campaign) {
  if (campaign.useCase === 'underwriting') return 'Lab proof';
  return familyLabel(campaignFamily(campaign));
}

export default function Campaigns() {
  const navigate = useNavigate();
  const modelScalar = useModelStore((s) => s.modelScalar);
  const { campaignTemplates } = useMemo(() => buildSignalCatalog(modelScalar), [modelScalar]);
  const loading = useSimulatedLoading(300);
  const allCampaigns = useCampaignStore((s) => s.campaigns);
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign);
  const addToast = useToastStore((s) => s.addToast);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const [typeFilter, setTypeFilter] = useState<'all' | CampaignType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [familyFilter, setFamilyFilter] = useState<CampaignFamily>('signal');
  // Visible table filter pills: family ('all' = no family constraint) + status.
  const [tableFamilyFilter, setTableFamilyFilter] = useState<'all' | CampaignFamily>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState(campaignTemplates[0]?.id ?? '');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
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
      if (tableFamilyFilter !== 'all' && campaignFamily(c) !== tableFamilyFilter) return false;
      return true;
    });
  }, [campaigns, typeFilter, statusFilter, tableFamilyFilter]);

  const visibleTemplates = useMemo(() => {
    return campaignTemplates.filter((template) => template.family === familyFilter);
  }, [familyFilter]);

  const selectedTemplate = useMemo(() => (
    visibleTemplates.find((template) => template.id === selectedTemplateId) ?? visibleTemplates[0]
  ), [selectedTemplateId, visibleTemplates]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    totalEligible: campaigns.reduce((s, c) => s + c.funnel.eligible, 0),
    totalBudget: campaigns.reduce((s, c) => s + c.rewards.budgetCeiling, 0),
    totalVerified: campaigns.reduce((s, c) => s + c.funnel.verified, 0),
    acquisition: campaigns.filter((c) => c.useCase === 'acquisition').length,
  }), [campaigns]);

  const portfolioRows = useMemo(() => {
    return filtered.slice(0, 8);
  }, [filtered]);

  const selectedPortfolioCampaign = useMemo(() => {
    return portfolioRows.find((campaign) => campaign.id === selectedPortfolioId) ?? portfolioRows[0] ?? null;
  }, [portfolioRows, selectedPortfolioId]);

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
      {campaignToDelete && (
        <ConfirmDialog
          title="Delete Campaign"
          description={`Delete "${campaignToDelete.name}" from Campaign Studio? This removes it from this workspace view.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={async () => {
            const externalCampaignId = campaignToDelete.b2cSync?.externalCampaignId ?? campaignToDelete.id;
            try {
              await deleteConsumerCampaign(externalCampaignId);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Consumer campaign delete failed';
              addToast({ message, variant: 'default' });
            }
            deleteCampaign(campaignToDelete.id);
            if (selectedPortfolioId === campaignToDelete.id) {
              setSelectedPortfolioId(null);
            }
            addToast({ message: 'Campaign deleted', variant: 'success' });
            setCampaignToDelete(null);
          }}
          onCancel={() => setCampaignToDelete(null)}
        />
      )}

      {/* Page header — shared label + H2 + purpose + right-aligned actions pattern */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" data-walkthrough="campaigns-hero">
        <div className="min-w-0">
          <div className="font-mono text-2xs uppercase tracking-[0.18em] text-accent/80">Campaign Studio</div>
          <h2 className="mt-1 text-base font-semibold text-primary font-display">Campaign portfolio</h2>
          <p className="mt-1 max-w-[640px] text-sm leading-relaxed text-tertiary">
            Use Health Points to acquire anonymous open-pool members, retain policyholders, and move verified wearable signals that improve book value.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={() => navigate('/app/cohorts')}
            className="btn-ghost text-xs"
          >
            View cohorts
          </button>
          <button
            onClick={() => navigate('/app/campaigns/new')}
            className="btn-primary text-xs"
          >
            <Plus size={13} />
            Create campaign
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-walkthrough="campaigns-kpis">
        <MetricCard
          label="Active campaigns"
          value={`${stats.active} / ${stats.total}`}
          icon={<Activity size={14} />}
        />
        <MetricCard
          label="Total budget"
          value={formatCurrencyCompact(stats.totalBudget)}
          subValue="HP budget"
          icon={<Megaphone size={14} />}
        />
        <MetricCard
          label="Reachable members"
          value={formatNumber(stats.totalEligible)}
          icon={<Users size={14} />}
        />
        <MetricCard
          label="Verified receipts"
          value={formatNumber(stats.totalVerified)}
          icon={<Target size={14} />}
        />
      </div>

      <section className="card" data-walkthrough="campaigns-portfolio">
        {/* Visible filter pills toolbar — family + status, replacing the old dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {([{ id: 'all', label: 'All' }, ...familyFilters] as Array<{ id: 'all' | CampaignFamily; label: string }>).map((family) => {
            const active = tableFamilyFilter === family.id;
            return (
              <button
                key={family.id}
                onClick={() => setTableFamilyFilter(family.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border bg-base/60 text-secondary hover:border-accent/20'
                }`}
                aria-pressed={active}
              >
                {family.label}
              </button>
            );
          })}
          <span className="ml-auto font-mono text-2xs uppercase tracking-[0.12em] text-tertiary">Status</span>
          {([{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'completed', label: 'Completed' }] as Array<{ id: 'all' | CampaignStatus; label: string }>).map((s) => {
            const active = statusFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border bg-base/60 text-secondary hover:border-accent/20'
                }`}
                aria-pressed={active}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-tertiary">
                <tr>
                  <th className="py-2 pl-3 pr-3 font-mono">Campaign</th>
                  <th className="py-2 pr-3 font-mono">Family</th>
                  <th className="py-2 pr-3 font-mono">Audience</th>
                  <th className="py-2 pr-3 font-mono">Budget</th>
                  <th className="py-2 pr-3 font-mono">Status</th>
                  <th className="py-2 pr-3 font-mono">Verified</th>
                  <th className="py-2 pr-3 font-mono text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {portfolioRows.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => setSelectedPortfolioId(campaign.id)}
                    className={`cursor-pointer hover:bg-hover/60 ${selectedPortfolioCampaign?.id === campaign.id ? 'bg-accent/10' : ''}`}
                  >
                    <td className="py-2 pl-3 pr-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/app/campaigns/${campaign.id}`);
                        }}
                        className="font-medium text-primary hover:text-accent"
                      >
                        {campaign.name}
                      </button>
                      <div className="mt-0.5 max-w-[360px] truncate text-2xs text-tertiary">{campaign.description}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="badge bg-elevated border-border text-secondary">{portfolioFamilyLabel(campaign)}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-secondary">{formatNumber(campaign.funnel.eligible)}</td>
                    <td className="py-2 pr-3 font-mono text-secondary">{formatCurrencyCompact(campaign.rewards.budgetCeiling)}</td>
                    <td className="py-2 pr-3"><StatusBadge status={campaign.status} /></td>
                    <td className="py-2 pr-3 font-mono text-secondary">{formatNumber(campaign.funnel.verified)}</td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setCampaignToDelete(campaign);
                        }}
                        className="btn-ghost p-1.5 text-error hover:bg-error-muted"
                        aria-label={`Delete ${campaign.name}`}
                        title="Delete campaign"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {portfolioRows.length === 0 && (
              <EmptyState
                icon={<Filter size={20} className="text-tertiary" />}
                title="No campaigns match the current filters"
                description="Adjust the programme type or status filter to broaden the results."
                action={{ label: 'Clear Filters', onClick: () => { setTypeFilter('all'); setStatusFilter('all'); setTableFamilyFilter('all'); } }}
              />
            )}
          </div>

          {selectedPortfolioCampaign && (
            <aside className="rounded-xl border border-border bg-base/70 p-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Selected campaign</div>
              <h3 className="mt-2 text-lg font-semibold text-primary">{selectedPortfolioCampaign.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-secondary">{selectedPortfolioCampaign.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <OutputTile label="Eligible" value={formatNumber(selectedPortfolioCampaign.funnel.eligible)} />
                <OutputTile label="Verified" value={formatNumber(selectedPortfolioCampaign.funnel.verified)} />
                <OutputTile label="Budget" value={formatCurrencyCompact(selectedPortfolioCampaign.rewards.budgetCeiling)} />
                <OutputTile label="HP price" value={`${selectedPortfolioCampaign.rewards.pointsPerVerification} HP`} />
              </div>
              <div className="mt-4">
                <ProofReceiptAnimation compact />
              </div>
              <button
                onClick={() => navigate(`/app/campaigns/${selectedPortfolioCampaign.id}`)}
                className="btn-primary mt-4 w-full text-xs"
              >
                Open performance page
              </button>
            </aside>
          )}
        </div>
      </section>

      <section data-walkthrough="campaigns-templates">
        <SectionHeader title="Create next campaign" description="Choose a campaign family, inspect the strongest play, then open the builder with the right defaults." />
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <div className="card p-0">
            <div className="border-b border-border px-4 py-3">
              <div className="text-sm font-semibold text-primary">{familyLabel(familyFilter)}</div>
              <div className="mt-1 text-xs text-tertiary">{visibleTemplates.length} available plays</div>
            </div>
            <div className="divide-y divide-border">
              {visibleTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    selectedTemplate?.id === template.id ? 'bg-accent/10' : 'hover:bg-hover'
                  }`}
                >
                  <TemplateIcon icon={template.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-primary">{template.name}</span>
                      <span className="badge bg-elevated border-border text-tertiary">{template.source}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-tertiary">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MetricBadge metric={template.challenge.metric} />
                      <TypeBadge type={template.type} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <article className="card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge bg-accent/10 border-accent/20 text-accent">{selectedTemplate.familyLabel}</span>
                    <MetricBadge metric={selectedTemplate.challenge.metric} />
                    <TypeBadge type={selectedTemplate.type} />
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-primary">{selectedTemplate.name}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => navigate('/app/campaigns/new', { state: { template: selectedTemplate } })}
                  className="btn-primary shrink-0 text-xs"
                >
                  <Plus size={13} />
                  Create Campaign
                </button>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <div className="rounded border border-border bg-base/60 px-4 py-3">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">Audience</div>
                  <div className="mt-1 text-sm font-medium text-primary">{selectedTemplate.audience}</div>
                  {selectedTemplate.consentNote && <div className="mt-2 text-xs text-tertiary">{selectedTemplate.consentNote}</div>}
                </div>
                <div className="rounded border border-border bg-base/60 px-4 py-3">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Health Points action</div>
                  <div className="mt-1 text-sm font-medium text-primary">{selectedTemplate.action}</div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {selectedTemplate.metrics.map((metric) => (
                  <div key={`${selectedTemplate.id}-${metric.label}`} className="rounded border border-border bg-surface px-3 py-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">{metric.label}</div>
                    <div className="mt-1 font-mono text-base font-semibold text-primary">{metric.value}</div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>

    </div>
  );
}
