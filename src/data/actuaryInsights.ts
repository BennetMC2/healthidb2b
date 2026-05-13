export type ActuaryConfidence = 'high' | 'medium' | 'emerging';

export interface ActuaryInsight {
  id: string;
  signal: string;
  campaignName: string;
  title: string;
  subtitle: string;
  body: string;
  behaviourToReward: string;
  healthPointsPricing: {
    suggestedHpPerMember: number;
    maxBudgetUsd: number;
    targetWindow: string;
  };
  confidence: ActuaryConfidence;
  generatedAt: string;
  cohortSize: number;
  cohortFilter: string;
  sourceBreakdown: Array<{ source: string; pct: number }>;
  outputs: {
    claimsReductionPct: number;
    projectedSavingsUsd: number;
    budgetRoiMultiple: number;
    suggestedHpYield: number;
    morbidityShiftBps: number;
    paybackMonths: number;
  };
  evidence: {
    literature: Array<{ title: string; journal: string; year: number; doi: string; effectSize: string }>;
    portfolioContext: string;
    counterfactualUsd: number;
    confidenceBreakdown: { credibility: number; causal: number; evidence: number; conservative: number };
  };
}

export const actuaryInsights: ActuaryInsight[] = [
  {
    id: 'ins_vo2_activation',
    signal: 'VO2 Max',
    campaignName: 'Cardio Fitness Activation',
    title: 'Move low-cardio-fitness members toward a healthier risk trajectory',
    subtitle: '3,847 addressable members show low or declining VO2 Max signals, but are still active enough to respond to a structured intervention.',
    body: 'Reward consistent Zone 2 activity and a positive VO2 Max trend over eight weeks. The goal is a small verified improvement in cardio fitness across a large cohort, priced below the expected book-value gain.',
    behaviourToReward: '8 weeks of verified Zone 2 activity consistency plus a positive VO2 Max trend.',
    healthPointsPricing: {
      suggestedHpPerMember: 650,
      maxBudgetUsd: 58000,
      targetWindow: '8 weeks',
    },
    confidence: 'high',
    generatedAt: '2026-05-12T09:14:00+08:00',
    cohortSize: 3847,
    cohortFilter: 'vo2_max_percentile <= 35 AND activity_consistency >= moderate AND age_band BETWEEN 30-55',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 42 },
      { source: 'Garmin', pct: 28 },
      { source: 'Lab partners', pct: 19 },
      { source: 'Other', pct: 11 },
    ],
    outputs: {
      claimsReductionPct: 3.3,
      projectedSavingsUsd: 4200000,
      budgetRoiMultiple: 4.2,
      suggestedHpYield: 650,
      morbidityShiftBps: -140,
      paybackMonths: 8,
    },
    evidence: {
      literature: [
        {
          title: 'Association of Cardiorespiratory Fitness With Long-term Mortality Among Adults Undergoing Exercise Treadmill Testing',
          journal: 'JAMA Network Open',
          year: 2018,
          doi: '10.1001/jamanetworkopen.2018.3605',
          effectSize: 'Highest fitness associated with substantially lower mortality risk.',
        },
        {
          title: 'Device-measured physical activity and cardiometabolic health',
          journal: 'Nature Medicine',
          year: 2023,
          doi: '10.1038/s41591-023-02373-4',
          effectSize: 'Higher-intensity activity associated with reduced cardiometabolic risk.',
        },
      ],
      portfolioContext: 'This cohort has enough activity baseline to be influenceable, but current VO2 Max trend suggests avoidable cardio-metabolic deterioration.',
      counterfactualUsd: 3100000,
      confidenceBreakdown: { credibility: 92, causal: 78, evidence: 88, conservative: 84 },
    },
  },
  {
    id: 'ins_hrv_recovery',
    signal: 'HRV',
    campaignName: 'HRV Recovery',
    title: 'Intervene before recovery drift becomes claims risk',
    subtitle: '1,204 members show sustained HRV decline paired with rising training stress and inconsistent recovery windows.',
    body: 'Reward recovery behaviours that can be verified without raw data custody: sleep regularity, lighter movement days, and stabilised resting heart rate. The aim is to stop a manageable drift before it becomes a more expensive risk pattern.',
    behaviourToReward: '21 verified recovery days across sleep consistency, lighter activity, and stabilised resting heart rate.',
    healthPointsPricing: {
      suggestedHpPerMember: 520,
      maxBudgetUsd: 36000,
      targetWindow: '60 days',
    },
    confidence: 'medium',
    generatedAt: '2026-05-12T08:51:00+08:00',
    cohortSize: 1204,
    cohortFilter: 'hrv_trend = declining AND recovery_score_delta_45d <= -12 AND activity_status = active',
    sourceBreakdown: [
      { source: 'WHOOP', pct: 34 },
      { source: 'Oura', pct: 30 },
      { source: 'Apple Health', pct: 25 },
      { source: 'Other', pct: 11 },
    ],
    outputs: {
      claimsReductionPct: 7.6,
      projectedSavingsUsd: 1800000,
      budgetRoiMultiple: 3.4,
      suggestedHpYield: 520,
      morbidityShiftBps: -18,
      paybackMonths: 12,
    },
    evidence: {
      literature: [
        {
          title: 'Sleep duration and cardiometabolic risk: a systematic review',
          journal: 'The Lancet Regional Health',
          year: 2023,
          doi: '10.1016/j.lanwpc.2023.100734',
          effectSize: 'Persistent sleep insufficiency associated with elevated cardiometabolic risk.',
        },
      ],
      portfolioContext: 'HRV drift is appearing before claims activity. This is a good candidate for an early intervention campaign rather than retrospective underwriting action.',
      counterfactualUsd: 940000,
      confidenceBreakdown: { credibility: 76, causal: 62, evidence: 71, conservative: 80 },
    },
  },
  {
    id: 'ins_sleep_regularly',
    signal: 'Sleep',
    campaignName: 'Sleep Regularity',
    title: 'Stabilise sleep debt in members drifting toward higher risk',
    subtitle: '2,186 members show persistent sleep debt or irregular sleep timing across the last 45 days.',
    body: 'Reward consistent sleep windows and improved sleep sufficiency, not one-off long sleeps. The commercial case is modest individual improvement at scale: better engagement, better metabolic-risk proxy, and stronger renewal quality.',
    behaviourToReward: '30 nights with verified sleep regularity and at least 6.5 hours average sleep duration.',
    healthPointsPricing: {
      suggestedHpPerMember: 480,
      maxBudgetUsd: 42000,
      targetWindow: '45 days',
    },
    confidence: 'medium',
    generatedAt: '2026-05-12T08:30:00+08:00',
    cohortSize: 2186,
    cohortFilter: 'sleep_debt_45d >= 12h OR sleep_timing_variance >= 90m',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 39 },
      { source: 'Oura', pct: 27 },
      { source: 'WHOOP', pct: 21 },
      { source: 'Other', pct: 13 },
    ],
    outputs: {
      claimsReductionPct: 2.8,
      projectedSavingsUsd: 1250000,
      budgetRoiMultiple: 3.1,
      suggestedHpYield: 480,
      morbidityShiftBps: -72,
      paybackMonths: 11,
    },
    evidence: {
      literature: [
        {
          title: 'Sleep duration and cardiometabolic risk: a systematic review',
          journal: 'The Lancet Regional Health',
          year: 2023,
          doi: '10.1016/j.lanwpc.2023.100734',
          effectSize: 'Persistent sleep insufficiency associated with elevated cardiometabolic risk.',
        },
      ],
      portfolioContext: 'Sleep regularity is the broadest addressable campaign in the current book, but needs careful Health Points pricing to avoid over-rewarding low-value behaviour.',
      counterfactualUsd: 760000,
      confidenceBreakdown: { credibility: 78, causal: 64, evidence: 74, conservative: 81 },
    },
  },
  {
    id: 'ins_resting_hr_improvement',
    signal: 'Resting HR',
    campaignName: 'Resting Heart Rate Improvement',
    title: 'Reduce elevated resting heart rate with a targeted activity campaign',
    subtitle: '946 members show elevated or worsening resting heart rate, with enough device coverage to verify improvement.',
    body: 'Reward sustained activity consistency and resting heart rate reduction over 90 days. This is a narrower campaign, but the signal is easy to understand, easy to verify, and commercially useful for cardio-metabolic risk improvement.',
    behaviourToReward: '12 active weeks with verified activity consistency and a 3 bpm resting heart rate improvement.',
    healthPointsPricing: {
      suggestedHpPerMember: 600,
      maxBudgetUsd: 31000,
      targetWindow: '90 days',
    },
    confidence: 'emerging',
    generatedAt: '2026-05-12T08:17:00+08:00',
    cohortSize: 946,
    cohortFilter: 'resting_hr_percentile >= 70 AND resting_hr_trend_60d = worsening AND device_coverage >= 70',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 44 },
      { source: 'Garmin', pct: 24 },
      { source: 'Fitbit', pct: 20 },
      { source: 'Other', pct: 12 },
    ],
    outputs: {
      claimsReductionPct: 2.1,
      projectedSavingsUsd: 840000,
      budgetRoiMultiple: 2.7,
      suggestedHpYield: 600,
      morbidityShiftBps: -54,
      paybackMonths: 14,
    },
    evidence: {
      literature: [
        {
          title: 'Resting heart rate and cardiovascular outcomes in population cohorts',
          journal: 'European Heart Journal',
          year: 2022,
          doi: '10.1093/eurheartj/ehac021',
          effectSize: 'Higher resting heart rate associated with elevated cardiovascular risk.',
        },
      ],
      portfolioContext: 'This campaign is narrower than sleep or VO2 Max, but it creates a clean proof story for partners evaluating outcome-linked rewards.',
      counterfactualUsd: 390000,
      confidenceBreakdown: { credibility: 67, causal: 56, evidence: 62, conservative: 77 },
    },
  },
];
