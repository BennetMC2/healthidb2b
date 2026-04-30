import type { Campaign, HealthMetric, Partner } from '@/types';

export type ConsumerDispatchStatus = 'pending' | 'dispatched' | 'partial' | 'error';

export interface ConsumerCampaignNotificationChannels {
  telegram: number;
  push: number;
  none: number;
}

export interface ConsumerCampaignPayload {
  externalCampaignId: string;
  insurerName: string;
  insurerId?: string;
  campaignName: string;
  objective: string;
  market: string;
  campaignType: 'snapshot' | 'stream';
  metric: string;
  operator: 'gte' | 'lte' | 'eq' | 'between';
  target: number;
  unit: string;
  durationDays: number;
  rewardHp: number;
  budgetCeiling: number;
  maxParticipants: number;
  dataSources: string[];
  memberAction: string;
  rewardCopy: string;
  launchedAt: string;
}

export interface ConsumerCampaignDispatchResponse {
  consumerCampaignId: string;
  externalCampaignId: string;
  dispatchStatus: ConsumerDispatchStatus;
  eligibleUsers: number;
  inviteCount: number;
  acceptedCount: number;
  verifiedCount: number;
  rewardedCount: number;
  proofOpportunityCreated: boolean;
  proofOpportunityId?: string;
  memberAppUrl: string;
  channels: ConsumerCampaignNotificationChannels;
  dispatchedAt: string;
  error?: string;
  memberSummaries?: ConsumerCampaignMemberSummary[];
  timeline?: ConsumerCampaignTimelineEvent[];
  redemptionCount?: number;
}

export interface ConsumerCampaignRedemption {
  partner: string;
  item: string;
  hpCost: number;
  requestedAt: string;
  status: 'requested' | 'completed';
}

export interface ConsumerCampaignMemberSummary {
  memberId: string;
  anonymizedId: string;
  memberType: 'policyholder' | 'dependent' | 'applicant';
  market: string;
  challengeStatus: 'invited' | 'accepted' | 'verified' | 'rewarded';
  proofStatus: 'none' | 'verified';
  rewardStatus: 'none' | 'earned' | 'redeemed';
  trend: 'improving' | 'stable' | 'watch';
  connectedSources: string[];
  fidelity: 'low' | 'medium' | 'high';
  healthBand: 'emerging' | 'steady' | 'strong';
  healthScore?: number;
  latestProofAt?: string;
  latestRewardAt?: string;
  latestRedemption?: ConsumerCampaignRedemption;
}

export interface ConsumerCampaignTimelineEvent {
  id: string;
  memberId: string;
  anonymizedId: string;
  type: 'invited' | 'accepted' | 'proof_verified' | 'reward_issued' | 'reward_redeemed';
  title: string;
  detail: string;
  timestamp: string;
}

const DEFAULT_CONSUMER_APP_URL = import.meta.env.VITE_CONSUMER_APP_URL || 'http://localhost:3000';
const DEFAULT_DEPLOY_ENDPOINT = import.meta.env.VITE_CONSUMER_CAMPAIGN_DEPLOY_URL || `${DEFAULT_CONSUMER_APP_URL}/api/campaigns/deploy`;
const DEFAULT_STATUS_ENDPOINT = import.meta.env.VITE_CONSUMER_CAMPAIGN_STATUS_URL || `${DEFAULT_CONSUMER_APP_URL}/api/campaigns/status`;
const INTEGRATION_TOKEN = import.meta.env.VITE_CONSUMER_INTEGRATION_TOKEN;

const METRIC_MEMBER_ACTION: Partial<Record<HealthMetric, string>> = {
  heart_rate_resting: 'Keep recovery steady and let HealthID verify lower resting heart rate over time.',
  hrv: 'Stay consistent with recovery habits and let HealthID verify stronger HRV.',
  sleep_hours: 'Protect sleep consistency so HealthID can verify your average overnight duration.',
  sleep_quality: 'Improve your sleep quality so HealthID can verify a better recovery pattern.',
  active_minutes: 'Build steady training momentum and let HealthID verify your active minutes.',
  spo2: 'Keep your wearable connected and maintain stable oxygen saturation for verification.',
};

