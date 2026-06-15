import { SEEDED_RESULTS } from '@shared/seeded-results';
import type { SeededRunResult } from '@shared/campaigns';

// ===========================================================================
// Canonical per-play economics — ONE source of truth for the headline numbers
// every surface shows for a demo play (AI Actuary cards, Campaigns gallery,
// Campaign detail, and the Simulator replay). The seeded simulation snapshot is
// authoritative; the active model's realization scalar is applied here, in one
// place, so a given play reads identically everywhere and moves together when
// the model switches.
// ===========================================================================

export interface PlayEconomics {
  bookValue: number; // "Est. book-value opportunity" — claims savings × scalar
  roi: number; // displayed ROI multiple (net return × scalar, + 1)
  roiLow: number; // ROI band low (multiple)
  roiHigh: number; // ROI band high (multiple)
  payback: number | null; // months
  netValue: number; // net value (unscaled snapshot figure)
  enrollmentRate: number;
  persistenceRate: number;
  behaviorChangeRate: number;
  downsideProbability: number;
  simulatedAt: number;
}

// The single formula. Anything showing a demo play's headline numbers must go
// through this so the surfaces cannot drift apart.
export function playEconomicsFromSnapshot(seeded: SeededRunResult, modelScalar: number): PlayEconomics {
  const f = seeded.finance;
  return {
    bookValue: Math.round(f.claimsSavingsP50 * modelScalar),
    roi: Number((f.roiP50 * modelScalar + 1).toFixed(1)),
    roiLow: Number((f.roiP5 * modelScalar + 1).toFixed(1)),
    roiHigh: Number((f.roiP95 * modelScalar + 1).toFixed(1)),
    payback: seeded.paybackMonths != null ? Math.max(1, Math.round(seeded.paybackMonths / modelScalar)) : null,
    netValue: f.netValueP50,
    enrollmentRate: seeded.behavior.enrollmentRate,
    persistenceRate: seeded.behavior.persistenceRate,
    behaviorChangeRate: seeded.behavior.behaviorChangeRate,
    downsideProbability: f.downsideProbability,
    simulatedAt: seeded.simulatedAt,
  };
}

export function getSeededResult(campaignId: string): SeededRunResult | undefined {
  return SEEDED_RESULTS.find((r) => r.campaignId === campaignId);
}

// Canonical economics for a play by its seeded campaignId (or undefined if the
// play has no snapshot — e.g. non-signal campaign families).
export function playEconomicsById(campaignId: string, modelScalar: number): PlayEconomics | undefined {
  const seeded = getSeededResult(campaignId);
  return seeded ? playEconomicsFromSnapshot(seeded, modelScalar) : undefined;
}

// Maps a Campaigns-gallery template id → its canonical seeded play, so the
// gallery and the AI Actuary cards show the same numbers for the same play.
export const TEMPLATE_TO_PLAY: Record<string, string> = {
  'vo2-max-activation': 'ins_vo2_activation',
  'hrv-recovery': 'ins_hrv_recovery',
  'sleep-regularity': 'ins_sleep_regularity',
  'resting-heart-rate-improvement': 'ins_resting_hr_improvement',
};
