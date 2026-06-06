import type { RewardConfig } from '../types';

export const REWARD_PRESETS: RewardConfig[] = [
  {
    id: 'weekly_streak',
    name: 'Weekly Streak Reward',
    description: 'Cash-equivalent rewards for consecutive weeks of target achievement. Loss-aversion framing with streak multiplier.',
    outcomeTarget: 'claims',
    rewardTypeMix: { cash: 0.6, loyalty: 0.2, health_aspirational: 0.15, status: 0.05 },
    budgetPerMember: 120,
    behaviouralModifiers: ['loss_aversion', 'streak_multiplier'],
    expectedParticipation: 0.45,
    expectedCompletion: 0.28,
    expectedPersistence: 0.18,
  },
  {
    id: 'participation_first',
    name: 'Participation-First Reward',
    description: 'Low-barrier entry rewards focused on engagement. Ideal for low-engagement cohorts with basic wearables.',
    outcomeTarget: 'retention',
    rewardTypeMix: { cash: 0.3, loyalty: 0.4, health_aspirational: 0.2, status: 0.1 },
    budgetPerMember: 60,
    behaviouralModifiers: ['positive_framing', 'anchoring'],
    expectedParticipation: 0.55,
    expectedCompletion: 0.22,
    expectedPersistence: 0.12,
  },
  {
    id: 'clinical_followup',
    name: 'Clinical Follow-Up Reward',
    description: 'Higher-value rewards for completing clinical assessments and achieving measurable health improvements.',
    outcomeTarget: 'claims',
    rewardTypeMix: { cash: 0.5, loyalty: 0.1, health_aspirational: 0.3, status: 0.1 },
    budgetPerMember: 200,
    behaviouralModifiers: ['loss_aversion', 'streak_multiplier', 'anchoring'],
    expectedParticipation: 0.35,
    expectedCompletion: 0.32,
    expectedPersistence: 0.24,
  },
  {
    id: 'consistency_reward',
    name: 'Consistency Reward',
    description: 'Rewards tied to maintaining consistent sleep and recovery patterns. Emphasises regularity over peak performance.',
    outcomeTarget: 'retention',
    rewardTypeMix: { cash: 0.4, loyalty: 0.3, health_aspirational: 0.2, status: 0.1 },
    budgetPerMember: 90,
    behaviouralModifiers: ['streak_multiplier', 'positive_framing'],
    expectedParticipation: 0.42,
    expectedCompletion: 0.30,
    expectedPersistence: 0.22,
  },
  {
    id: 'team_engagement',
    name: 'Team Engagement Reward',
    description: 'Group-based rewards with team leaderboards and collective targets. Social accountability drives participation.',
    outcomeTarget: 'retention',
    rewardTypeMix: { cash: 0.25, loyalty: 0.35, health_aspirational: 0.15, status: 0.25 },
    budgetPerMember: 80,
    behaviouralModifiers: ['anchoring', 'positive_framing'],
    expectedParticipation: 0.50,
    expectedCompletion: 0.25,
    expectedPersistence: 0.15,
  },
];

export function getRewardPresetById(id: string) {
  return REWARD_PRESETS.find((r) => r.id === id);
}
