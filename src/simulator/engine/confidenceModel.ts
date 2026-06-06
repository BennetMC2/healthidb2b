import type { HealthMetric, DataSource } from '@/types';
import type { ConfidenceResult, InterventionId } from '../types';
import { SOURCE_CONFIDENCE_BANDS, SOURCE_TYPE_BASE_CONFIDENCE, CONFIDENCE_MODULATING_FACTORS } from '../data/sourceConfidence';
import { SIGNALS } from '../data/signals';
import { CLINICAL_RULES } from '../data/interventions';
import { EVIDENCE_LIBRARY } from '../data/evidence';

const EVIDENCE_CONFIDENCE: Record<'high' | 'medium' | 'low', number> = {
  high: 0.72,
  medium: 0.54,
  low: 0.34,
};

/**
 * Score data confidence for a set of signals and their available sources.
 */
export function scoreDataConfidence(
  signals: HealthMetric[],
  availableSources: DataSource[],
  modulatingFactors?: Record<string, number>,
): number {
  if (signals.length === 0) return 0;

  let totalConfidence = 0;

  for (const signalId of signals) {
    const signal = SIGNALS.find((s) => s.id === signalId);
    if (!signal) continue;

    // Best source confidence for this signal
    const signalSources = signal.sources.filter((s) => availableSources.includes(s));
    if (signalSources.length === 0) {
      totalConfidence += 0.15; // Minimal confidence if signal has no available source
      continue;
    }

    const bestSourceBand = signalSources
      .map((s) => SOURCE_CONFIDENCE_BANDS.find((b) => b.source === s))
      .filter(Boolean)
      .sort((a, b) => b!.baseConfidence - a!.baseConfidence)[0];

    let confidence = bestSourceBand?.baseConfidence ?? SOURCE_TYPE_BASE_CONFIDENCE[signal.sourceType];

    // Apply modulating factors
    if (modulatingFactors) {
      for (const factor of CONFIDENCE_MODULATING_FACTORS) {
        const weight = modulatingFactors[factor.id] ?? factor.defaultWeight;
        confidence *= (1 + weight * 0.2); // Modest impact
      }
    }

    // Multi-source bonus
    if (signalSources.length > 1) {
      confidence *= 1 + signalSources.length * 0.03;
    }

    totalConfidence += Math.min(0.96, confidence);
  }

  return Math.min(0.96, Math.max(0.1, totalConfidence / signals.length));
}

/**
 * Score evidence confidence for an intervention based on linked literature.
 */
export function scoreEvidenceConfidence(interventionIds: InterventionId[]): number {
  if (interventionIds.length === 0) return 0;

  let totalConfidence = 0;

  for (const intId of interventionIds) {
    const rules = CLINICAL_RULES.filter((r) => r.interventionId === intId);
    if (rules.length === 0) {
      totalConfidence += EVIDENCE_CONFIDENCE.low;
      continue;
    }

    const evidenceIds = [...new Set(rules.map((r) => r.evidenceId))];
    const evidences = evidenceIds
      .map((id) => EVIDENCE_LIBRARY.find((e) => e.id === id))
      .filter(Boolean);

    if (evidences.length === 0) {
      totalConfidence += EVIDENCE_CONFIDENCE.low;
      continue;
    }

    // Best evidence level across all linked citations
    const hasHigh = evidences.some((e) => e!.evidenceLevel === 'high');
    const hasMedium = evidences.some((e) => e!.evidenceLevel === 'medium');
    const baseLevel = hasHigh ? 'high' : hasMedium ? 'medium' : 'low';

    let confidence = EVIDENCE_CONFIDENCE[baseLevel];

    // Multi-citation bonus
    if (evidences.length > 2) {
      confidence *= 1.08;
    }

    // Large sample size bonus
    const maxSample = Math.max(...evidences.map((e) => e!.sampleSize));
    if (maxSample > 100000) confidence *= 1.05;

    totalConfidence += Math.min(0.92, confidence);
  }

  return Math.min(0.92, Math.max(0.15, totalConfidence / interventionIds.length));
}

/**
 * Compute composite confidence result.
 */
export function computeConfidence(
  signals: HealthMetric[],
  availableSources: DataSource[],
  interventionIds: InterventionId[],
  realizationFactor: number,
  modulatingFactors?: Record<string, number>,
): ConfidenceResult {
  const dataConfidence = scoreDataConfidence(signals, availableSources, modulatingFactors);
  const evidenceConfidence = scoreEvidenceConfidence(interventionIds);

  const compositeConfidence = Math.min(
    0.92,
    dataConfidence * 0.45 + evidenceConfidence * 0.40 + realizationFactor * 0.15,
  );

  let label: ConfidenceResult['label'];
  if (compositeConfidence >= 0.62) label = 'higher confidence';
  else if (compositeConfidence >= 0.40) label = 'directional';
  else label = 'exploratory';

  return {
    dataConfidence: Math.round(dataConfidence * 100) / 100,
    evidenceConfidence: Math.round(evidenceConfidence * 100) / 100,
    compositeConfidence: Math.round(compositeConfidence * 100) / 100,
    label,
  };
}
