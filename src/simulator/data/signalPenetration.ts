/**
 * Real-world signal penetration data by market and age band.
 *
 * What % of people in each age band have each signal type?
 *
 * Phone (steps, walking steadiness):
 *   HK: 89% smartphone penetration (GSMA 2023), skews younger
 *   SG: 92% smartphone penetration (GSMA 2023)
 *
 * Wearable (HR, HRV, sleep staging, SpO₂):
 *   HK: ~22% wearable penetration (GfK/Statista 2023), skews 25-44
 *   SG: ~28% wearable penetration (GfK/Statista 2023), higher tech adoption
 *
 * App (user-reported sleep, meals, mood):
 *   Estimated ~35-40% of smartphone users install a health app
 *   Source: Deloitte Global Mobile Consumer Survey 2023
 *
 * Each signal type maps to specific health metrics we can measure:
 *
 * Phone signals:
 *   - Daily steps (accelerometer)
 *   - Walking steadiness / gait (iOS/Android)
 *   - Location-based activity patterns
 *
 * Wearable signals (additive — these people also have phone signals):
 *   - Resting heart rate
 *   - Heart rate variability (HRV)
 *   - Sleep duration + staging (light/deep/REM)
 *   - SpO₂
 *   - Active minutes / exercise detection
 *   - Respiratory rate (some devices)
 *
 * App signals (additive — self-reported via health app):
 *   - Sleep quality (subjective)
 *   - Stress / mood
 *   - Nutrition / meals
 *   - Symptoms
 */

export interface SignalPenetrationBand {
  ageBand: string;
  phonePct: number;       // % with smartphone → steps, walking steadiness
  appPct: number;         // % with health app → self-reported data
  wearablePct: number;    // % with wearable → HR, HRV, sleep, SpO₂
}

export interface MarketSignalPenetration {
  market: 'hong_kong' | 'singapore';
  overallSmartphone: number;
  overallWearable: number;
  overallHealthApp: number;
  bands: SignalPenetrationBand[];
  source: string;
}

export const SIGNAL_PENETRATION: Record<string, MarketSignalPenetration> = {
  hong_kong: {
    market: 'hong_kong',
    overallSmartphone: 0.89,
    overallWearable: 0.22,
    overallHealthApp: 0.34,
    bands: [
      { ageBand: '25-29', phonePct: 0.97, appPct: 0.45, wearablePct: 0.32 },
      { ageBand: '30-34', phonePct: 0.96, appPct: 0.42, wearablePct: 0.30 },
      { ageBand: '35-39', phonePct: 0.94, appPct: 0.38, wearablePct: 0.26 },
      { ageBand: '40-44', phonePct: 0.92, appPct: 0.35, wearablePct: 0.22 },
      { ageBand: '45-49', phonePct: 0.90, appPct: 0.30, wearablePct: 0.18 },
      { ageBand: '50-54', phonePct: 0.86, appPct: 0.25, wearablePct: 0.15 },
      { ageBand: '55-59', phonePct: 0.82, appPct: 0.20, wearablePct: 0.12 },
      { ageBand: '60-64', phonePct: 0.75, appPct: 0.15, wearablePct: 0.08 },
    ],
    source: 'GSMA Intelligence 2023 (smartphone); GfK/Statista 2023 (wearable); Deloitte Global Mobile Consumer Survey 2023 (health app)',
  },
  singapore: {
    market: 'singapore',
    overallSmartphone: 0.92,
    overallWearable: 0.28,
    overallHealthApp: 0.40,
    bands: [
      { ageBand: '25-29', phonePct: 0.98, appPct: 0.52, wearablePct: 0.38 },
      { ageBand: '30-34', phonePct: 0.97, appPct: 0.48, wearablePct: 0.35 },
      { ageBand: '35-39', phonePct: 0.96, appPct: 0.44, wearablePct: 0.32 },
      { ageBand: '40-44', phonePct: 0.94, appPct: 0.40, wearablePct: 0.28 },
      { ageBand: '45-49', phonePct: 0.93, appPct: 0.36, wearablePct: 0.25 },
      { ageBand: '50-54', phonePct: 0.90, appPct: 0.30, wearablePct: 0.22 },
      { ageBand: '55-59', phonePct: 0.88, appPct: 0.25, wearablePct: 0.18 },
      { ageBand: '60-64', phonePct: 0.82, appPct: 0.18, wearablePct: 0.12 },
    ],
    source: 'GSMA Intelligence 2023 (smartphone); GfK/Statista 2023 (wearable); Deloitte Global Mobile Consumer Survey 2023 (health app)',
  },
};

export function getSignalPenetration(market: 'hong_kong' | 'singapore'): MarketSignalPenetration {
  return SIGNAL_PENETRATION[market];
}

export function getSignalPenetrationBand(market: 'hong_kong' | 'singapore', ageBand: string): SignalPenetrationBand | undefined {
  return SIGNAL_PENETRATION[market].bands.find((b) => b.ageBand === ageBand);
}

/**
 * Signals available at each tier and their health impact pathways.
 */
export const SIGNAL_HEALTH_PATHWAYS = {
  phone: {
    signals: ['daily_steps', 'walking_steadiness'],
    healthPathways: ['steps_mortality', 'steps_cvd', 'steps_diabetes'],
    description: 'Steps → mortality (Paluch 2022), CVD (PURE), diabetes (Aune 2015)',
  },
  app: {
    signals: ['sleep_duration_reported', 'stress_level', 'nutrition'],
    healthPathways: ['sleep_mortality'],
    description: 'Self-reported sleep → mortality risk (Cappuccio 2010)',
  },
  wearable: {
    signals: ['resting_hr', 'hrv', 'sleep_staging', 'spo2', 'active_minutes'],
    healthPathways: ['hrv_cardiovascular', 'sleep_mortality_precise', 'fitness_mortality'],
    description: 'HRV → CV risk (Hilton 2022), precise sleep → mortality, fitness → mortality (Mandsager 2018)',
  },
} as const;
