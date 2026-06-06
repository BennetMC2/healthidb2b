import { identities } from '@/data/simulation';
import type { HealthIdentity } from '@/types';
import type { CohortDefinition, BehaviourLeverId } from '../types';

interface CohortResult {
  members: HealthIdentity[];
  size: number;
  avgHealthScore: number;
  avgConfidence: number;
  signalAvailability: Record<string, number>;
  baselineStats: Record<BehaviourLeverId, number>;
}

const AGE_RANGE_TO_BOUNDS: Record<string, [number, number]> = {
  '18-24': [18, 24],
  '25-34': [25, 34],
  '35-44': [35, 44],
  '45-54': [45, 54],
  '55-64': [55, 64],
  '65+': [65, 100],
};

function ageInRange(ageRange: string, min: number, max: number): boolean {
  const bounds = AGE_RANGE_TO_BOUNDS[ageRange];
  if (!bounds) return false;
  return bounds[0] <= max && bounds[1] >= min;
}

function matchesDeviceClass(sources: string[], deviceClass: CohortDefinition['deviceClass']): boolean {
  const hasAdvanced = sources.some((s) => ['apple_health', 'garmin', 'whoop'].includes(s));
  const hasRing = sources.includes('oura');
  const hasClinical = sources.includes('lab_results');
  const hasBasic = sources.some((s) => ['fitbit', 'google_fit', 'samsung_health'].includes(s));

  switch (deviceClass) {
    case 'advanced_wearable': return hasAdvanced;
    case 'basic_wearable': return hasBasic || hasAdvanced;
    case 'ring': return hasRing;
    case 'clinical': return hasClinical;
    case 'mixed': return true;
  }
}

function matchesRisk(riskCohort: string, risk: CohortDefinition['baselineRisk']): boolean {
  const highRisk = ['Chronic Care Management', 'Cardiac Risk Pool', 'Senior Wellness'];
  const lowRisk = ['Low-Risk Millennial', 'Active Lifestyle'];

  if (risk === 'high') return highRisk.includes(riskCohort);
  if (risk === 'low') return lowRisk.includes(riskCohort);
  return !highRisk.includes(riskCohort) && !lowRisk.includes(riskCohort);
}

function matchesEngagement(score: number, tier: CohortDefinition['engagementTier']): boolean {
  if (!tier) return true;
  if (tier === 'high') return score >= 0.65;
  if (tier === 'medium') return score >= 0.3 && score < 0.65;
  return score < 0.3;
}

export function filterCohort(definition: CohortDefinition): CohortResult {
  const [ageMin, ageMax] = definition.ageRange;

  const members = identities.filter((identity) => {
    if (!ageInRange(identity.demographics.ageRange, ageMin, ageMax)) return false;
    if (definition.gender && !definition.gender.includes(identity.demographics.gender)) return false;
    if (!matchesDeviceClass(identity.connectedSources, definition.deviceClass)) return false;
    if (!matchesRisk(identity.riskCohort, definition.baselineRisk)) return false;
    if (definition.hasClinicalData && !identity.connectedSources.includes('lab_results')) return false;
    if (definition.minDataRichness && identity.confidenceScore < definition.minDataRichness) return false;

    // Engagement tier proxy from enrolledCampaigns and verificationCount
    const engagementProxy = Math.min(1, (identity.enrolledCampaigns * 0.2 + identity.verificationCount * 0.1));
    if (!matchesEngagement(engagementProxy, definition.engagementTier)) return false;

    return true;
  });

  const size = members.length;
  const avgHealthScore = size > 0
    ? members.reduce((sum, m) => sum + m.healthScore, 0) / size
    : 0;
  const avgConfidence = size > 0
    ? members.reduce((sum, m) => sum + m.confidenceScore, 0) / size
    : 0;

  // Signal availability: count of members with each source
  const signalAvailability: Record<string, number> = {};
  const allSources = ['apple_health', 'fitbit', 'garmin', 'oura', 'whoop', 'google_fit', 'samsung_health', 'lab_results'];
  for (const source of allSources) {
    const count = members.filter((m) => m.connectedSources.includes(source as never)).length;
    signalAvailability[source] = size > 0 ? count / size : 0;
  }

  // Baseline stats derived from healthScore distribution
  const baselineStats: Record<BehaviourLeverId, number> = {
    activity: avgHealthScore / 100 * 0.85 + 0.05,
    sleep: avgHealthScore / 100 * 0.80 + 0.10,
    cardiovascular: avgHealthScore / 100 * 0.82 + 0.08,
    body_composition: avgHealthScore / 100 * 0.78 + 0.10,
    stress: avgHealthScore / 100 * 0.75 + 0.12,
    smoking: 0.75 + avgHealthScore / 100 * 0.15,
  };

  return {
    members,
    size,
    avgHealthScore: Math.round(avgHealthScore * 10) / 10,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    signalAvailability,
    baselineStats,
  };
}
