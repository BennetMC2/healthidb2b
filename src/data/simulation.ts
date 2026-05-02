import type {
  Campaign,
  CampaignDailySnapshot,
  ChallengeCriteria,
  ComplianceRecord,
  DataProcessingSummary,
  DataSource,
  HealthIdentity,
  HealthMetric,
  VerificationReceipt,
  VerificationStatus,
} from '@/types';
import { AGE_RANGES, REGIONS, RISK_COHORTS } from '@/utils/constants';
import { campaigns } from './campaigns';
import { partners } from './partners';
import {
  generateHash,
  generateId,
  normalDistribution,
  randomInt,
  randomItem,
  seededRandom,
  weightedIndex,
} from './seed';

const IDENTITY_COUNT = 36000;
const BASE_SEED = 20260425;
const REFRESH_BUCKET_HOURS = 6;

const SOURCE_WEIGHTS: readonly number[] = [0.31, 0.13, 0.12, 0.10, 0.08, 0.08, 0.10, 0.08];
const DATA_SOURCES: DataSource[] = [
  'apple_health',
  'fitbit',
  'garmin',
  'oura',
  'whoop',
  'google_fit',
  'samsung_health',
  'lab_results',
];
const GENDERS: Array<'male' | 'female' | 'other'> = ['male', 'female', 'other'];
const GENDER_WEIGHTS = [0.49, 0.48, 0.03];
const REGION_WEIGHTS = [0.11, 0.19, 0.21, 0.05, 0.07, 0.07, 0.06, 0.04, 0.06, 0.07, 0.07];
const AGE_RANGE_WEIGHTS = [0.09, 0.21, 0.24, 0.22, 0.16, 0.08];
const RISK_COHORT_WEIGHTS = [0.11, 0.15, 0.12, 0.16, 0.11, 0.10, 0.14, 0.11];
const STATUS_WEIGHTS = [0.13, 0.79, 0.06, 0.02];
const VERIFICATION_STATUSES: VerificationStatus[] = ['pending', 'verified', 'failed', 'expired'];

const METRIC_SOURCE_MAP: Record<HealthMetric, DataSource[]> = {
  steps: ['apple_health', 'fitbit', 'garmin', 'google_fit', 'samsung_health', 'whoop'],
  sleep_hours: ['apple_health', 'fitbit', 'garmin', 'oura', 'whoop', 'samsung_health'],
  sleep_quality: ['fitbit', 'oura', 'whoop', 'apple_health'],
  heart_rate_resting: ['apple_health', 'fitbit', 'garmin', 'oura', 'whoop', 'samsung_health'],
  hrv: ['apple_health', 'garmin', 'oura', 'whoop'],
  active_minutes: ['apple_health', 'fitbit', 'garmin', 'google_fit', 'samsung_health', 'whoop'],
  stress_score: ['apple_health', 'oura', 'whoop', 'fitbit'],
  hydration: ['apple_health', 'fitbit', 'samsung_health'],
  body_composition: ['apple_health', 'fitbit', 'samsung_health', 'lab_results'],
  blood_glucose: ['lab_results'],
  bmi: ['apple_health', 'fitbit', 'samsung_health', 'lab_results'],
  blood_pressure: ['apple_health', 'lab_results'],
  cholesterol: ['lab_results'],
  hba1c: ['lab_results'],
  vo2_max: ['apple_health', 'garmin', 'whoop'],
  spo2: ['apple_health', 'fitbit', 'garmin', 'samsung_health'],
  respiratory_rate: ['apple_health', 'oura', 'whoop', 'garmin'],
  body_temp_deviation: ['oura', 'whoop', 'apple_health'],
};

const AGGREGATION_TYPES: Array<'mean' | 'max' | 'min' | 'sum' | 'latest'> = ['mean', 'max', 'min', 'sum', 'latest'];
const PROOF_TYPES = ['zk_snark', 'zk_stark', 'bulletproof'] as const;
const PROOF_WEIGHTS = [0.58, 0.29, 0.13];

interface MemberState {
  id: string;
  anonymizedId: string;
  createdAt: string;
  connectedSources: DataSource[];
  demographics: HealthIdentity['demographics'];
  riskCohort: string;
  reputationTier: HealthIdentity['reputationTier'];
  healthScore: number;
  metricValues: Partial<Record<HealthMetric, number>>;
  verificationCount: number;
  enrolledCampaigns: number;
  lastVerified: string | null;
  engagementScore: number;
}