function defaultRewardCopy(metric: string, rewardHp: number): string {
  if (metric === 'heart_rate_resting') return `${rewardHp} HP for verified recovery improvements`;
  if (metric === 'hrv') return `${rewardHp} HP for verified recovery resilience`;
  if (metric === 'sleep_hours' || metric === 'sleep_quality') return `${rewardHp} HP for verified sleep consistency`;
  return `${rewardHp} HP for verified healthy progress`;
}

function defaultMemberAction(metric: HealthMetric): string {
  return METRIC_MEMBER_ACTION[metric] ?? 'Keep your sources connected and respond when the programme is ready to verify your progress.';
}

function mapCampaignDuration(campaign: Campaign): number {
  if (campaign.type === 'stream' && 'streamDuration' in campaign && typeof campaign.streamDuration === 'number') {
    return campaign.streamDuration;
  }

  if (campaign.type === 'snapshot') {
    return 14;
  }

  return 90;
}

export function buildConsumerCampaignPayload(campaign: Campaign, partner: Partner): ConsumerCampaignPayload {
  const durationDays = mapCampaignDuration(campaign);
  const rewardHp = campaign.rewards.pointsPerVerification;

  return {
    externalCampaignId: campaign.id,
    insurerName: partner.label,
    insurerId: partner.id,
    campaignName: campaign.name,
    objective: campaign.description || campaign.purpose,
    market: campaign.targeting.regions?.join(' / ') || 'Open market',
    campaignType: campaign.type,
    metric: campaign.challenge.metric,
    operator: campaign.challenge.operator,
    target: campaign.challenge.target,
    unit: campaign.challenge.unit,
    durationDays,
    rewardHp,
    budgetCeiling: campaign.rewards.budgetCeiling,
    maxParticipants: campaign.rewards.maxParticipants,
    dataSources: campaign.targeting.dataSources ?? [],
    memberAction: defaultMemberAction(campaign.challenge.metric),
    rewardCopy: defaultRewardCopy(campaign.challenge.metric, rewardHp),
    launchedAt: campaign.startDate,
  };
}

export function buildConsumerChallengeUrl(payload: ConsumerCampaignPayload): string {
  const url = new URL('/v2/challenges', DEFAULT_CONSUMER_APP_URL);
  url.searchParams.set('externalCampaignId', payload.externalCampaignId);
  url.searchParams.set('invite', '1');
  url.searchParams.set('insurer', payload.insurerName);
  url.searchParams.set('campaign', payload.campaignName);
  url.searchParams.set('market', payload.market);
  url.searchParams.set('objective', payload.objective);
  url.searchParams.set('metric', payload.metric);
  url.searchParams.set('duration', `${payload.durationDays} days`);
  url.searchParams.set('reward', payload.rewardCopy);
  url.searchParams.set('memberAction', payload.memberAction);
  url.searchParams.set('campaignId', payload.externalCampaignId);
  url.searchParams.set('source', 'b2b-demo');
  return url.toString();
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (INTEGRATION_TOKEN) {
    headers['X-HealthID-Integration-Token'] = INTEGRATION_TOKEN;
  }

  return headers;
}

export async function dispatchCampaignToConsumer(payload: ConsumerCampaignPayload): Promise<ConsumerCampaignDispatchResponse> {
  const response = await fetch(DEFAULT_DEPLOY_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to dispatch campaign to consumer app');
  }

  return data as ConsumerCampaignDispatchResponse;
}

export async function fetchConsumerCampaignStatus(externalCampaignId: string): Promise<ConsumerCampaignDispatchResponse> {
  const params = new URLSearchParams({ externalCampaignId });
  const response = await fetch(`${DEFAULT_STATUS_ENDPOINT}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch consumer campaign status');
  }

  return data as ConsumerCampaignDispatchResponse;
}
