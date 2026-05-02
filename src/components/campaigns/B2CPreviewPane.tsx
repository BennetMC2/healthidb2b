import { Bell, Moon } from 'lucide-react';
import { HEALTH_METRIC_LABELS } from '@/utils/constants';
import { buildConsumerCampaignPayload, buildConsumerChallengeUrl } from '@/lib/consumerCampaigns';
import type { Campaign, Partner } from '@/types';

const sparklineData = [
  { x: 0, y: 72 }, { x: 1, y: 68 }, { x: 2, y: 75 },
  { x: 3, y: 65 }, { x: 4, y: 70 }, { x: 5, y: 62 },
  { x: 6, y: 78 }, { x: 7, y: 60 }, { x: 8, y: 73 },
  { x: 9, y: 55 }, { x: 10, y: 68 }, { x: 11, y: 80 },
];

// Helper to get CSS variable color as rgb string
function getCSSColorAsRgb(varName: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value ? `rgb(${value})` : '#E07A5F';
}

function MiniSparkline() {
  const width = 200;
  const height = 60;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const minY = Math.min(...sparklineData.map((d) => d.y));
  const maxY = Math.max(...sparklineData.map((d) => d.y));

  const accentColor = getCSSColorAsRgb('--a-accent');

  const points = sparklineData
    .map((d, i) => {
      const x = padding + (i / (sparklineData.length - 1)) * chartW;
      const y = padding + (1 - (d.y - minY) / (maxY - minY)) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#spark-grad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface B2CPreviewPaneProps {
  campaign: Campaign;
  partner: Partner;
}

export default function B2CPreviewPane({ campaign, partner }: B2CPreviewPaneProps) {
  const payload = buildConsumerCampaignPayload(campaign, partner);
  const memberAppInviteUrl = campaign.b2cSync?.consumerAppUrl || buildConsumerChallengeUrl(payload);
  const metricLabel = HEALTH_METRIC_LABELS[campaign.challenge.metric];
  const sync = campaign.b2cSync;

  return (
    <div className="card w-full 2xl:w-[260px] flex-shrink-0">
      <div className="text-2xs text-tertiary uppercase tracking-wider font-medium mb-3">
        Member Experience
      </div>

      {/* Phone mockup frame */}
      <div className="rounded-xl border-2 border-border bg-base p-3 mx-auto max-w-[220px]">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xs font-mono text-tertiary">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-tertiary/30 rounded-sm" />
            <div className="w-3 h-1.5 bg-tertiary/30 rounded-sm" />
          </div>
        </div>

        {/* Notification */}
        <div className="rounded-lg border border-accent/20 bg-accent-muted p-2 mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Bell size={10} className="text-accent" />
            <span className="text-2xs font-semibold text-primary">{campaign.name}</span>
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            {partner.label} invited eligible members into a {metricLabel.toLowerCase()} challenge. The member experience converts the insurer rule into a guided verification flow.
          </p>
        </div>

        {/* Chart */}
        <div className="rounded-lg border border-border bg-surface p-2">
          <div className="flex items-center gap-1 mb-1">
            <Moon size={10} className="text-accent" />
            <span className="text-2xs font-medium text-primary">Recovery Trend</span>
          </div>
          <MiniSparkline />
          <div className="flex justify-between mt-1">
            <span className="text-2xs text-tertiary">Week 1</span>
            <span className="text-2xs text-tertiary">Week 12</span>
          </div>
        </div>

        {/* Home bar */}
        <div className="w-12 h-1 bg-border-light rounded-full mx-auto mt-3" />
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-[11px] leading-relaxed text-tertiary">
          Opens the member experience at the route used for campaign delivery.
        </p>
        {sync && (
          <div className="rounded-xl border border-border bg-surface/80 px-3 py-2 text-[11px] leading-relaxed text-tertiary">
            <div className="text-secondary">
              {sync.inviteCount ?? 0} invited · {sync.acceptedCount ?? 0} accepted · {sync.verifiedCount ?? 0} verified
            </div>
            <div className="mt-1">
              {sync.dispatchStatus === 'error'
                ? sync.lastError || 'Consumer dispatch did not complete cleanly.'
                : sync.proofOpportunityCreated
                  ? 'Verification opportunity created in HealthID.'
                  : 'Invite delivery is live, but verification is not yet mapped for this metric.'}
            </div>
            {(sync.redemptionCount ?? 0) > 0 && (
              <div className="mt-1 text-secondary">
                {sync.redemptionCount} premium reward redemption{sync.redemptionCount === 1 ? '' : 's'} recorded in HealthID.
              </div>
            )}
          </div>
        )}
        <a
          href={memberAppInviteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90"
        >
          Open member experience
        </a>
      </div>
    </div>
  );
}