interface CampaignSimulation {
  verifications: VerificationReceipt[];
  snapshots: CampaignDailySnapshot[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hoursBucket(date: Date): number {
  return Math.floor(date.getTime() / (REFRESH_BUCKET_HOURS * 60 * 60 * 1000));
}

function pickWeightedUniqueSources(rng: () => number, count: number): DataSource[] {
  const pool = [...DATA_SOURCES];
  const weights = [...SOURCE_WEIGHTS];
  const picked: DataSource[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = weightedIndex(rng, weights);
    picked.push(pool[index]);
    pool.splice(index, 1);
    weights.splice(index, 1);
  }
  return picked;
}

function midpointForAgeRange(ageRange: string): number {
  switch (ageRange) {
    case '18-24':
      return 21;
    case '25-34':
      return 29;
    case '35-44':
      return 39;
    case '45-54':
      return 49;
    case '55-64':
      return 59;
    case '65+':
      return 69;
    default:
      return 40;
  }
}

function candidateCreatedAt(now: Date, rng: () => number): string {
  const ageDays = randomInt(rng, 15, 720);
  return new Date(now.getTime() - ageDays * 86400000).toISOString();
}

function computeMetricValues(
  rng: () => number,
  ageRange: string,
  riskCohort: string,
  connectedSources: DataSource[],
): Partial<Record<HealthMetric, number>> {
  const age = midpointForAgeRange(ageRange);
  const activityBias = clamp(normalDistribution(rng, 0, 1), -1.8, 1.8);
  const sleepBias = clamp(normalDistribution(rng, 0, 1), -1.5, 1.5);
  const cardioBias = clamp(normalDistribution(rng, 0, 1), -1.8, 1.8);
  const clinicalRisk =
    riskCohort === 'Cardiac Risk Pool' || riskCohort === 'Chronic Care Management'
      ? 1.25
      : riskCohort === 'Pre-Diabetic Watchlist'
        ? 0.95
        : riskCohort === 'Senior Wellness'
          ? 0.8
          : riskCohort === 'Active Lifestyle'
            ? -0.85
            : riskCohort === 'Low-Risk Millennial'
              ? -0.65
              : riskCohort === 'Mental Health Monitoring'
                ? 0.45
                : 0.15;

  const values: Partial<Record<HealthMetric, number>> = {};

  const assign = (metric: HealthMetric, value: number) => {
    if (METRIC_SOURCE_MAP[metric].some((source) => connectedSources.includes(source))) {
      values[metric] = value;
    }
  };

  assign('heart_rate_resting', clamp(Math.round(normalDistribution(rng, 68 + age * 0.09 + clinicalRisk * 4 - cardioBias * 4, 4.5)), 47, 96));
  assign('vo2_max', clamp(Math.round(normalDistribution(rng, 37 - age * 0.19 - clinicalRisk * 2.2 + cardioBias * 4.2, 4.4)), 19, 59));
  assign('sleep_hours', clamp(Number(normalDistribution(rng, 6.9 - clinicalRisk * 0.22 + sleepBias * 0.33, 0.6).toFixed(1)), 4.8, 9.3));
  assign('sleep_quality', clamp(Math.round(normalDistribution(rng, 73 - clinicalRisk * 4 + sleepBias * 5.5 - age * 0.08, 8)), 42, 96));
  assign('hrv', clamp(Math.round(normalDistribution(rng, 49 - age * 0.32 - clinicalRisk * 6 + cardioBias * 7, 11)), 16, 112));
  assign('active_minutes', clamp(Math.round(normalDistribution(rng, 34 - age * 0.12 + activityBias * 12 - clinicalRisk * 4, 13)), 4, 126));
  assign('stress_score', clamp(Math.round(normalDistribution(rng, 52 + clinicalRisk * 6 - sleepBias * 5, 9)), 18, 92));
  assign('spo2', clamp(Math.round(normalDistribution(rng, 97 - clinicalRisk * 0.7 - Math.max(age - 50, 0) * 0.03, 1.1)), 90, 100));
  assign('respiratory_rate', clamp(Math.round(normalDistribution(rng, 15 + clinicalRisk * 0.8 - cardioBias * 0.4, 1.8)), 10, 24));
  assign('body_temp_deviation', clamp(Number(normalDistribution(rng, 0.15 + clinicalRisk * 0.05, 0.17).toFixed(2)), -0.4, 1.1));
  assign('steps', clamp(Math.round(normalDistribution(rng, 7800 + activityBias * 2100 - clinicalRisk * 700, 1800)), 1200, 18000));
  assign('hydration', clamp(Math.round(normalDistribution(rng, 2150 + activityBias * 180, 260)), 900, 3900));
  assign('body_composition', clamp(Number(normalDistribution(rng, 28 + clinicalRisk * 3.4 - activityBias * 1.6, 4).toFixed(1)), 11, 42));
  assign('blood_glucose', clamp(Math.round(normalDistribution(rng, 96 + clinicalRisk * 10 + Math.max(age - 45, 0) * 0.22, 8)), 72, 168));
  assign('bmi', clamp(Number(normalDistribution(rng, 24.2 + clinicalRisk * 1.7 - activityBias * 0.8, 2.1).toFixed(1)), 17.2, 39.5));
  assign('blood_pressure', clamp(Math.round(normalDistribution(rng, 121 + clinicalRisk * 8 + Math.max(age - 40, 0) * 0.38, 9)), 94, 182));
  assign('cholesterol', clamp(Math.round(normalDistribution(rng, 187 + clinicalRisk * 11 + Math.max(age - 35, 0) * 0.45, 18)), 118, 298));
  assign('hba1c', clamp(Number(normalDistribution(rng, 5.4 + clinicalRisk * 0.45 + Math.max(age - 45, 0) * 0.012, 0.4).toFixed(1)), 4.5, 9.4));

  return values;
}

function computeHealthScore(metricValues: Partial<Record<HealthMetric, number>>): number {
  const scoreParts = [
    metricValues.heart_rate_resting ? 100 - clamp((metricValues.heart_rate_resting - 50) * 1.6, 0, 55) : 64,
    metricValues.vo2_max ? clamp((metricValues.vo2_max - 20) * 2.5, 18, 100) : 62,
    metricValues.sleep_quality ? clamp(metricValues.sleep_quality, 40, 100) : 68,
    metricValues.active_minutes ? clamp(metricValues.active_minutes * 1.6, 12, 100) : 58,
    metricValues.blood_pressure ? 100 - clamp((metricValues.blood_pressure - 105) * 0.9, 0, 60) : 63,
    metricValues.blood_glucose ? 100 - clamp((metricValues.blood_glucose - 82) * 0.7, 0, 55) : 64,
  ];
  const average = scoreParts.reduce((sum, score) => sum + score, 0) / scoreParts.length;
  return Math.round(clamp(average, 24, 96));
}

function computeReputationTier(connectedSources: DataSource[], createdAt: string, healthScore: number): HealthIdentity['reputationTier'] {
  const accountAgeDays = Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 86400000));
  const hasLab = connectedSources.includes('lab_results');
  const wearableDensity = connectedSources.filter((source) => source !== 'lab_results').length;
  const trustSignal = wearableDensity + (hasLab ? 1.5 : 0) + (accountAgeDays > 300 ? 0.8 : 0) + (healthScore > 70 ? 0.4 : 0);
  if (trustSignal >= 4.2) return 'high';
  if (trustSignal >= 2.2) return 'medium';
  return 'low';
}

