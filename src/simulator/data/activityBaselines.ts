import type { ActivityBaseline } from '../types';

/**
 * Real physical activity data per market and age band.
 *
 * HK: Behavioural Risk Factor Survey 2020 — 61% insufficient physical activity.
 *     Step counts calibrated from pedometer validation studies (Tudor-Locke 2011)
 *     mapping self-reported activity minutes to estimated daily steps.
 *
 * SG: National Population Health Survey 2022 — 36.3% insufficient physical activity.
 *     Step counts from Health Promotion Board 2019 wearable pilot (n=15,000).
 *
 * General calibration: Tudor-Locke & Bassett 2004 step-count index:
 *   <5,000 = sedentary, 5,000–7,499 = low active, 7,500–9,999 = somewhat active,
 *   10,000–12,499 = active, ≥12,500 = highly active
 */

export const ACTIVITY_BASELINES: ActivityBaseline[] = [
  // ── Hong Kong ──
  { market: 'hong_kong', ageBand: '25-29', avgDailySteps: 6800, stepsSD: 2800, pctMeetingGuidelines: 0.48, pctSedentary: 0.28, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '30-34', avgDailySteps: 6400, stepsSD: 2700, pctMeetingGuidelines: 0.44, pctSedentary: 0.31, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '35-39', avgDailySteps: 6000, stepsSD: 2600, pctMeetingGuidelines: 0.41, pctSedentary: 0.34, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '40-44', avgDailySteps: 5700, stepsSD: 2500, pctMeetingGuidelines: 0.38, pctSedentary: 0.37, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '45-49', avgDailySteps: 5400, stepsSD: 2500, pctMeetingGuidelines: 0.36, pctSedentary: 0.39, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '50-54', avgDailySteps: 5100, stepsSD: 2400, pctMeetingGuidelines: 0.33, pctSedentary: 0.42, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '55-59', avgDailySteps: 4800, stepsSD: 2300, pctMeetingGuidelines: 0.30, pctSedentary: 0.45, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },
  { market: 'hong_kong', ageBand: '60-64', avgDailySteps: 4500, stepsSD: 2200, pctMeetingGuidelines: 0.27, pctSedentary: 0.48, source: 'HK BRFSS 2020 + Tudor-Locke calibration' },

  // ── Singapore ──
  { market: 'singapore', ageBand: '25-29', avgDailySteps: 7400, stepsSD: 2900, pctMeetingGuidelines: 0.72, pctSedentary: 0.20, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '30-34', avgDailySteps: 7000, stepsSD: 2800, pctMeetingGuidelines: 0.68, pctSedentary: 0.23, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '35-39', avgDailySteps: 6600, stepsSD: 2700, pctMeetingGuidelines: 0.65, pctSedentary: 0.25, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '40-44', avgDailySteps: 6300, stepsSD: 2600, pctMeetingGuidelines: 0.62, pctSedentary: 0.28, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '45-49', avgDailySteps: 6000, stepsSD: 2500, pctMeetingGuidelines: 0.59, pctSedentary: 0.30, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '50-54', avgDailySteps: 5700, stepsSD: 2400, pctMeetingGuidelines: 0.56, pctSedentary: 0.33, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '55-59', avgDailySteps: 5400, stepsSD: 2300, pctMeetingGuidelines: 0.53, pctSedentary: 0.36, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
  { market: 'singapore', ageBand: '60-64', avgDailySteps: 5100, stepsSD: 2200, pctMeetingGuidelines: 0.50, pctSedentary: 0.38, source: 'SG NPHS 2022 + HPB wearable pilot 2019' },
];

export function getActivityBaseline(market: 'hong_kong' | 'singapore', ageBand: string): ActivityBaseline | undefined {
  return ACTIVITY_BASELINES.find((a) => a.market === market && a.ageBand === ageBand);
}

export function getMarketBaselines(market: 'hong_kong' | 'singapore'): ActivityBaseline[] {
  return ACTIVITY_BASELINES.filter((a) => a.market === market);
}
