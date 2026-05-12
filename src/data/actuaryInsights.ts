export type ActuaryConfidence = 'high' | 'medium' | 'emerging';

export interface ActuaryInsight {
  id: string;
  title: string;
  subtitle: string;
  body: string;
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
    id: 'ins_cardio_underpricing',
    title: 'Cardio-fitness cohort underpriced by ~14%',
    subtitle: '3,847 high-trust members show VO2 Max in the 90th percentile while sitting in standard-risk premium bands.',
    body: 'Recent literature suggests materially lower all-cause mortality for this cohort. The Actuary recommends a re-pricing campaign with Health Points yield anchored to projected risk improvement.',
    confidence: 'high',
    generatedAt: '2026-05-12T09:14:00+08:00',
    cohortSize: 3847,
    cohortFilter: 'trust_tier = high AND vo2_max_percentile >= 90 AND age_band BETWEEN 30-55',
    sourceBreakdown: [
      { source: 'Apple Health', pct: 42 },
      { source: 'Garmin', pct: 28 },
      { source: 'Lab partners', pct: 19 },
      { source: 'Other', pct: 11 },
    ],
    outputs: {
      claimsReductionPct: 14.2,
      projectedSavingsUsd: 4200000,
      budgetRoiMultiple: 5.8,
      suggestedHpYield: 840,
      morbidityShiftBps: -32,
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
      portfolioContext: 'Current cardio-tier premium is 2.4% above projected fair price for this cohort.',
      counterfactualUsd: 3100000,
      confidenceBreakdown: { credibility: 92, causal: 78, evidence: 88, conservative: 84 },
    },
  },
  {
    id: 'ins_sleep_debt_drift',
    title: 'Sleep-debt cohort drifting toward elevated risk',
    subtitle: '1,204 members show an 18%+ verified sleep-score decline over 60 days.',
    body: 'The cohort is showing a leading indicator for HRV degradation. Recommend a sleep resilience campaign before renewal season.',
    confidence: 'medium',
    generatedAt: '2026-05-12T08:51:00+08:00',
    cohortSize: 1204,
    cohortFilter: 'sleep_score_delta_60d <= -18 AND hrv_trend = declining',
    sourceBreakdown: [
      { source: 'Oura', pct: 36 },
      { source: 'Apple Health', pct: 31 },
      { source: 'WHOOP', pct: 22 },
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
      portfolioContext: 'Sleep Resilience members show 11 pts lower verification consistency than cardio cohorts.',
      counterfactualUsd: 940000,
      confidenceBreakdown: { credibility: 76, causal: 62, evidence: 71, conservative: 80 },
    },
  },
  {
    id: 'ins_hba1c_threshold',
    title: 'HbA1c threshold update affects maternity screen',
    subtitle: 'New evidence suggests the 5.7% cutoff is under-conservative for the maternity cohort.',
    body: 'Affects the active Q4 HbA1c Underwriting Screen programme. Recommend review before expanding eligibility.',
    confidence: 'emerging',
    generatedAt: '2026-05-12T08:30:00+08:00',
    cohortSize: 618,
    cohortFilter: 'programme = q4_hba1c_underwriting_screen AND maternity_track = true',
    sourceBreakdown: [
      { source: 'Lab partners', pct: 68 },
      { source: 'Apple Health', pct: 18 },
      { source: 'Clinical upload', pct: 10 },
      { source: 'Other', pct: 4 },
    ],
    outputs: {
      claimsReductionPct: 4.1,
      projectedSavingsUsd: 720000,
      budgetRoiMultiple: 2.2,
      suggestedHpYield: 360,
      morbidityShiftBps: -9,
      paybackMonths: 15,
    },
    evidence: {
      literature: [
        {
          title: 'Early glycemic markers and maternity risk stratification',
          journal: 'JAMA',
          year: 2026,
          doi: '10.1001/jama.2026.10422',
          effectSize: 'Lower pre-diabetes threshold may improve cohort sensitivity.',
        },
      ],
      portfolioContext: 'Two active programmes use the current HbA1c threshold without maternity-specific adjustment.',
      counterfactualUsd: 410000,
      confidenceBreakdown: { credibility: 58, causal: 50, evidence: 54, conservative: 72 },
    },
  },
];