function buildMembers(now: Date, seedOffset: number): MemberState[] {
  const rng = seededRandom(BASE_SEED + seedOffset);
  const members: MemberState[] = [];

  for (let index = 0; index < IDENTITY_COUNT; index++) {
    const ageRange = AGE_RANGES[weightedIndex(rng, AGE_RANGE_WEIGHTS)];
    const region = REGIONS[weightedIndex(rng, REGION_WEIGHTS)];
    const riskCohort = RISK_COHORTS[weightedIndex(rng, RISK_COHORT_WEIGHTS)];
    const gender = GENDERS[weightedIndex(rng, GENDER_WEIGHTS)];
    const sourceCount = randomInt(rng, 1, 5);
    const connectedSources = pickWeightedUniqueSources(rng, sourceCount);
    const createdAt = candidateCreatedAt(now, rng);
    const metricValues = computeMetricValues(rng, ageRange, riskCohort, connectedSources);
    const healthScore = computeHealthScore(metricValues);
    const reputationTier = computeReputationTier(connectedSources, createdAt, healthScore);
    const engagementScore = clamp(
      Number(
        (
          0.48 +
          connectedSources.length * 0.08 +
          (reputationTier === 'high' ? 0.18 : reputationTier === 'medium' ? 0.08 : -0.05) +
          (riskCohort === 'Active Lifestyle' ? 0.09 : 0) -
          (riskCohort === 'Mental Health Monitoring' ? 0.04 : 0) +
          normalDistribution(rng, 0, 0.08)
        ).toFixed(2),
      ),
      0.18,
      0.94,
    );

    members.push({
      id: generateId(rng, 'hid'),
      anonymizedId: generateId(rng, 'anon'),
      createdAt,
      connectedSources,
      demographics: { ageRange, gender, region },
      riskCohort,
      reputationTier,
      healthScore,
      metricValues,
      verificationCount: 0,
      enrolledCampaigns: 0,
      lastVerified: null,
      engagementScore,
    });
  }

  return members;
}

