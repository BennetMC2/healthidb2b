import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap, Radio } from 'lucide-react';
import { HEALTH_METRIC_LABELS, HEALTH_METRIC_UNITS, DATA_SOURCE_LABELS, REPUTATION_TIER_LABELS, REPUTATION_TIER_ORDER, AGE_RANGES } from '@/utils/constants';
import type { CampaignType, HealthMetric, DataSource, ReputationTier } from '@/types';

const steps = [
  { id: 'type', label: 'Type' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'cohort', label: 'Targeting' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'review', label: 'Review' },
];

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '' as CampaignType | '',
    metric: '' as HealthMetric | '',
    operator: 'gte' as string,
    target: '',
    frequency: 'daily' as string,
    duration: '30',
    healthScoreMin: '0',
    healthScoreMax: '100',
    reputationTiers: [] as ReputationTier[],
    dataSources: [] as DataSource[],
    ageRanges: [] as string[],
    pointsPerVerification: '500',
    budgetCeiling: '25000',
    maxParticipants: '1000',
  });

  const canNext = () => {
    switch (step) {
      case 0: return form.type !== '' && form.name.length > 0;
      case 1: return form.metric !== '' && form.target !== '';
      case 2: return true;
      case 3: return form.pointsPerVerification !== '' && form.budgetCeiling !== '';
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full max-w-[800px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/campaigns')} className="btn-ghost p-1">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-lg font-semibold text-primary">Create Campaign</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
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

      {/* Step Content */}
      <div className="flex-1 card overflow-auto scrollbar-thin">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="metric-label block mb-1.5">Campaign Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm({ ...form, type: 'snapshot' })}
                  className={`card text-left transition-colors ${form.type === 'snapshot' ? 'border-accent/40 bg-accent/5' : 'hover:bg-hover'}`}
                >
                  <Zap size={16} className={form.type === 'snapshot' ? 'text-accent' : 'text-tertiary'} />
                  <div className="mt-2">
                    <span className="text-sm font-medium text-primary">Snapshot</span>
                    <p className="text-xs text-tertiary mt-0.5">One-time proof challenge. Users verify a single condition.</p>
                  </div>
                </button>
                <button
                  onClick={() => setForm({ ...form, type: 'stream' })}
                  className={`card text-left transition-colors ${form.type === 'stream' ? 'border-accent/40 bg-accent/5' : 'hover:bg-hover'}`}
                >
                  <Radio size={16} className={form.type === 'stream' ? 'text-accent' : 'text-tertiary'} />
                  <div className="mt-2">
                    <span className="text-sm font-medium text-primary">Stream</span>
                    <p className="text-xs text-tertiary mt-0.5">Continuous verification subscription. Ongoing proof delivery.</p>
                  </div>
                </button>
              </div>
            </div>
            <div>
              <label className="metric-label block mb-1.5">Campaign Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Physical Screening Verification"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="metric-label block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the campaign objective..."
                className="input-field w-full h-[80px] resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="metric-label block mb-1.5">Health Metric</label>
              <select
                value={form.metric}
                onChange={(e) => setForm({ ...form, metric: e.target.value as HealthMetric })}
                className="input-field w-full"
              >
                <option value="">Select metric...</option>
                {Object.entries(HEALTH_METRIC_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                  placeholder="e.g., 8000"
                  className="input-field w-full font-mono"
                />
              </div>
            </div>
            {form.type === 'stream' && (
              <div className="grid grid-cols-2 gap-3">
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="metric-label block mb-1.5">Health Score Range</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={form.healthScoreMin} onChange={(e) => setForm({ ...form, healthScoreMin: e.target.value })} className="input-field w-20 font-mono" />
                <span className="text-tertiary">—</span>
                <input type="number" min={0} max={100} value={form.healthScoreMax} onChange={(e) => setForm({ ...form, healthScoreMax: e.target.value })} className="input-field w-20 font-mono" />
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
                {(Object.entries(DATA_SOURCE_LABELS) as [DataSource, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      const next = form.dataSources.includes(key)
                        ? form.dataSources.filter((d) => d !== key)
                        : [...form.dataSources, key];
                      setForm({ ...form, dataSources: next });
                    }}
                    className={`badge cursor-pointer ${form.dataSources.includes(key) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-elevated border-border text-tertiary'}`}
                  >
                    {label}
                  </button>
                ))}
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
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <span className="metric-label block">Review & Launch</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated">
                <span className="text-2xs text-tertiary">Name</span>
                <div className="text-sm text-primary">{form.name || '—'}</div>
              </div>
              <div className="card-elevated">
                <span className="text-2xs text-tertiary">Type</span>
                <div className="text-sm text-primary capitalize">{form.type || '—'}</div>
              </div>
              <div className="card-elevated">
                <span className="text-2xs text-tertiary">Metric</span>
                <div className="text-sm text-primary">
                  {form.metric ? HEALTH_METRIC_LABELS[form.metric as HealthMetric] : '—'} {form.operator} {form.target}
                </div>
              </div>
              <div className="card-elevated">
                <span className="text-2xs text-tertiary">Budget</span>
                <div className="text-sm text-primary font-mono">${form.budgetCeiling}</div>
              </div>
              <div className="card-elevated">
                <span className="text-2xs text-tertiary">Points/Verification</span>
                <div className="text-sm text-primary font-mono">{form.pointsPerVerification} HP</div>
              </div>
              <div className="card-elevated">
                <span className="text-2xs text-tertiary">Max Participants</span>
                <div className="text-sm text-primary font-mono">{form.maxParticipants}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="btn-ghost text-xs disabled:opacity-30"
        >
          <ArrowLeft size={13} /> Back
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            className="btn-primary text-xs disabled:opacity-30"
          >
            Next <ArrowRight size={13} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/campaigns')}
            className="btn-primary text-xs"
          >
            <Check size={13} /> Launch Campaign
          </button>
        )}
      </div>
    </div>
  );
}
