import type {
  Campaign,
  SnapshotCampaign,
  StreamCampaign,
  CampaignTemplate,
  CampaignStatus,
  CampaignType,
  ChallengeCriteria,
  CohortTargeting,
  CampaignFunnelData,
} from '@/types';
import { seededRandom, randomInt, generateId } from './seed';
import { partners } from './partners';

// ── Seed ────────────────────────────────────────────────────────────

const SEED = 1337;
const rng = seededRandom(SEED);

// ── Helper: build funnel with realistic drop-off ────────────────────

function buildFunnel(
  rng: () => number,
  eligible: number,
  status: CampaignStatus,
): CampaignFunnelData {
  if (status === 'draft') {
    return { eligible, invited: 0, enrolled: 0, verified: 0, rewarded: 0 };
  }
  const invited = Math.round(eligible * (0.6 + rng() * 0.25));       // 60-85%
  const enrolled = Math.round(invited * (0.35 + rng() * 0.30));      // 35-65%
  const verified = Math.round(enrolled * (0.40 + rng() * 0.35));     // 40-75%
  const rewarded = Math.round(verified * (0.80 + rng() * 0.18));     // 80-98%
  return { eligible, invited, enrolled, verified, rewarded };
}

// ── Campaign definitions ────────────────────────────────────────────

interface CampaignSeed {
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  partnerIndex: number;
  challenge: ChallengeCriteria;
  targeting: CohortTargeting;
  budgetCeiling: number;
  pointsPerVerification: number;
  maxParticipants: number;
  eligible: number;
  // Stream-only
  frequency?: 'daily' | 'weekly' | 'monthly';
  streamDuration?: number;
  dynamicPricing?: boolean;
}