function matchesTargeting(member: MemberState, campaign: Campaign): boolean {
  const { targeting } = campaign;
  if (targeting.healthScoreMin !== undefined && member.healthScore < targeting.healthScoreMin) return false;
  if (targeting.healthScoreMax !== undefined && member.healthScore > targeting.healthScoreMax) return false;
  if (targeting.reputationTiers?.length && !targeting.reputationTiers.includes(member.reputationTier)) return false;
  if (targeting.dataSources?.length && !targeting.dataSources.some((source) => member.connectedSources.includes(source))) return false;
  if (targeting.ageRanges?.length && !targeting.ageRanges.includes(member.demographics.ageRange)) return false;
  if (targeting.genders?.length && !targeting.genders.includes(member.demographics.gender)) return false;
  if (targeting.regions?.length && !targeting.regions.includes(member.demographics.region)) return false;
  return true;
}

function supportsChallenge(member: MemberState, challenge: ChallengeCriteria): boolean {
  const supportedSources = METRIC_SOURCE_MAP[challenge.metric];
  return !!member.metricValues[challenge.metric] && supportedSources.some((source) => member.connectedSources.includes(source));
}

function passesChallenge(member: MemberState, challenge: ChallengeCriteria): boolean {
  const value = member.metricValues[challenge.metric];
  if (value === undefined) return false;
  switch (challenge.operator) {
    case 'gte':
      return value >= challenge.target;
    case 'lte':
      return value <= challenge.target;
    case 'eq':
      return Math.abs(value - challenge.target) <= 0.5;
    case 'between':
      return value >= challenge.target && value <= (challenge.targetMax ?? challenge.target);
    default:
      return false;
  }
}

function campaignProofSources(member: MemberState, metric: HealthMetric): DataSource[] {
  const supported = METRIC_SOURCE_MAP[metric].filter((source) => member.connectedSources.includes(source));
  return supported.slice(0, Math.min(2, supported.length));
}

function createTimeSeries(campaign: Campaign, rng: () => number): CampaignDailySnapshot[] {
  const startDate = new Date(campaign.startDate);
  const rawEndDate = campaign.endDate ? new Date(campaign.endDate) : new Date();
  const endDate = rawEndDate > new Date() ? new Date() : rawEndDate;
  const totalDays = Math.max(7, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const invitedPeak = campaign.funnel.invited;
  const enrolledPeak = campaign.funnel.enrolled;
  const verifiedPeak = campaign.funnel.verified;
  const budgetPeak = campaign.rewards.budgetSpent;

  const enrolledMid = totalDays * (0.34 + rng() * 0.12);
  const verifiedMid = totalDays * (0.56 + rng() * 0.12);
  const enrolledSteep = 0.12 + rng() * 0.05;
  const verifiedSteep = 0.1 + rng() * 0.04;

  let prevEnrolled = 0;
  let prevVerified = 0;

  return Array.from({ length: totalDays }, (_, day) => {
    const noise = 1 + normalDistribution(rng, 0, 0.025);
    const logistic = (mid: number, steep: number, peak: number) =>
      clamp(Math.round((peak / (1 + Math.exp(-steep * (day - mid)))) * noise), 0, peak);
    const enrolled = logistic(enrolledMid, enrolledSteep, enrolledPeak);
    const verified = Math.min(enrolled, logistic(verifiedMid, verifiedSteep, verifiedPeak));
    const budgetSpent = Math.round((verified / Math.max(verifiedPeak, 1)) * budgetPeak);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + day);
    const snapshot = {
      date: date.toISOString().slice(0, 10),
      campaignId: campaign.id,
      enrolled,
      verified,
      newEnrollments: Math.max(enrolled - prevEnrolled, 0),
      newVerifications: Math.max(verified - prevVerified, 0),
      budgetSpent,
    };
    prevEnrolled = enrolled;
    prevVerified = verified;
    void invitedPeak;
    return snapshot;
  });
}

