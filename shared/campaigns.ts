/**
 * Unified campaign registry — single source of truth for both
 * the AI Actuary page and the Incentive Simulator command bar.
 *
 * Each entry defines a "seeded" campaign that can be:
 *  1. Displayed as a card on the AI Actuary page
 *  2. Offered as a suggested scenario in the Simulator
 *  3. Pre-run in the background so projected numbers are grounded in real simulation results
 */

export interface CampaignDefinition {
  /** Stable identifier (matches actuaryInsights id) */
  id: string;
  /** Signal ID from the shared signal registry */
  signalId: string;
  /** Human-readable signal name */
  signal: string;
  /** Campaign name shown on cards and in suggestions */
  campaignName: string;
  /** Natural-language goal sent to the simulator engine */
  simulatorGoal: string;
  /** Short description for the command bar example list */
  commandBarExample: string;
  /** Cohort size for seeded runs */
  cohortSize: number;
  /** Budget cap in USD */
  maxBudgetUsd: number;
  /** Campaign window (human-readable) */
  targetWindow: string;
  /** Market for the seeded run */
  market: 'HK' | 'SG';
}

export const CAMPAIGN_REGISTRY: CampaignDefinition[] = [
  {
    id: 'ins_vo2_activation',
    signalId: 'vo2max',
    signal: 'VO2 Max',
    campaignName: 'Cardio Fitness Activation',
    simulatorGoal:
      'Cardio Fitness Activation: reward verified VO2 max improvement and Zone 2 consistency across 3,847 low-fitness members over 8 weeks. Target a measurable cardiorespiratory fitness uplift using wearable-verified activity data.',
    commandBarExample:
      'Cardio Fitness Activation: reward verified VO2 max improvement and Zone 2 consistency across low-fitness members over 8 weeks.',
    cohortSize: 3847,
    maxBudgetUsd: 58000,
    targetWindow: '8 weeks',
    market: 'HK',
  },
  {
    id: 'ins_hrv_recovery',
    signalId: 'hrv',
    signal: 'HRV',
    campaignName: 'HRV Recovery',
    simulatorGoal:
      'HRV Recovery: intervene on recovery drift by rewarding sleep regularity, lighter movement days, and stabilised resting heart rate across 1,204 members showing HRV decline over 60 days.',
    commandBarExample:
      'HRV Recovery: intervene on recovery drift by rewarding sleep regularity, lighter movement days, and stabilised resting heart rate over 60 days.',
    cohortSize: 1204,
    maxBudgetUsd: 36000,
    targetWindow: '60 days',
    market: 'HK',
  },
  {
    id: 'ins_sleep_regularly',
    signalId: 'sleep_regularity',
    signal: 'Sleep',
    campaignName: 'Sleep Regularity',
    simulatorGoal:
      'Sleep Regularity: reward 30 nights of verified sleep consistency and at least 6.5 hours average duration across 2,186 members with persistent sleep debt over 45 days.',
    commandBarExample:
      'Sleep Regularity: reward 30 nights of verified sleep consistency and at least 6.5 hours average duration across members with persistent sleep debt.',
    cohortSize: 2186,
    maxBudgetUsd: 42000,
    targetWindow: '45 days',
    market: 'HK',
  },
  {
    id: 'ins_resting_hr_improvement',
    signalId: 'resting_hr',
    signal: 'Resting HR',
    campaignName: 'Resting Heart Rate Improvement',
    simulatorGoal:
      'Resting Heart Rate Improvement: reward sustained activity consistency and verified resting heart rate reduction across 946 members with elevated resting HR over 90 days.',
    commandBarExample:
      'Resting Heart Rate Improvement: reward 12 active weeks with verified activity consistency and a 3 bpm resting heart rate improvement.',
    cohortSize: 946,
    maxBudgetUsd: 31000,
    targetWindow: '90 days',
    market: 'HK',
  },
];

/** Seeded run result shape returned by GET /api/scenarios/seeded */
export interface SeededRunResult {
  campaignId: string;
  runId: string;
  simulatedAt: number;
  plan: {
    signals: string[];
    primarySignal: string;
    market: string;
    bookSize: number;
    horizonMonths: number;
  };
  behavior: {
    enrollmentRate: number;
    persistenceRate: number;
    behaviorChangeRate: number;
    behaviorChangeCI: [number, number];
  };
  finance: {
    claimsSavingsP50: number;
    roiP50: number;
    roiP5: number;
    roiP95: number;
    netValueP50: number;
    valueCreatedP50: number;
    totalCostP50: number;
    downsideProbability: number;
    rewardToSustainP50: number;
  };
  /** Payback in months (from growth run, if available) */
  paybackMonths: number | null;
}
