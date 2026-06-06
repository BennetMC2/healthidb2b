import type { HealthIdentity, DataSource } from '@/types';

export interface CohortSummary {
  name: string;
  riskScore: number;
  memberCount: number;
  avgHealthScore: number;
  avgConfidenceScore: number;
  topSources: { source: DataSource; count: number }[];
  trustDistribution: { high: number; medium: number; low: number };
  verifiedPct: number;
}

const BASE_RISK_SCORES: Record<string, number> = {
  'Pre-Diabetic Watchlist': 0.82,
  'Cardiac Risk Pool': 0.71,
  'Chronic Care Management': 0.68,
  'Senior Wellness': 0.58,
  'Mental Health Monitoring': 0.54,
  'Maternity Track': 0.47,
  'Low-Risk Millennial': 0.29,
  'Active Lifestyle': 0.22,
};

export function computeCohortSummaries(identities: HealthIdentity[]): CohortSummary[] {
  const groups = new Map<string, HealthIdentity[]>();

  for (const id of identities) {
    const list = groups.get(id.riskCohort) ?? [];
    list.push(id);
    groups.set(id.riskCohort, list);
  }

  const summaries: CohortSummary[] = [];

  for (const [name, members] of groups) {
    const count = members.length;
    const avgHealth = members.reduce((s, m) => s + m.healthScore, 0) / count;
    const avgConfidence = members.reduce((s, m) => s + m.confidenceScore, 0) / count;

    // Trust distribution
    const trust = { high: 0, medium: 0, low: 0 };
    members.forEach((m) => trust[m.reputationTier]++);

    // Top sources
    const sourceCounts: Record<string, number> = {};
    members.forEach((m) =>
      m.connectedSources.forEach((s) => {
        sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
      }),
    );
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([source, cnt]) => ({ source: source as DataSource, count: cnt }));

    // Verified %
    const verifiedCount = members.filter((m) => m.verificationCount > 0).length;

    // Blend base risk score with actual data
    const baseRisk = BASE_RISK_SCORES[name] ?? 0.5;
    const dataRisk = 1 - avgHealth / 100;
    const riskScore = Number((baseRisk * 0.7 + dataRisk * 0.3).toFixed(3));

    summaries.push({
      name,
      riskScore,
      memberCount: count,
      avgHealthScore: Math.round(avgHealth * 10) / 10,
      avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
      topSources,
      trustDistribution: trust,
      verifiedPct: verifiedCount / count,
    });
  }

  return summaries.sort((a, b) => b.riskScore - a.riskScore);
}
