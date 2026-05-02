import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Radio,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  AGE_RANGES,
  CAMPAIGN_USE_CASE_ORDER,
  DATA_SOURCE_LABELS,
  getMetricsGroupedByCategory,
  HEALTH_METRIC_UNITS,
  REPUTATION_TIER_LABELS,
  REPUTATION_TIER_ORDER,
  USE_CASE_LABELS,
} from '@/utils/constants';
import { suggestUseCase } from '@/utils/actuarial';
import { ChallengeDisplay } from '@/components/ui/Badge';
import { useToastStore } from '@/stores/useToastStore';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import LaunchSuccess from '@/components/campaigns/LaunchSuccess';
import ActuarialROICalculator from '@/components/campaigns/ActuarialROICalculator';
import {
  buildConsumerCampaignPayload,
  buildConsumerChallengeUrl,
  dispatchCampaignToConsumer,
  type ConsumerCampaignDispatchResponse,
} from '@/lib/consumerCampaigns';
import type {
  Campaign,
  CampaignType,
  CampaignUseCase,
  CampaignTemplate,
  ChallengeOperator,
  DataSource,
  HealthMetric,
  ReputationTier,
} from '@/types';

const steps = [
  { id: 'outcome', label: 'Outcome' },
  { id: 'signal', label: 'Signal' },
  { id: 'cohort', label: 'Cohort' },
  { id: 'incentives', label: 'Incentives' },
  { id: 'review', label: 'Review' },
];