const seeds: CampaignSeed[] = [
  // ── Drafts (2) ──
  {
    name: 'BMI Range Verification',
    description: 'Verify that participant body composition falls within a healthy BMI range using connected wearable data.',
    type: 'snapshot',
    status: 'draft',
    partnerIndex: 0,
    challenge: { metric: 'body_composition', operator: 'between', target: 18.5, targetMax: 24.9, unit: '%' },
    targeting: { healthScoreMin: 50, ageRanges: ['25-34', '35-44'], regions: ['North America'] },
    budgetCeiling: 15000,
    pointsPerVerification: 75,
    maxParticipants: 2000,
    eligible: 1200,
  },
  {
    name: 'Resting Heart Rate Baseline',
    description: 'Establish baseline resting heart rate for participants before a clinical trial enrollment.',
    type: 'stream',
    status: 'draft',
    partnerIndex: 1,
    challenge: { metric: 'heart_rate_resting', operator: 'lte', target: 75, unit: 'bpm' },
    targeting: { healthScoreMin: 40, dataSources: ['apple_health', 'garmin', 'whoop'] },
    budgetCeiling: 20000,
    pointsPerVerification: 50,
    maxParticipants: 3000,
    eligible: 2100,
    frequency: 'daily',
    streamDuration: 14,
    dynamicPricing: false,
  },

  // ── Active (4) ──
  {
    name: 'Physical Screening Verification',
    description: 'Verify that employees have completed a physical screening with acceptable health metrics across key indicators.',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 2,
    challenge: { metric: 'steps', operator: 'gte', target: 8000, unit: 'steps' },
    targeting: { healthScoreMin: 45, reputationTiers: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], regions: ['North America'] },
    budgetCeiling: 25000,
    pointsPerVerification: 100,
    maxParticipants: 5000,
    eligible: 3400,
  },
  {
    name: 'Continuous Sleep Quality Monitor',
    description: 'Continuously monitor sleep quality scores to ensure participants maintain healthy sleep hygiene throughout the study period.',
    type: 'stream',
    status: 'active',
    partnerIndex: 1,
    challenge: { metric: 'sleep_quality', operator: 'gte', target: 70, unit: 'score' },
    targeting: { healthScoreMin: 50, dataSources: ['oura', 'whoop', 'apple_health', 'fitbit'], ageRanges: ['25-34', '35-44', '45-54'] },
    budgetCeiling: 35000,
    pointsPerVerification: 60,
    maxParticipants: 4000,
    eligible: 2800,
    frequency: 'weekly',
    streamDuration: 90,
    dynamicPricing: true,
  },
  {
    name: '30-Day Activity Streak',
    description: 'Challenge participants to maintain at least 30 active minutes daily for 30 consecutive days, verified via wearable data.',
    type: 'snapshot',
    status: 'active',
    partnerIndex: 0,
    challenge: { metric: 'active_minutes', operator: 'gte', target: 30, unit: 'min' },
    targeting: { reputationTiers: ['silver', 'gold', 'platinum', 'diamond'], healthScoreMin: 55 },
    budgetCeiling: 30000,
    pointsPerVerification: 120,
    maxParticipants: 3500,
    eligible: 2600,
  },
  {
    name: 'HRV Wellness Check',
    description: 'Weekly heart rate variability checks to screen wellness programme participants for stress resilience.',
    type: 'stream',
    status: 'active',
    partnerIndex: 2,
    challenge: { metric: 'hrv', operator: 'gte', target: 40, unit: 'ms' },
    targeting: { dataSources: ['apple_health', 'garmin', 'oura', 'whoop'], regions: ['North America'] },
    budgetCeiling: 18000,
    pointsPerVerification: 45,
    maxParticipants: 2500,
    eligible: 1900,
    frequency: 'weekly',
    streamDuration: 60,
    dynamicPricing: false,
  },

  // ── Completed (3) ──
  {
    name: 'Quarterly Lab Results Proof',
    description: 'Collect zero-knowledge proofs of quarterly lab results for insurance underwriting without revealing raw data.',
    type: 'snapshot',
    status: 'completed',
    partnerIndex: 0,
    challenge: { metric: 'blood_glucose', operator: 'lte', target: 100, unit: 'mg/dL' },
    targeting: { dataSources: ['lab_results'], ageRanges: ['35-44', '45-54', '55-64', '65+'], regions: ['North America', 'Europe'] },
    budgetCeiling: 40000,
    pointsPerVerification: 150,
    maxParticipants: 6000,
    eligible: 4200,
  },
  {
    name: 'Hydration Tracking Study',
    description: 'Track daily hydration levels over 8 weeks for a pharma research study on electrolyte supplementation.',
    type: 'stream',
    status: 'completed',
    partnerIndex: 1,
    challenge: { metric: 'hydration', operator: 'gte', target: 2500, unit: 'ml' },
    targeting: { healthScoreMin: 40, genders: ['male', 'female'], ageRanges: ['18-24', '25-34', '35-44'] },
    budgetCeiling: 22000,
    pointsPerVerification: 55,
    maxParticipants: 3000,
    eligible: 2200,
    frequency: 'daily',
    streamDuration: 56,
    dynamicPricing: true,
  },
  {
    name: 'Annual Step Count Review',
    description: 'Year-end review verifying cumulative step count achievements for corporate wellness rewards programme.',
    type: 'snapshot',
    status: 'completed',
    partnerIndex: 2,
    challenge: { metric: 'steps', operator: 'gte', target: 10000, unit: 'steps' },
    targeting: { regions: ['North America'] },
    budgetCeiling: 12000,
    pointsPerVerification: 80,
    maxParticipants: 1500,
    eligible: 1100,
  },

  // ── Paused (1) ──
  {
    name: 'Stress Score Baseline',
    description: 'Paused study collecting daily stress scores for participants during an organisational change programme.',
    type: 'stream',
    status: 'paused',
    partnerIndex: 0,
    challenge: { metric: 'stress_score', operator: 'lte', target: 60, unit: 'score' },
    targeting: { healthScoreMin: 35, dataSources: ['oura', 'whoop', 'fitbit'], ageRanges: ['25-34', '35-44', '45-54'] },
    budgetCeiling: 16000,
    pointsPerVerification: 40,
    maxParticipants: 2000,
    eligible: 1500,
    frequency: 'daily',
    streamDuration: 30,
    dynamicPricing: false,
  },
];

// ── Build campaign objects ──────────────────────────────────────────

