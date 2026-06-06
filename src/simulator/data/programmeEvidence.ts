import type { ProgrammeEvidencePoint } from '../types';

/**
 * RCT and real-world evidence on behaviour change programme effectiveness.
 *
 * These data points calibrate the archetype step changes,
 * participation rates, and persistence curves.
 */

export const PROGRAMME_EVIDENCE: ProgrammeEvidencePoint[] = [
  {
    id: 'patel_2016_way_to_health',
    source: 'Patel MS et al. 2016, Annals of Internal Medicine. doi:10.7326/M15-1635',
    sampleSize: 281,
    interventionType: 'Loss-framed financial incentives',
    avgStepIncrease: 1600,
    participationRate: 0.55,
    persistenceAt12Months: 0.42,
    incentiveType: 'financial_loss_framed',
    incentiveCostPerMember: 150,
    notes: 'Loss-framed incentive ($1.40/day forfeited if goal not met). Participants increased from ~4,000 to ~5,600 steps/day. Top quartile sustained +2,400 steps. Significant dropout after incentive removal.',
  },
  {
    id: 'patel_2019_step_up',
    source: 'Patel MS et al. 2019, JAMA Internal Medicine. doi:10.1001/jamainternmed.2019.3505',
    sampleSize: 602,
    interventionType: 'Gamification with social incentives',
    avgStepIncrease: 920,
    participationRate: 0.48,
    persistenceAt12Months: 0.35,
    incentiveType: 'gamification',
    incentiveCostPerMember: 80,
    notes: 'Competition-based gamification. Support arm +920 steps, competition arm +640. Effects partially maintained at 12 weeks post-intervention.',
  },
  {
    id: 'discovery_vitality_longitudinal',
    source: 'Discovery Vitality, 13-year longitudinal programme data (2010-2023)',
    sampleSize: 5_200_000,
    interventionType: 'Integrated wellness programme with tiered incentives',
    avgStepIncrease: 1200,
    participationRate: 0.52,
    persistenceAt12Months: 0.60,
    persistenceAt36Months: 0.40,
    incentiveType: 'mixed',
    incentiveCostPerMember: 120,
    notes: 'Largest real-world dataset. "Highly active" tier achieves 3× lower mortality than "inactive". 42% mortality improvement overall. Programme achieves 1.8× ROI at scale. Engagement tiers: inactive (30%), moderately active (35%), active (25%), highly active (10%).',
  },
  {
    id: 'rand_workplace_wellness',
    source: 'Mattke S et al. 2013, RAND Workplace Wellness Programs Study. doi:10.7249/RR254',
    sampleSize: 600_000,
    interventionType: 'Workplace wellness programme (US employers)',
    avgStepIncrease: 500,
    participationRate: 0.40,
    persistenceAt12Months: 0.30,
    incentiveType: 'financial',
    incentiveCostPerMember: 200,
    notes: 'Large employer-based study. Lifestyle management component showed modest effects. ROI of 1.5× over 3 years, primarily from reduced absenteeism. Participation varied 20-60% by programme design.',
  },
  {
    id: 'finkelstein_2016_steps',
    source: 'Finkelstein EA et al. 2016, Lancet Diabetes Endocrinol. doi:10.1016/S2213-8587(16)30284-4',
    sampleSize: 800,
    interventionType: 'Fitbit + cash/charity incentives',
    avgStepIncrease: 570,
    participationRate: 0.45,
    persistenceAt12Months: 0.25,
    incentiveType: 'financial',
    incentiveCostPerMember: 100,
    notes: 'Singapore-based RCT (TRIPPA study). Cash incentive arm +570 steps. Effects did not persist after incentive withdrawal at 6 months. Important for SG-specific calibration.',
  },
];

/** Weighted average step increase across all RCTs */
export const WEIGHTED_AVG_STEP_INCREASE = 1200;

/** Range of participation rates from RCTs */
export const PARTICIPATION_RATE_RANGE: [number, number] = [0.40, 0.55];

/** Range of 12-month persistence from longitudinal data */
export const PERSISTENCE_12MO_RANGE: [number, number] = [0.30, 0.60];
