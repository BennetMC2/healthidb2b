import { Target, Settings } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import MetricSelector from '../../components/MetricSelector';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { getCampaignTemplate } from '../../data/campaignTemplates';
import { getOverlapDiscount } from '../../engine/campaignCombiner';
import { HORIZON_OPTIONS } from '../../constants';
import type { CampaignUseCase } from '@/types';

const USE_CASE_OPTIONS: { value: CampaignUseCase; label: string; description: string }[] = [
  { value: 'claims_reduction', label: 'Claims Reduction', description: 'Reduce claims through healthier lives' },
  { value: 'acquisition', label: 'Acquisition', description: 'Risk-adjusted customer acquisition' },
  { value: 'underwriting', label: 'Underwriting', description: 'Proof completion and faster risk selection' },
  { value: 'renewal', label: 'Renewal', description: 'Retention and renewal efficiency' },
  { value: 'dynamic_premium', label: 'Dynamic Premium', description: 'Behaviour-linked pricing discipline' },
];

export default function CampaignSelectChapter() {
  const config = useSimulatorStore((s) => s.config);
  const updateConfig = useSimulatorStore((s) => s.updateConfig);
  const selectedCampaigns = config.selectedCampaigns;
  const overlapDiscount = getOverlapDiscount(selectedCampaigns.length);

  return (
    <ChapterLayout
      chapter={3}
      canProceed={selectedCampaigns.length >= 1}
    >
      {/* Campaign grid */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Target size={15} className="text-accent" />
          Select 1–3 Campaigns
        </div>
        <p className="mt-1 text-xs text-tertiary">
          Each campaign targets a specific health metric with its own evidence chain.
          {selectedCampaigns.length === 0 && ' Select at least one to proceed.'}
        </p>
        <MetricSelector className="mt-4" />
      </div>

      {/* Selected summary */}
      {selectedCampaigns.length > 0 && (
        <div className="card border-accent/20">
          <div className="text-sm font-semibold text-primary">
            {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''} selected
          </div>
          <div className="mt-2 space-y-1">
            {selectedCampaigns.map((id) => {
              const template = getCampaignTemplate(id);
              return template ? (
                <div key={id} className="flex items-center gap-2 text-xs text-secondary">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {template.name} ({template.metric})
                </div>
              ) : null;
            })}
          </div>
          {selectedCampaigns.length > 1 && (
            <div className="mt-3 rounded-lg bg-hover px-3 py-2 text-xs text-tertiary">
              Multi-campaign overlap discount: <span className="font-mono font-semibold text-primary">{(overlapDiscount * 100).toFixed(0)}%</span> applied
              to prevent double-counting across health pathways.
            </div>
          )}
        </div>
      )}

      {/* Parameters */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Settings size={15} className="text-accent" />
          Economic Parameters
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {/* Use case */}
          <div>
            <label className="text-2xs text-tertiary block mb-1.5">Use Case</label>
            <select
              value={config.useCase}
              onChange={(e) => updateConfig({ useCase: e.target.value as CampaignUseCase })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
            >
              {USE_CASE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-1 text-2xs text-tertiary">
              {USE_CASE_OPTIONS.find((o) => o.value === config.useCase)?.description}
            </p>
          </div>

          {/* Reward ceiling */}
          <div>
            <label className="text-2xs text-tertiary block mb-1.5">
              Reward Ceiling: <span className="font-mono text-primary">{(config.rewardCeilingPct * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min={30}
              max={90}
              value={config.rewardCeilingPct * 100}
              onChange={(e) => updateConfig({ rewardCeilingPct: Number(e.target.value) / 100 })}
              className="w-full accent-accent"
            />
            <p className="mt-1 text-2xs text-tertiary">
              % of gross value allocated to member rewards
            </p>
          </div>

          {/* Horizon */}
          <div>
            <label className="text-2xs text-tertiary block mb-1.5">Projection Horizon</label>
            <div className="flex gap-1.5">
              {HORIZON_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  onClick={() => updateConfig({ horizonMonths: opt.months })}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    config.horizonMonths === opt.months
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-secondary hover:border-accent/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedCampaigns.length === 0 && (
        <EvidenceCallout title="Select campaigns to proceed" type="warning">
          Pick 1–3 campaigns from the grid above. Each campaign uses its own metric-specific
          evidence chain, dose-response function, and actuarial claims data.
        </EvidenceCallout>
      )}
    </ChapterLayout>
  );
}