function buildCampaigns(): Campaign[] {
  const now = new Date();
  return seeds.map((s) => {
    const id = generateId(rng, 'cmp');
    const partnerId = partners[s.partnerIndex].id;
    const funnel = buildFunnel(rng, s.eligible, s.status);

    // Date logic based on status
    let startDate: string;
    let endDate: string | null = null;
    let createdAt: string;

    const daysAgo = randomInt(rng, 30, 180);
    const start = new Date(now);
    start.setDate(start.getDate() - daysAgo);

    switch (s.status) {
      case 'draft': {
        createdAt = new Date(now.getTime() - randomInt(rng, 1, 14) * 86400000).toISOString();
        startDate = new Date(now.getTime() + randomInt(rng, 7, 30) * 86400000).toISOString();
        endDate = s.type === 'snapshot'
          ? new Date(new Date(startDate).getTime() + randomInt(rng, 14, 60) * 86400000).toISOString()
          : null;
        break;
      }
      case 'active': {
        createdAt = new Date(start.getTime() - randomInt(rng, 3, 14) * 86400000).toISOString();
        startDate = start.toISOString();
        endDate = s.type === 'snapshot'
          ? new Date(now.getTime() + randomInt(rng, 14, 90) * 86400000).toISOString()
          : null;
        break;
      }
      case 'completed': {
        const endDaysAgo = randomInt(rng, 5, 60);
        const completedEnd = new Date(now);
        completedEnd.setDate(completedEnd.getDate() - endDaysAgo);
        const duration = randomInt(rng, 30, 120);
        const completedStart = new Date(completedEnd);
        completedStart.setDate(completedStart.getDate() - duration);
        createdAt = new Date(completedStart.getTime() - randomInt(rng, 3, 14) * 86400000).toISOString();
        startDate = completedStart.toISOString();
        endDate = completedEnd.toISOString();
        break;
      }
      case 'paused': {
        createdAt = new Date(start.getTime() - randomInt(rng, 3, 14) * 86400000).toISOString();
        startDate = start.toISOString();
        endDate = null;
        break;
      }
    }

    const budgetSpent = s.status === 'completed'
      ? Math.round(s.budgetCeiling * (0.75 + rng() * 0.23))
      : s.status === 'active'
        ? Math.round(s.budgetCeiling * (0.15 + rng() * 0.50))
        : s.status === 'paused'
          ? Math.round(s.budgetCeiling * (0.10 + rng() * 0.30))
          : 0;

    const base: Campaign = {
      id,
      name: s.name,
      description: s.description,
      type: s.type,
      status: s.status,
      partnerId,
      challenge: s.challenge,
      targeting: s.targeting,
      rewards: {
        pointsPerVerification: s.pointsPerVerification,
        budgetCeiling: s.budgetCeiling,
        budgetSpent,
        maxParticipants: s.maxParticipants,
      },
      funnel,
      startDate,
      endDate,
      createdAt,
    };

    // Add stream-specific fields
    if (s.type === 'stream' && s.frequency) {
      return {
        ...base,
        type: 'stream' as const,
        frequency: s.frequency,
        streamDuration: s.streamDuration!,
        dynamicPricing: s.dynamicPricing!,
      } satisfies StreamCampaign;
    }

    if (s.type === 'snapshot' && base.endDate) {
      return {
        ...base,
        type: 'snapshot' as const,
        endDate: base.endDate,
      } satisfies SnapshotCampaign;
    }

    return base;
  });
}

export const campaigns: Campaign[] = buildCampaigns();

// ── Campaign Templates ──────────────────────────────────────────────

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'tmpl_phys_screen',
    name: 'Physical Screening Proof',
    description: 'Verify completion of a physical screening with acceptable health metrics using zero-knowledge proofs.',
    type: 'snapshot',
    icon: 'Shield',
    challenge: { metric: 'steps', operator: 'gte', target: 8000, unit: 'steps' },
    targeting: { healthScoreMin: 45, regions: ['North America'] },
    suggestedBudget: 25000,
    suggestedPoints: 100,
  },
  {
    id: 'tmpl_sleep_monitor',
    name: 'Sleep Quality Monitor',
    description: 'Continuously verify sleep quality scores over time to support sleep hygiene programmes and research studies.',
    type: 'stream',
    icon: 'Moon',
    challenge: { metric: 'sleep_quality', operator: 'gte', target: 70, unit: 'score' },
    targeting: { dataSources: ['oura', 'whoop', 'apple_health', 'fitbit'] },
    suggestedBudget: 35000,
    suggestedPoints: 60,
  },
  {
    id: 'tmpl_activity_streak',
    name: 'Activity Streak Challenge',
    description: 'Challenge participants to maintain a daily activity streak, verified through connected wearable data.',
    type: 'snapshot',
    icon: 'Flame',
    challenge: { metric: 'active_minutes', operator: 'gte', target: 30, unit: 'min' },
    targeting: { reputationTiers: ['silver', 'gold', 'platinum', 'diamond'], healthScoreMin: 55 },
    suggestedBudget: 30000,
    suggestedPoints: 120,
  },
];