function createVerificationsForCampaign(campaign: Campaign, members: MemberState[], seedOffset: number): CampaignSimulation {
  const rng = seededRandom(BASE_SEED + seedOffset);
  const matching = members
    .filter((member) => matchesTargeting(member, campaign) && supportsChallenge(member, campaign.challenge))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  const eligiblePool = matching.slice(0, Math.max(campaign.funnel.eligible, campaign.funnel.enrolled * 2, 1));
  const invitedPool = eligiblePool.slice(0, Math.min(eligiblePool.length, campaign.funnel.invited));
  const enrolledPool = invitedPool.slice(0, Math.min(invitedPool.length, campaign.funnel.enrolled));

  const passRanked = enrolledPool
    .filter((member) =>
      passesChallenge(member, campaign.challenge) &&
      (campaign.additionalChallenges ?? []).every((challenge) => passesChallenge(member, challenge)),
    )
    .sort((a, b) => b.engagementScore - a.engagementScore);

  const verifiedPool = passRanked.slice(0, Math.min(passRanked.length, campaign.funnel.verified));
  const pendingCandidates = enrolledPool.filter((member) => !verifiedPool.includes(member));
  const snapshots = createTimeSeries(campaign, rng);
  const snapshotDates = snapshots.map((snapshot) => snapshot.date);
  const receipts: VerificationReceipt[] = [];

  verifiedPool.forEach((member, index) => {
    const baseDate = snapshotDates[Math.min(snapshotDates.length - 1, Math.floor((index / Math.max(verifiedPool.length, 1)) * snapshotDates.length))];
    const verifiedAt = new Date(`${baseDate}T${String(randomInt(rng, 8, 21)).padStart(2, '0')}:${String(randomInt(rng, 0, 59)).padStart(2, '0')}:00.000Z`);
    const proofGenerationMs = clamp(Math.round(normalDistribution(rng, 280, 85)), 95, 1800);
    const createdAt = new Date(verifiedAt.getTime() - randomInt(rng, 2, 14) * 60000);
    const dataSources = campaignProofSources(member, campaign.challenge.metric);
    receipts.push({
      id: generateId(rng, 'vrf'),
      campaignId: campaign.id,
      identityId: member.id,
      proofType: PROOF_TYPES[weightedIndex(rng, PROOF_WEIGHTS)],
      proofHash: generateHash(rng),
      status: 'verified',
      metric: campaign.challenge.metric,
      dataSources,
      timestamp: createdAt.toISOString(),
      verifiedAt: verifiedAt.toISOString(),
      proofGenerationMs,
      metadata: {
        aggregationType: randomItem(rng, AGGREGATION_TYPES),
        timeWindowHours: campaign.type === 'stream' ? randomItem(rng, [24, 48, 72, 168]) : randomItem(rng, [1, 6, 12, 24]),
        dataPointCount: campaign.type === 'stream' ? randomInt(rng, 120, 5200) : randomInt(rng, 10, 900),
      },
    });

    member.verificationCount += 1;
    member.enrolledCampaigns += 1;
    member.lastVerified = verifiedAt.toISOString();
  });

  pendingCandidates.slice(0, Math.max(12, Math.round(enrolledPool.length * 0.08))).forEach((member, index) => {
    const baseDate = snapshotDates[Math.min(snapshotDates.length - 1, Math.floor((index / Math.max(pendingCandidates.length, 1)) * snapshotDates.length))];
    const timestamp = new Date(`${baseDate}T${String(randomInt(rng, 8, 20)).padStart(2, '0')}:${String(randomInt(rng, 0, 59)).padStart(2, '0')}:00.000Z`);
    const status = VERIFICATION_STATUSES[weightedIndex(rng, STATUS_WEIGHTS)];
    const resolvedStatus = status === 'verified' ? 'pending' : status;
    const dataSources = campaignProofSources(member, campaign.challenge.metric);
    receipts.push({
      id: generateId(rng, 'vrf'),
      campaignId: campaign.id,
      identityId: member.id,
      proofType: PROOF_TYPES[weightedIndex(rng, PROOF_WEIGHTS)],
      proofHash: generateHash(rng),
      status: resolvedStatus,
      metric: campaign.challenge.metric,
      dataSources,
      timestamp: timestamp.toISOString(),
      verifiedAt: null,
      proofGenerationMs: clamp(Math.round(normalDistribution(rng, 340, 110)), 110, 2200),
      metadata: {
        aggregationType: randomItem(rng, AGGREGATION_TYPES),
        timeWindowHours: campaign.type === 'stream' ? randomItem(rng, [24, 48, 72, 168]) : randomItem(rng, [1, 6, 12, 24]),
        dataPointCount: campaign.type === 'stream' ? randomInt(rng, 45, 2600) : randomInt(rng, 5, 400),
      },
    });

    member.enrolledCampaigns += 1;
  });

  return { verifications: receipts, snapshots };
}

