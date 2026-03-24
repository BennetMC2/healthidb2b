import type { Campaign, StreamCampaign } from '@/types';
import { UseCaseBadge, TypeBadge, StatusBadge, ChallengeDisplay, DataSourceBadge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';

interface CampaignPopoverProps {
  campaign: Campaign;
  children: React.ReactNode;
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
            <span className="text-tertiary block mb-0.5">Challenge</span>
            <ChallengeDisplay challenge={campaign.challenge} additionalChallenges={campaign.additionalChallenges} />
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
            <span className="text-tertiary block mb-0.5">Data Sources</span>
            <div className="flex flex-wrap gap-1">
              {(campaign.targeting.dataSources ?? []).slice(0, 3).map((s) => (
                <DataSourceBadge key={s} source={s} />
              ))}
              {(campaign.targeting.dataSources?.length ?? 0) > 3 && (
                <span className="text-2xs text-tertiary self-center">+{(campaign.targeting.dataSources?.length ?? 0) - 3}</span>
              )}
              {(!campaign.targeting.dataSources || campaign.targeting.dataSources.length === 0) && (
                <span className="text-2xs text-secondary">Any source</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
