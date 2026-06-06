import type { DataSource } from '@/types';
import type { SourceConfidenceBand, ConfidenceModulatingFactor, SignalSourceType } from '../types';

export const SOURCE_CONFIDENCE_BANDS: SourceConfidenceBand[] = [
  // Clinical sources
  { source: 'lab_results', signalType: 'clinical', baseConfidence: 0.92, minConfidence: 0.85, maxConfidence: 0.96 },
  // Advanced wearables
  { source: 'apple_health', signalType: 'wearable', baseConfidence: 0.72, minConfidence: 0.58, maxConfidence: 0.82 },
  { source: 'garmin', signalType: 'wearable', baseConfidence: 0.70, minConfidence: 0.56, maxConfidence: 0.80 },
  { source: 'whoop', signalType: 'wearable', baseConfidence: 0.71, minConfidence: 0.57, maxConfidence: 0.81 },
  { source: 'oura', signalType: 'wearable', baseConfidence: 0.69, minConfidence: 0.55, maxConfidence: 0.79 },
  // Basic wearables
  { source: 'fitbit', signalType: 'wearable', baseConfidence: 0.63, minConfidence: 0.48, maxConfidence: 0.74 },
  { source: 'google_fit', signalType: 'wearable', baseConfidence: 0.55, minConfidence: 0.40, maxConfidence: 0.66 },
  { source: 'samsung_health', signalType: 'wearable', baseConfidence: 0.58, minConfidence: 0.43, maxConfidence: 0.69 },
];

export const CONFIDENCE_MODULATING_FACTORS: ConfidenceModulatingFactor[] = [
  {
    id: 'consistency',
    label: 'Consistency',
    description: 'How consistently the member provides data across days and weeks.',
    defaultWeight: 0.15,
    min: 0,
    max: 0.3,
  },
  {
    id: 'recency',
    label: 'Recency',
    description: 'How recent the latest data point is relative to the assessment window.',
    defaultWeight: 0.20,
    min: 0,
    max: 0.35,
  },
  {
    id: 'corroboration',
    label: 'Corroboration',
    description: 'Whether multiple sources or signals confirm the same trend.',
    defaultWeight: 0.10,
    min: 0,
    max: 0.25,
  },
];

export function getSourceConfidence(source: DataSource): SourceConfidenceBand | undefined {
  return SOURCE_CONFIDENCE_BANDS.find((b) => b.source === source);
}

export function getConfidenceByType(type: SignalSourceType): SourceConfidenceBand[] {
  return SOURCE_CONFIDENCE_BANDS.filter((b) => b.signalType === type);
}

export const SOURCE_TYPE_BASE_CONFIDENCE: Record<SignalSourceType, number> = {
  clinical: 0.92,
  wearable: 0.63,
  user_reported: 0.28,
};
