import type { RewardConfig } from '../types';
import { computeBehaviouralLift } from '../data/behaviouralEconomics';

export interface RewardCalculation {
  totalRewardCost: number;
  rewardCostPerMember: number;
  participationRate: number;
  completionRate: number;
  persistenceRate: number;
  behaviouralLift: number;
  adjustedParticipation: number;
  adjustedCompletion: number;
  adjustedPersistence: number;
}

/**
 * Calculate reward costs and adjusted participation rates with behavioural-econ modifiers.
 */
export function calculateRewards(
  rewardConfig: RewardConfig,
  cohortSize: number,
  enabledModifierOverrides?: string[],
): RewardCalculation {
  const enabledModifiers = enabledModifierOverrides ?? rewardConfig.behaviouralModifiers;
  const behaviouralLift = computeBehaviouralLift(enabledModifiers);

  // Apply behavioural lift to participation and completion
  // Persistence gets a smaller boost (people still drop off)
  const adjustedParticipation = Math.min(0.85, rewardConfig.expectedParticipation * behaviouralLift);
  const adjustedCompletion = Math.min(0.65, rewardConfig.expectedCompletion * Math.sqrt(behaviouralLift));
  const adjustedPersistence = Math.min(0.50, rewardConfig.expectedPersistence * Math.pow(behaviouralLift, 0.4));

  // Cost = budget per member × participating members
  const participatingMembers = Math.round(cohortSize * adjustedParticipation);
  const rewardCostPerMember = rewardConfig.budgetPerMember * adjustedCompletion;
  const totalRewardCost = rewardCostPerMember * participatingMembers;

  return {
    totalRewardCost: Math.round(totalRewardCost),
    rewardCostPerMember: Math.round(rewardCostPerMember * 100) / 100,
    participationRate: rewardConfig.expectedParticipation,
    completionRate: rewardConfig.expectedCompletion,
    persistenceRate: rewardConfig.expectedPersistence,
    behaviouralLift: Math.round(behaviouralLift * 100) / 100,
    adjustedParticipation: Math.round(adjustedParticipation * 100) / 100,
    adjustedCompletion: Math.round(adjustedCompletion * 100) / 100,
    adjustedPersistence: Math.round(adjustedPersistence * 100) / 100,
  };
}

/**
 * Derive reward budget from gross value and ceiling percentage.
 */
export function deriveRewardBudget(
  grossValue: number,
  ceilingPct: number,
  cohortSize: number,
  adjustedParticipation: number,
  horizonMonths: number,
): { totalBudget: number; budgetPerMember: number } {
  const totalBudget = grossValue * ceilingPct;
  const participatingMembers = Math.round(cohortSize * adjustedParticipation);
  const horizonYears = horizonMonths / 12;
  const budgetPerMember = participatingMembers > 0 && horizonYears > 0
    ? totalBudget / (participatingMembers * horizonYears)
    : 0;
  return {
    totalBudget: Math.round(totalBudget),
    budgetPerMember: Math.round(budgetPerMember * 100) / 100,
  };
}

/**
 * Scale reward cost for a specific time horizon in months.
 */
export function scaleRewardCostForHorizon(
  baseRewardCost: number,
  horizonMonths: number,
  dropoutRate: number,
): number {
  // Reward cost scales with time but discounted by dropout
  let totalCost = 0;
  for (let month = 1; month <= horizonMonths; month++) {
    const retentionRate = Math.pow(1 - dropoutRate / 12, month);
    totalCost += (baseRewardCost / 12) * retentionRate;
  }
  return Math.round(totalCost);
}
