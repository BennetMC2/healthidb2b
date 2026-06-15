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
  bookValue: number; // claims savings × scalar ("Est. book-value opportunity")
  grossValue: number; // total value created × scalar
  totalCost: number; // reward + admin + platform (NOT scaled — cost is fixed)
  netValue: number; // grossValue − totalCost (coherent with the above)
  roiRatio: number; // net / cost (0.8 = +80%)
  roi: number; // displayed ROI multiple = roiRatio + 1 (e.g. 3.7×)
  roiLow: number; // ROI band low (multiple)
  roiHigh: number; // ROI band high (multiple)
  payback: number | null; // months
  enrollmentRate: number;
  persistenceRate: number;
  behaviorChangeRate: number;
  downsideProbability: number;
  bookSize: number;
  simulatedAt: number;
}

// The single formula. Anything showing a demo play's headline numbers must go
// through this so the surfaces cannot drift apart.
//
// The model scalar scales VALUE (gross / claims), leaving cost fixed, so net
// value and ROI follow coherently — i.e. gross/cost/net/ROI all agree, which is
// what lets the AI Actuary cards, Campaigns gallery and the Simulator's Decision
// readout show one identical, internally-consistent set of numbers per play.
export function playEconomicsFromSnapshot(seeded: SeededRunResult, modelScalar: number): PlayEconomics {
  const f = seeded.finance;
  const grossValue = Math.round(f.valueCreatedP50 * modelScalar);
  const totalCost = f.totalCostP50;
  const netValue = grossValue - totalCost;
  const roiRatio = totalCost > 0 ? netValue / totalCost : 0;
  // Band: scale each gross-value percentile the same way (roiP* are net ratios,
  // so (roiP*+1) is the gross/cost multiple at the floor; scaling gross by the
  // scalar scales that multiple).
  return {
    bookValue: Math.round(f.claimsSavingsP50 * modelScalar),
    grossValue,
    totalCost,
    netValue,
    roiRatio,
    roi: Number((roiRatio + 1).toFixed(1)),
    roiLow: Number(((f.roiP5 + 1) * modelScalar).toFixed(1)),
    roiHigh: Number(((f.roiP95 + 1) * modelScalar).toFixed(1)),
    payback: seeded.paybackMonths != null ? Math.max(1, Math.round(seeded.paybackMonths / modelScalar)) : null,
    enrollmentRate: seeded.behavior.enrollmentRate,
    persistenceRate: seeded.behavior.persistenceRate,
    behaviorChangeRate: seeded.behavior.behaviorChangeRate,
    downsideProbability: f.downsideProbability,
    bookSize: seeded.plan.bookSize,
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