export default function CampaignCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToastStore((s) => s.addToast);
  const addCampaign = useCampaignStore((s) => s.addCampaign);
  const updateB2CSync = useCampaignStore((s) => s.updateB2CSync);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const [step, setStep] = useState(0);
  const [launchingState, setLaunchingState] = useState<{
    campaignId: string;
    status: 'deploying' | 'success' | 'error';
    summary?: ConsumerCampaignDispatchResponse;
    errorMessage?: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '' as CampaignType | '',
    useCase: '' as CampaignUseCase | '',
    metric: '' as HealthMetric | '',
    operator: 'gte' as string,
    target: '',
    frequency: 'daily' as string,
    duration: '90',
    healthScoreMin: '0',
    healthScoreMax: '100',
    reputationTiers: [] as ReputationTier[],
    dataSources: [] as DataSource[],
    ageRanges: [] as string[],
    markets: ['Hong Kong', 'Japan'] as string[],
    pointsPerVerification: '500',
    budgetCeiling: '25000',
    maxParticipants: '1000',
  });

  useEffect(() => {
    const template = (location.state as { template?: CampaignTemplate })?.template;
    if (template) {
      setForm((f) => ({
        ...f,
        name: template.name,
        description: template.description,
        type: template.type,
        useCase: 'claims_reduction',
        metric: template.challenge.metric,
        operator: template.challenge.operator,
        target: String(template.challenge.target),
        budgetCeiling: String(template.suggestedBudget),
        pointsPerVerification: String(template.suggestedPoints),
        healthScoreMin: String(template.targeting.healthScoreMin ?? 0),
        reputationTiers: template.targeting.reputationTiers ?? [],
        dataSources: template.targeting.dataSources ?? [],
        ageRanges: template.targeting.ageRanges ?? [],
        markets: template.targeting.regions ?? ['Hong Kong', 'Japan'],
        duration: template.type === 'stream' ? '90' : '30',
      }));
      setStep(1);
      addToast({ message: `Template loaded: ${template.name}`, variant: 'success' });
    }
  }, [location.state, addToast]);

  const canNext = () => {
    switch (step) {
      case 0: return form.type !== '' && form.name.trim().length > 0;
      case 1: return form.metric !== '' && form.target !== '';
      case 2: return form.markets.length > 0;
      case 3: return form.pointsPerVerification !== '' && form.budgetCeiling !== '';
      case 4: return true;
      default: return false;
    }
  };

  const handleLaunch = useCallback(async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Campaign name is required';
    if (Number(form.budgetCeiling) < 100) errs.budget = 'Budget must be at least $100';
    if (!form.metric) errs.metric = 'Health metric is required';
    if (form.markets.length === 0) errs.markets = 'Select at least one target market';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const now = new Date().toISOString();
    const id = `cmp_${Date.now().toString(16)}`;
    const maxParticipants = Number(form.maxParticipants) || 1000;
    const budgetCeiling = Number(form.budgetCeiling) || 25000;
    const duration = Number(form.duration) || 90;

    const newCampaign: Campaign = {
      id,
      name: form.name,
      description: form.description,
      purpose: `Life insurer campaign focused on ${((form.useCase as CampaignUseCase) || 'claims_reduction').replace(/_/g, ' ')} through ${form.metric || 'verified health improvement'} in ${form.markets.join(' and ')} cohorts.`,
      useCase: (form.useCase as CampaignUseCase) || 'claims_reduction',
      type: form.type as CampaignType,
      status: 'active',
      partnerId: currentPartner.id,
      challenge: {
        metric: form.metric as HealthMetric,
        operator: form.operator as ChallengeOperator,
        target: Number(form.target) || 0,
        unit: form.metric ? HEALTH_METRIC_UNITS[form.metric as HealthMetric] : '',
      },
      targeting: {
        healthScoreMin: Number(form.healthScoreMin) || 0,
        healthScoreMax: Number(form.healthScoreMax) || 100,
        reputationTiers: form.reputationTiers.length > 0 ? form.reputationTiers : undefined,
        dataSources: form.dataSources.length > 0 ? form.dataSources : undefined,
        ageRanges: form.ageRanges.length > 0 ? form.ageRanges : undefined,
        regions: form.markets.length > 0 ? form.markets : undefined,
      },
      rewards: {
        pointsPerVerification: Number(form.pointsPerVerification) || 100,
        budgetCeiling,
        budgetSpent: 0,
        maxParticipants,
      },
      funnel: {
        eligible: maxParticipants,
        invited: 0,
        enrolled: 0,
        verified: 0,
        rewarded: 0,
      },
      startDate: now,
      endDate: form.type === 'snapshot' ? now : null,
      createdAt: now,
    };

    if (form.type === 'stream') {
      Object.assign(newCampaign, {
        frequency: form.frequency as 'daily' | 'weekly' | 'monthly',
        streamDuration: duration,
        dynamicPricing: false,
      });
    }

    const consumerPayload = buildConsumerCampaignPayload(newCampaign, currentPartner);
    newCampaign.b2cSync = {
      externalCampaignId: newCampaign.id,
      consumerAppUrl: buildConsumerChallengeUrl(consumerPayload),
      dispatchStatus: 'pending',
      lastDispatchAt: now,
    };

    addCampaign(newCampaign);
    setLaunchingState({
      campaignId: newCampaign.id,
      status: 'deploying',
    });

    try {
      const dispatchSummary = await dispatchCampaignToConsumer(consumerPayload);
      updateB2CSync(newCampaign.id, {
        externalCampaignId: dispatchSummary.externalCampaignId,
        consumerCampaignId: dispatchSummary.consumerCampaignId,
        consumerAppUrl: dispatchSummary.memberAppUrl,
        dispatchStatus: dispatchSummary.dispatchStatus,
        eligibleUsers: dispatchSummary.eligibleUsers,
        inviteCount: dispatchSummary.inviteCount,
        acceptedCount: dispatchSummary.acceptedCount,
        verifiedCount: dispatchSummary.verifiedCount,
        rewardedCount: dispatchSummary.rewardedCount,
        proofOpportunityCreated: dispatchSummary.proofOpportunityCreated,
        lastDispatchAt: dispatchSummary.dispatchedAt,
        lastSyncedAt: dispatchSummary.dispatchedAt,
        lastError: dispatchSummary.error,
        channels: dispatchSummary.channels,
      });
      setLaunchingState({
        campaignId: newCampaign.id,
        status: dispatchSummary.dispatchStatus === 'error' ? 'error' : 'success',
        summary: dispatchSummary,
        errorMessage: dispatchSummary.error,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Consumer dispatch failed';
      updateB2CSync(newCampaign.id, {
        dispatchStatus: 'error',
        lastDispatchAt: now,
        lastSyncedAt: now,
        lastError: errorMessage,
      });
      setLaunchingState({
        campaignId: newCampaign.id,
        status: 'error',
        errorMessage,
      });
    }
  }, [form, addCampaign, currentPartner, updateB2CSync]);

  const handleLaunchComplete = useCallback(() => {
    if (!launchingState) {
      navigate('/campaigns');
      return;
    }

    navigate(`/campaigns/${launchingState.campaignId}`);
    addToast({
      message:
        launchingState.status === 'success'
          ? `Campaign launched and ${launchingState.summary?.inviteCount ?? 0} member challenges were dispatched`
          : 'Campaign launched, but the consumer dispatch needs attention',
      variant: launchingState.status === 'success' ? 'success' : 'default',
    });
  }, [navigate, addToast, launchingState]);

  if (launchingState) {
    return (
      <LaunchSuccess
        state={launchingState.status}
        summary={launchingState.summary}
        errorMessage={launchingState.errorMessage}
        onComplete={handleLaunchComplete}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1120px]">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/campaigns')} className="btn-ghost p-1">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-primary">Design Campaign</h1>
          <p className="text-2xs text-tertiary mt-0.5">
            Build a life insurance programme around claims reduction, verified outcomes, and modeled business impact.
          </p>
        </div>
      </div>

      <div className="card-elevated border-accent/15">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[560px]">
            <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.22em] text-accent/80">
              <Sparkles size={12} />
              Self-Serve Insurer Workflow
            </div>
            <h2 className="mt-3 text-xl font-semibold text-primary">
              Configure the programme, verification signal, and modeled business outcome in one flow.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              This should feel like an operating surface for life insurers, not a toy campaign builder.
              It defaults to Hong Kong and Japan, assumes the insurer is bringing the members, and leads with claims reduction as the primary commercial story.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 text-2xs text-tertiary md:w-[250px]">
            <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
              <div className="flex items-center gap-2 text-secondary">
                <Shield size={12} className="text-accent" />
                Binary receipts only
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
              <div className="flex items-center gap-2 text-secondary">
                <Globe2 size={12} className="text-accent" />
                Default markets: Hong Kong + Japan
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                i === step ? 'bg-accent/10 text-accent' :
                i < step ? 'text-secondary hover:text-primary cursor-pointer' :
                'text-tertiary cursor-default'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-2xs font-mono ${
                i < step ? 'bg-accent/20 text-accent' :
                i === step ? 'bg-accent text-base' :
                'bg-hover text-tertiary'
              }`}>
                {i < step ? <Check size={10} /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="card">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="metric-label block mb-1.5">Operating Model</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm({ ...form, type: 'snapshot' })}
                    className={`card text-left transition-colors ${form.type === 'snapshot' ? 'border-accent/40 bg-accent/5' : 'hover:bg-hover'}`}
                  >
                    <Zap size={16} className={form.type === 'snapshot' ? 'text-accent' : 'text-tertiary'} />
                    <div className="mt-2">
                      <span className="text-sm font-medium text-primary">Snapshot Verification</span>
                      <p className="text-xs text-tertiary mt-0.5">One binary receipt for underwriting, pre-qual, or renewal moments.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: 'stream' })}
                    className={`card text-left transition-colors ${form.type === 'stream' ? 'border-accent/40 bg-accent/5' : 'hover:bg-hover'}`}
                  >
                    <Radio size={16} className={form.type === 'stream' ? 'text-accent' : 'text-tertiary'} />
                    <div className="mt-2">
                      <span className="text-sm font-medium text-primary">Continuous Outcome Stream</span>
                      <p className="text-xs text-tertiary mt-0.5">Ambient member participation with recurring verified intervals over 90-180 days.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="metric-label block mb-1.5">Campaign Name</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors((prev) => {
                      const { name: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  placeholder="e.g., Resting Heart Rate Recovery Programme"
                  className={`input-field w-full ${errors.name ? 'border-error' : ''}`}
                />
                {errors.name && <span className="text-2xs text-error mt-0.5 block">{errors.name}</span>}
              </div>

              <div>
                <label className="metric-label block mb-1.5">Business Objective</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the insurer outcome this campaign is designed to unlock..."
                  className="input-field w-full h-[90px] resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="metric-label block mb-1.5">Primary Business Motion</label>
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_USE_CASE_ORDER.map((uc) => (
                    <button
                      key={uc}
                      onClick={() => setForm({ ...form, useCase: uc })}
                      className={`badge cursor-pointer ${form.useCase === uc ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
                    >
                      {USE_CASE_LABELS[uc]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-hover/60 px-4 py-3">
                <div className="text-2xs uppercase tracking-wider text-tertiary">What buyers should understand here</div>
                <p className="mt-1 text-sm text-secondary leading-relaxed">
                  The campaign is the operating center of the product. One configuration surface leads with claims reduction,
                  supports underwriting and pre-policy moments, and still extends into engagement, renewal, lead gen, and long-term wellness infrastructure.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="metric-label block mb-1.5">Verification Signal</label>
                <select
                  value={form.metric}
                  onChange={(e) => {
                    const newMetric = e.target.value as HealthMetric;
                    setForm((f) => ({
                      ...f,
                      metric: newMetric,
                      useCase: f.useCase || (newMetric ? suggestUseCase(newMetric) : ''),
                    }));
                  }}
                  className="input-field w-full"
                >
                  <option value="">Select metric...</option>
                  {getMetricsGroupedByCategory().map((group) => (
                    <optgroup key={group.category} label={group.label}>
                      {group.metrics.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="metric-label block mb-1.5">Operator</label>
                  <select
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="gte">Greater than or equal</option>
                    <option value="lte">Less than or equal</option>
                    <option value="eq">Equal to</option>
                    <option value="between">Between</option>
                  </select>
                </div>
                <div>
                  <label className="metric-label block mb-1.5">
                    Target {form.metric && `(${HEALTH_METRIC_UNITS[form.metric as HealthMetric]})`}
                  </label>
                  <input
                    type="number"
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    placeholder="e.g., 60"
                    className="input-field w-full font-mono"
                  />
                </div>
              </div>

              {form.type === 'stream' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="metric-label block mb-1.5">Frequency</label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="metric-label block mb-1.5">Duration (days)</label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="input-field w-full font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-hover/60 px-4 py-3">
                <div className="text-2xs uppercase tracking-wider text-tertiary">Receipt contract</div>
                <p className="mt-1 text-sm text-secondary leading-relaxed">
                  The insurer does not receive a raw metric history. It receives a yes/no verification outcome against the rule configured here.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="metric-label block mb-1.5">Target Markets</label>
                <div className="flex flex-wrap gap-2">
                  {['Hong Kong', 'Japan', 'Singapore', 'Australia'].map((market) => (
                    <button
                      key={market}
                      onClick={() => {
                        const next = form.markets.includes(market)
                          ? form.markets.filter((m) => m !== market)
                          : [...form.markets, market];
                        setForm({ ...form, markets: next });
                      }}
                      className={`badge cursor-pointer ${form.markets.includes(market) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
                    >
                      {market}
                    </button>
                  ))}
                </div>
                {errors.markets && <span className="text-2xs text-error mt-0.5 block">{errors.markets}</span>}
              </div>

              <div>
                <label className="metric-label block mb-1.5">Health Score Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.healthScoreMin}
                    onChange={(e) => setForm({ ...form, healthScoreMin: e.target.value })}
                    className="input-field w-20 font-mono"
                  />
                  <span className="text-tertiary">—</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.healthScoreMax}
                    onChange={(e) => setForm({ ...form, healthScoreMax: e.target.value })}
                    className="input-field w-20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="metric-label block mb-1.5">Reputation Tiers</label>
                <div className="flex flex-wrap gap-2">
                  {REPUTATION_TIER_ORDER.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        const next = form.reputationTiers.includes(tier)
                          ? form.reputationTiers.filter((t) => t !== tier)
                          : [...form.reputationTiers, tier];
                        setForm({ ...form, reputationTiers: next });
                      }}
                      className={`badge cursor-pointer ${form.reputationTiers.includes(tier) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
                    >
                      {REPUTATION_TIER_LABELS[tier]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="metric-label block mb-1.5">Required Data Sources</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(DATA_SOURCE_LABELS) as [DataSource, string][]).map(([key, label]) => {
                    const isSelected = form.dataSources.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          const next = isSelected
                            ? form.dataSources.filter((d) => d !== key)
                            : [...form.dataSources, key];
                          setForm({ ...form, dataSources: next });
                        }}
                        className={`badge cursor-pointer ${isSelected ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="metric-label block mb-1.5">Age Ranges</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        const next = form.ageRanges.includes(range)
                          ? form.ageRanges.filter((r) => r !== range)
                          : [...form.ageRanges, range];
                        setForm({ ...form, ageRanges: next });
                      }}
                      className={`badge cursor-pointer ${form.ageRanges.includes(range) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-hover/60 px-4 py-3">
                <div className="text-2xs uppercase tracking-wider text-tertiary">Cohort strategy</div>
                <p className="mt-1 text-sm text-secondary leading-relaxed">
                  Reach, trust tier, source quality, and market availability combine into a targetable cohort with commercial relevance for claims reduction first and underwriting support second.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="metric-label block mb-1.5">Points per Verification</label>
                <input
                  type="number"
                  value={form.pointsPerVerification}
                  onChange={(e) => setForm({ ...form, pointsPerVerification: e.target.value })}
                  className="input-field w-40 font-mono"
                />
                <span className="text-2xs text-tertiary ml-2">HP</span>
              </div>

              <div>
                <label className="metric-label block mb-1.5">Budget Ceiling</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-tertiary">$</span>
                  <input
                    type="number"
                    value={form.budgetCeiling}
                    onChange={(e) => setForm({ ...form, budgetCeiling: e.target.value })}
                    className="input-field w-40 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="metric-label block mb-1.5">Max Participants</label>
                <input
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                  className="input-field w-40 font-mono"
                />
              </div>

              <div className="rounded-xl border border-border bg-hover/60 px-4 py-3">
                <div className="text-2xs uppercase tracking-wider text-tertiary">Incentive posture</div>
                <p className="mt-1 text-sm text-secondary leading-relaxed">
                  Rewards stay visible, but secondary. The primary commercial logic remains downstream insurer value, not gamified member engagement in isolation.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="metric-label block">Review & Launch</span>
                <p className="mt-1 text-sm text-secondary">
                  Final buyer-facing summary. This should read like a credible executive brief for a life insurer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="card-elevated">
                  <span className="text-2xs text-tertiary">Name</span>
                  <div className="text-sm text-primary">{form.name || '—'}</div>
                </div>
                <div className="card-elevated">
                  <span className="text-2xs text-tertiary">Type</span>
                  <div className="text-sm text-primary capitalize">{form.type || '—'}</div>
                </div>
                <div className="card-elevated">
                  <span className="text-2xs text-tertiary block mb-1">Challenge</span>
                  {form.metric ? (
                    <ChallengeDisplay challenge={{
                      metric: form.metric as HealthMetric,
                      operator: form.operator as ChallengeOperator,
                      target: Number(form.target) || 0,
                      unit: HEALTH_METRIC_UNITS[form.metric as HealthMetric],
                    }} />
                  ) : (
                    <div className="text-sm text-primary">—</div>
                  )}
                </div>
                <div className="card-elevated">
                  <span className="text-2xs text-tertiary">Programme Budget</span>
                  <div className="text-sm text-primary font-mono">${form.budgetCeiling}</div>
                </div>
                <div className="card-elevated">
                  <span className="text-2xs text-tertiary">Points/Verification</span>
                  <div className="text-sm text-primary font-mono">{form.pointsPerVerification} HP</div>
                </div>
                <div className="card-elevated">
                  <span className="text-2xs text-tertiary">Markets</span>
                  <div className="text-sm text-primary">{form.markets.join(' / ') || '—'}</div>
                </div>
              </div>

              <div className="rounded-xl border border-accent/20 bg-accent-muted px-4 py-4">
                <div className="text-2xs uppercase tracking-wider text-accent">Executive launch framing</div>
                <p className="mt-1 text-sm text-secondary leading-relaxed">
                  This campaign gives the insurer a self-serve way to configure a measurable health programme, target a consented cohort,
                  and model business value before launch. The operating model leads with claims reduction while remaining commercially credible for underwriting,
                  engagement, and lead-generation conversations.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <ActuarialROICalculator
            metric={form.metric}
            type={form.type}
            useCase={form.useCase}
            maxParticipants={Number(form.maxParticipants) || 0}
            budgetCeiling={Number(form.budgetCeiling) || 0}
            onApplySuggestedHP={(hp) => setForm((f) => ({ ...f, pointsPerVerification: String(hp) }))}
          />

          <div className="card">
            <div className="metric-label mb-2">Live campaign summary</div>
            <div className="space-y-2 text-xs text-secondary">
              <div className="flex items-center justify-between">
                <span>Name</span>
                <span className="font-medium text-primary">{form.name || 'Untitled campaign'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Markets</span>
                <span className="font-medium text-primary">{form.markets.join(' / ') || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Metric</span>
                <span className="font-medium text-primary">{form.metric || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Participants</span>
                <span className="font-medium text-primary">{form.maxParticipants}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="btn-ghost text-xs disabled:opacity-40"
        >
          <ArrowLeft size={13} />
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="btn-primary text-xs disabled:opacity-40"
          >
            Continue
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            className="btn-primary text-xs"
          >
            Launch Campaign
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
