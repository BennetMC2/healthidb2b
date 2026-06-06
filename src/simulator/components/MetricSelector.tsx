import { HeartPulse, Activity, Moon, Wind, TestTube2, Gauge, Zap, Heart } from 'lucide-react';
import { CAMPAIGN_TEMPLATES, type SimulatorCampaign } from '../data/campaignTemplates';
import { getMetricEvidence } from '../data/metricEvidence';
import { METRIC_CATEGORY_COLORS, METRIC_CATEGORY_LABELS } from '../constants';
import { useSimulatorStore } from '../store/useSimulatorStore';

const ICON_MAP: Record<string, React.ReactNode> = {
  'heart-pulse': <HeartPulse size={18} />,
  'activity': <Activity size={18} />,
  'moon': <Moon size={18} />,
  'heart': <Heart size={18} />,
  'zap': <Zap size={18} />,
  'test-tube': <TestTube2 size={18} />,
  'gauge': <Gauge size={18} />,
  'wind': <Wind size={18} />,
};

interface MetricSelectorProps {
  className?: string;
}

export default function MetricSelector({ className = '' }: MetricSelectorProps) {
  const selectedCampaigns = useSimulatorStore((s) => s.config.selectedCampaigns);
  const toggleCampaign = useSimulatorStore((s) => s.toggleCampaign);

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {CAMPAIGN_TEMPLATES.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          isSelected={selectedCampaigns.includes(campaign.id)}
          isDisabled={!selectedCampaigns.includes(campaign.id) && selectedCampaigns.length >= 3}
          onToggle={() => toggleCampaign(campaign.id)}
        />
      ))}
    </div>
  );
}

function CampaignCard({
  campaign,
  isSelected,
  isDisabled,
  onToggle,
}: {
  campaign: SimulatorCampaign;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  const evidence = getMetricEvidence(campaign.metric);
  const categoryColor = METRIC_CATEGORY_COLORS[campaign.category];

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className={`group relative rounded-xl border p-4 text-left transition-all ${
        isSelected
          ? 'border-accent bg-accent/8 ring-1 ring-accent/30'
          : isDisabled
            ? 'border-border bg-surface/40 opacity-50 cursor-not-allowed'
            : 'border-border bg-surface/60 hover:border-accent/40 hover:bg-accent/4'
      }`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-semibold">
          {/* checkmark */}
          &#10003;
        </div>
      )}

      {/* Icon + category badge */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
        >
          {ICON_MAP[campaign.iconHint] ?? <Activity size={18} />}
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-2xs font-medium"
          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
        >
          {METRIC_CATEGORY_LABELS[campaign.category]}
        </span>
      </div>

      {/* Name + description */}
      <div className="mt-3">
        <div className="text-sm font-semibold text-primary">{campaign.name}</div>
        <p className="mt-1 text-xs text-tertiary leading-relaxed line-clamp-2">{campaign.description}</p>
      </div>

      {/* Evidence badge */}
      {evidence && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${
            evidence.evidenceLevel === 'high'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : evidence.evidenceLevel === 'medium'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-slate-500/10 text-slate-500'
          }`}>
            {evidence.evidenceLevel} evidence
          </span>
          <span className="text-2xs text-tertiary">
            n={evidence.doseResponseSampleSize.toLocaleString()}
          </span>
        </div>
      )}

      {/* Value pitch */}
      <p className="mt-2 text-2xs text-secondary leading-relaxed">{campaign.valuePitch}</p>
    </button>
  );
}
