import type { CampaignDailySnapshot } from '@/types';
import { seededRandom, normalDistribution } from './seed';
import { campaigns } from './campaigns';

const SEED = 8888;

/**
 * Sigmoid function for S-curve enrollment growth.
 * Returns a value in (0, 1) centered at `midpoint` with given `steepness`.
 */
function sigmoid(x: number, midpoint: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

function generateCampaignTimeSeries(): CampaignDailySnapshot[] {
  const rng = seededRandom(SEED);
  const result: CampaignDailySnapshot[] = [];

  // Only generate for non-draft campaigns
  const activeCampaigns = campaigns.filter((c) => c.status !== 'draft');

  for (const campaign of activeCampaigns) {
    const startDate = new Date(campaign.startDate);
    const endDate = campaign.endDate
      ? new Date(campaign.endDate)
      : new Date(); // Active/paused campaigns run up to now

    const totalDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000),
    );

    // For paused campaigns, only generate up to ~60% of the duration
    const activeDays =
      campaign.status === 'paused'
        ? Math.round(totalDays * (0.5 + rng() * 0.2))
        : totalDays;

    const maxEnrolled = campaign.funnel.enrolled;
    const maxVerified = campaign.funnel.verified;
    const totalBudgetSpent = campaign.rewards.budgetSpent;

    // Sigmoid midpoint at ~40% of duration, steepness varies
    const enrollMid = activeDays * (0.35 + rng() * 0.15);
    const enrollSteep = 0.06 + rng() * 0.04;

    // Verification lags enrollment by ~20% of duration
    const verifyMid = enrollMid + activeDays * (0.15 + rng() * 0.1);
    const verifySteep = 0.05 + rng() * 0.04;

    let prevEnrolled = 0;
    let prevVerified = 0;
    let prevBudget = 0;

    for (let d = 0; d < activeDays; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);

      // Sigmoid-based cumulative values with daily noise
      const noise = 1 + normalDistribution(rng, 0, 0.02);
      const enrolled = Math.min(
        maxEnrolled,
        Math.round(sigmoid(d, enrollMid, enrollSteep) * maxEnrolled * noise),
      );
      const verified = Math.min(
        maxVerified,
        Math.round(sigmoid(d, verifyMid, verifySteep) * maxVerified * noise),
      );
      const budgetSpent = Math.min(
        totalBudgetSpent,
        Math.round((verified / Math.max(maxVerified, 1)) * totalBudgetSpent),
      );

      const newEnrollments = Math.max(0, enrolled - prevEnrolled);
      const newVerifications = Math.max(0, verified - prevVerified);

      result.push({
        date: date.toISOString().split('T')[0],
        campaignId: campaign.id,
        enrolled,
        verified,
        newEnrollments,
        newVerifications,
        budgetSpent,
      });

      prevEnrolled = enrolled;
      prevVerified = verified;
      prevBudget = budgetSpent;
    }

    // Avoid unused variable warning
    void prevBudget;
  }

  return result;
}

export const campaignTimeSeries: CampaignDailySnapshot[] =
  generateCampaignTimeSeries();
