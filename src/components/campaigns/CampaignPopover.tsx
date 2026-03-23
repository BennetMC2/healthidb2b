import type { Campaign, StreamCampaign } from '@/types';
import { UseCaseBadge, TypeBadge, StatusBadge } from '@/components/ui/Badge';
import { HEALTH_METRIC_LABELS, DATA_SOURCE_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/format';

interface CampaignPopoverProps {
  campaign: Campaign;
  children: React.ReactNode;
}

function formatOperator(op: string): string {
  switch (op) {
    case 'gte': return '≥';
    case 'lte': return '≤';
    case 'eq': return '=';
    case 'between': return 'between';
    default: return op;
  }
}

function formatCriteria(criteria: Campaign['challenge']): string {
  const { metric, operator, target, targetMax, unit } = criteria;
  const label = HEALTH_METRIC_LABELS[metric];
  if (operator === 'between' && targetMax != null) {
    return `${label} ${target}–${targetMax} ${unit}`;
  }
  return `${label} ${formatOperator(operator)} ${target} ${unit}`;
}

function formatChallenge(campaign: Campaign): string {
  return formatCriteria(campaign.challenge);
}

function formatDuration(campaign: Campaign): string {
  if (campaign.type === 'stream') {
    const s = campaign as StreamCampaign;
    return `${s.streamDuration} days · ${s.frequency}`;
  }
  const start = formatDate(campaign.startDate);
  if (campaign.endDate) return `${start} — ${formatDate(campaign.endDate)}`;
  return `From ${start}`;
}

function formatRegions(campaign: Campaign): string {
  const regions = campaign.targeting.regions;
  if (!regions || regions.length === 0) return 'All regions';
  if (regions.length <= 2) return regions.join(', ');
  return `${regions[0]}, ${regions[1]} +${regions.length - 2}`;
}

function formatSources(campaign: Campaign): string {
  const sources = campaign.targeting.dataSources;
  if (!sources || sources.length === 0) return 'Any source';
  if (sources.length <= 2) return sources.map((s) => DATA_SOURCE_LABELS[s]).join(', ');
  return `${DATA_SOURCE_LABELS[sources[0]]}, ${DATA_SOURCE_LABELS[sources[1]]} +${sources.length - 2}`;
}

export default function CampaignPopover({ campaign, children }: CampaignPopoverProps) {
  return (
    <div className="relative group">
      {children}
      <div
        className="
          absolute left-0 top-full mt-1 z-50
          w-[380px] p-3 rounded-md
          bg-elevated border border-border shadow-lg
          opacity-0 pointer-events-none scale-[0.98]
          group-hover:opacity-100 group-hover:scale-100
          transition-all duration-150 origin-top-left
        "
      >
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2">
          <UseCaseBadge useCase={campaign.useCase} />
          <TypeBadge type={campaign.type} />
          <StatusBadge status={campaign.status} />
        </div>

        {/* Purpose */}
        <p className="text-xs text-secondary leading-relaxed line-clamp-4 mb-3">
          {campaign.purpose}
        </p>

        {/* Characteristics grid */}
        <div className="grid grid-cols-2 gap-2 text-2xs">
          <div>
            <span className="text-tertiary block">Challenge</span>
            <span className="text-secondary font-medium">{formatChallenge(campaign)}</span>
            {campaign.additionalChallenges?.map((ac, i) => (
              <span key={i} className="text-secondary font-medium block mt-0.5">+ {formatCriteria(ac)}</span>
            ))}
          </div>
          <div>
            <span className="text-tertiary block">Duration</span>
            <span className="text-secondary font-medium">{formatDuration(campaign)}</span>
          </div>
          <div>
            <span className="text-tertiary block">Regions</span>
            <span className="text-secondary font-medium">{formatRegions(campaign)}</span>
          </div>
          <div>
            <span className="text-tertiary block">Data Sources</span>
            <span className="text-secondary font-medium">{formatSources(campaign)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