function buildComplianceRecords(
  verifications: VerificationReceipt[],
  seedOffset: number,
): { complianceRecords: ComplianceRecord[]; dataProcessingSummaries: DataProcessingSummary[] } {
  const rng = seededRandom(BASE_SEED + 700 + seedOffset);
  const records: ComplianceRecord[] = [];
  const summaries: DataProcessingSummary[] = [];

  verifications.forEach((receipt) => {
    const campaign = campaigns.find((item) => item.id === receipt.campaignId);
    if (!campaign) return;
    const partnerId = campaign.partnerId;
    const requestedAt = new Date(receipt.timestamp);
    const generatedAt = new Date(requestedAt.getTime() + randomInt(rng, 2, 18) * 1000);
    records.push({
      id: generateId(rng, 'cpl'),
      eventType: 'verification_requested',
      timestamp: requestedAt.toISOString(),
      partnerId,
      campaignId: campaign.id,
      proofHash: null,
      piiAccessed: false,
      ipHash: generateHash(rng).slice(0, 18),
      userAgent: 'HealthID-Dashboard/2.0.0 (Campaign Engine)',
      details: 'Verification request initiated against insurer campaign criteria',
    });
    records.push({
      id: generateId(rng, 'cpl'),
      eventType: 'proof_generated',
      timestamp: generatedAt.toISOString(),
      partnerId,
      campaignId: campaign.id,
      proofHash: receipt.proofHash,
      piiAccessed: false,
      ipHash: generateHash(rng).slice(0, 18),
      userAgent: 'HealthID-Prover/0.9.0 (Synthetic)',
      details: `Proof materialized from ${receipt.dataSources.join(', ')} sources`,
    });
    records.push({
      id: generateId(rng, 'cpl'),
      eventType: receipt.status === 'verified' ? 'proof_verified' : 'proof_failed',
      timestamp: (receipt.verifiedAt ?? new Date(generatedAt.getTime() + randomInt(rng, 10, 120) * 1000).toISOString()),
      partnerId,
      campaignId: campaign.id,
      proofHash: receipt.proofHash,
      piiAccessed: false,
      ipHash: generateHash(rng).slice(0, 18),
      userAgent: 'HealthID-Verifier/1.4.0',
      details:
        receipt.status === 'verified'
          ? 'Binary receipt emitted with no raw biometric disclosure'
          : 'Verification did not satisfy campaign criteria or source completeness threshold',
    });
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
    const periodDate = new Date(startOfMonth);
    periodDate.setMonth(periodDate.getMonth() - monthOffset);
    const nextMonth = new Date(periodDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const period = `${periodDate.getUTCFullYear()}-${String(periodDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const periodReceipts = verifications.filter((receipt) => {
      const ts = new Date(receipt.timestamp);
      return ts >= periodDate && ts < nextMonth;
    });
    const proofsGenerated = periodReceipts.length;
    const proofsVerified = periodReceipts.filter((receipt) => receipt.status === 'verified').length;
    const proofsFailed = periodReceipts.filter((receipt) => receipt.status !== 'verified').length;
    const avgProofGenerationMs = proofsGenerated
      ? Math.round(periodReceipts.reduce((sum, receipt) => sum + receipt.proofGenerationMs, 0) / proofsGenerated)
      : 0;
    const dataSourcesAccessed = [...new Set(periodReceipts.flatMap((receipt) => receipt.dataSources))] as DataSource[];

    records.push({
      id: generateId(rng, 'cpl'),
      eventType: 'data_processed',
      timestamp: new Date(nextMonth.getTime() - 86400000).toISOString(),
      partnerId: randomItem(rng, partners).id,
      campaignId: randomItem(rng, campaigns).id,
      proofHash: null,
      piiAccessed: false,
      ipHash: generateHash(rng).slice(0, 18),
      userAgent: 'HealthID-Orchestrator/1.2.0',
      details: `Monthly aggregation close completed for ${period}`,
    });
    records.push({
      id: generateId(rng, 'cpl'),
      eventType: 'audit_query',
      timestamp: new Date(nextMonth.getTime() - 43200000).toISOString(),
      partnerId: randomItem(rng, partners).id,
      campaignId: null,
      proofHash: null,
      piiAccessed: false,
      ipHash: generateHash(rng).slice(0, 18),
      userAgent: 'HealthID-Dashboard/2.0.0 (Audit)',
      details: `Compliance export requested for ${period} receipt activity`,
    });
    summaries.push({
      period,
      recordsProcessed: Math.round(proofsGenerated * (7.2 + randomInt(rng, 0, 4))),
      proofsGenerated,
      proofsVerified,
      proofsFailed,
      avgProofGenerationMs,
      dataSourcesAccessed,
      piiAccessEvents: 0,
    });
  }

  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  summaries.sort((a, b) => a.period.localeCompare(b.period));

  return { complianceRecords: records, dataProcessingSummaries: summaries };
}

function buildSimulation() {
  const now = new Date();
  const seedOffset = hoursBucket(now);
  const members = buildMembers(now, seedOffset);
  const verifications: VerificationReceipt[] = [];
  const campaignTimeSeries: CampaignDailySnapshot[] = [];

  campaigns.forEach((campaign, index) => {
    if (campaign.status === 'draft') return;
    const simulation = createVerificationsForCampaign(campaign, members, seedOffset + index * 17);
    verifications.push(...simulation.verifications);
    campaignTimeSeries.push(...simulation.snapshots);
  });

  const identities: HealthIdentity[] = members
    .map((member) => ({
      id: member.id,
      anonymizedId: member.anonymizedId,
      healthScore: member.healthScore,
      reputationTier: member.reputationTier,
      connectedSources: member.connectedSources,
      demographics: member.demographics,
      riskCohort: member.riskCohort,
      verificationCount: member.verificationCount,
      lastVerified: member.lastVerified,
      enrolledCampaigns: member.enrolledCampaigns,
      createdAt: member.createdAt,
    }))
    .sort((a, b) => {
      if (b.verificationCount !== a.verificationCount) return b.verificationCount - a.verificationCount;
      return b.healthScore - a.healthScore;
    });

  const compliance = buildComplianceRecords(verifications, seedOffset);

  return {
    identities,
    verifications: verifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    campaignTimeSeries: campaignTimeSeries.sort((a, b) => a.date.localeCompare(b.date)),
    complianceRecords: compliance.complianceRecords,
    dataProcessingSummaries: compliance.dataProcessingSummaries,
  };
}

const simulation = buildSimulation();

export const identities = simulation.identities;
export const verifications = simulation.verifications;
export const campaignTimeSeries = simulation.campaignTimeSeries;
export const complianceRecords = simulation.complianceRecords;
export const dataProcessingSummaries = simulation.dataProcessingSummaries;
