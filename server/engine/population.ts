import type { MemberAgent, Market } from "@shared/schema";
import { globalLifeSegments, type GlobalLifeSegment } from "./globalSegments";
import {
  ACTIVITY_STEP_ADJUSTMENT,
  ATTITUDE,
  DISTRICT_INCOME_MATCH,
  DISTRICTS,
  FAMILY,
  HEALTH_HISTORY,
  INCOME_FINANCIAL_PRESSURE_MEAN,
  INCOME_WEARABLE_ADJUSTMENT,
  marketLabel,
  OCCUPATIONS,
  type OccupationProfile,
} from "./personaData";

export interface UploadedLifeSegmentRow {
  id: string;
  label: string;
  weight: number;
  ageBand: string;
  baselineSteps: number;
  mortalityPer1k: number;
  wearableOwnership: number;
  modifiabilityIndex: number;
  rewardSensitivity: number;
  source: string;
}

function ageRangeFromBand(ageBand: string) {
  const match = ageBand.match(/(\d+)\D+(\d+)/);
  if (!match) return { minAge: 25, maxAge: 64 };
  return {
    minAge: Math.max(18, Number(match[1])),
    maxAge: Math.min(85, Number(match[2])),
  };
}

export function segmentsFromUpload(rows: UploadedLifeSegmentRow[]): GlobalLifeSegment[] {
  return rows.map((row) => {
    const range = ageRangeFromBand(row.ageBand);
    return {
      id: row.id,
      label: row.label,
      ageBand: row.ageBand,
      minAge: range.minAge,
      maxAge: range.maxAge,
      weight: row.weight,
      baselineSteps: row.baselineSteps,
      mortalityPer1k: row.mortalityPer1k,
      wearableOwnership: row.wearableOwnership,
      digitalReadiness: Math.max(0.1, Math.min(0.95, row.wearableOwnership * 0.7 + 0.2)),
      modifiabilityIndex: row.modifiabilityIndex,
      mortalityRiskIndex: Math.max(0.5, Math.min(3, row.mortalityPer1k / 2.4)),
      rewardSensitivity: row.rewardSensitivity,
      evidenceScope: "client",
      source: row.source,
    };
  });
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

// "Target high-risk members" pool: take the highest-mortality-risk segments
// until they cover at least ~20% of book weight (mirrors the non-low claims
// tiers the financial chain renormalizes to when targeting).
export function targetedSegmentPool(segments: GlobalLifeSegment[]): GlobalLifeSegment[] {
  const sorted = [...segments].sort((a, b) => b.mortalityRiskIndex - a.mortalityRiskIndex);
  const total = sorted.reduce((s, b) => s + b.weight, 0);
  const out: GlobalLifeSegment[] = [];
  let cum = 0;
  for (const s of sorted) {
    out.push(s);
    cum += s.weight;
    if (cum >= total * 0.2) break;
  }
  return out.length ? out : segments;
}

function pickSegment(rng: () => number, segments: GlobalLifeSegment[]): GlobalLifeSegment {
  const total = segments.reduce((s, b) => s + b.weight, 0);
  let r = rng() * total;
  for (const b of segments) {
    r -= b.weight;
    if (r <= 0) return b;
  }
  return segments[segments.length - 1];
}

function weightedPick<T>(rng: () => number, items: T[], weight: (item: T) => number): T {
  const weights = items.map((it) => Math.max(0, weight(it)));
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length) % items.length];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function personaBlurb(a: Omit<MemberAgent, "personaBlurb">): string {
  const sexW = a.sex === "F" ? "woman" : "man";
  return `${a.age}-year-old ${sexW}, ${a.occupation} in ${a.district}; ${a.family}. ${capitalize(a.healthHistory)}. ~${a.baselineSteps.toLocaleString()} steps/day. Outlook: ${a.attitude}.`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generatePopulationSample(
  market: Market,
  sampleSize: number,
  seed: number,
  segmentOverride?: GlobalLifeSegment[],
  targetHighRisk?: boolean
): MemberAgent[] {
  const rng = mulberry32(seed);
  const baseSegments = segmentOverride?.length ? segmentOverride : globalLifeSegments(market);
  const segments = targetHighRisk ? targetedSegmentPool(baseSegments) : baseSegments;
  const districts = DISTRICTS[market];
  const agents: MemberAgent[] = [];
  // Track used (occupation+family) combos to maximise distinctness
  const seen = new Set<string>();
  for (let i = 0; i < sampleSize; i++) {
    const segment = pickSegment(rng, segments);
    const age = Math.round(segment.minAge + rng() * (segment.maxAge - segment.minAge));

    // Occupation must fit the member's age; retry a few combos for variety.
    const eligibleJobs = OCCUPATIONS.filter((o) => age >= o.minAge && age <= o.maxAge);
    let occ: OccupationProfile = eligibleJobs[0] ?? OCCUPATIONS[0];
    let familyDef = FAMILY.filter((f) => age >= f.minAge && age <= f.maxAge);
    if (!familyDef.length) familyDef = [FAMILY[0]];
    let fam = familyDef[0];
    for (let tries = 0; tries < 6; tries++) {
      occ = eligibleJobs[Math.floor(rng() * eligibleJobs.length) % eligibleJobs.length] ?? occ;
      fam = familyDef[Math.floor(rng() * familyDef.length) % familyDef.length];
      const key = `${marketLabel(occ.label, market)}|${marketLabel(fam.label, market)}`;
      if (!seen.has(key)) {
        seen.add(key);
        break;
      }
    }
    const occupation = marketLabel(occ.label, market);
    const family = marketLabel(fam.label, market);

    // Sex follows the occupation's real-world skew (nurses vs electricians).
    const sex: "M" | "F" = rng() < (occ.femaleShare ?? 0.5) ? "F" : "M";

    // Where the member lives follows population weight pulled toward districts
    // matching the occupation's income band.
    const district = weightedPick(rng, districts, (d) => d.weight * DISTRICT_INCOME_MATCH[occ.income][d.income]).name;

    // What the job physically demands shifts the realistic daily step count.
    const baselineSteps = Math.max(
      1500,
      Math.round(gaussian(rng, segment.baselineSteps + ACTIVITY_STEP_ADJUSTMENT[occ.activity], 1400))
    );
    const mortality = segment.mortalityPer1k * (1 + (segment.baselineSteps - baselineSteps) / 20000);

    const motivation = clamp01(gaussian(rng, 0.38 + segment.modifiabilityIndex * 0.28, 0.18));
    const conscientiousness = clamp01(gaussian(rng, 0.5 + segment.digitalReadiness * 0.12, 0.2));
    // Schedule pressure compounds: age stage + job demands + family situation.
    const timePressure = clamp01(
      gaussian(rng, (age > 38 ? 0.55 : 0.46) + (occ.timeBias ?? 0) + (fam.timeBias ?? 0), 0.15)
    );
    const techSavvy = clamp01(gaussian(rng, segment.digitalReadiness + (occ.techBias ?? 0), 0.15));
    const healthAnxiety = clamp01(gaussian(rng, 0.35 + segment.mortalityRiskIndex / 5, 0.2));
    // Income band, not a coin flip, drives financial pressure.
    const financialPressure = clamp01(gaussian(rng, INCOME_FINANCIAL_PRESSURE_MEAN[occ.income], 0.16));
    const wearableOwner =
      rng() < segment.wearableOwnership + (techSavvy - 0.5) * 0.12 + INCOME_WEARABLE_ADJUSTMENT[occ.income];

    // Health history must be possible for this body and this life: age- and
    // sex-gated, desk-work complaints only for desk workers, chronic findings
    // weighted toward high-mortality segments.
    const historyPool = HEALTH_HISTORY.filter(
      (h) =>
        (h.minAge === undefined || age >= h.minAge) &&
        (h.maxAge === undefined || age <= h.maxAge) &&
        (h.sex === undefined || h.sex === sex) &&
        (!h.requiresSedentary || occ.activity === "sedentary")
    );
    const history = weightedPick(rng, historyPool, (h) =>
      Math.max(0.15, 1 + (h.riskBias ?? 0) * (segment.mortalityRiskIndex - 1))
    );

    // Attitude is sampled by trait affinity so the narrative matches the
    // numbers ("loves gadgets" goes to tech-savvy members, "too busy" to the
    // time-pressured) instead of contradicting them.
    const traits = { motivation, conscientiousness, timePressure, techSavvy, healthAnxiety, financialPressure };
    const riskyHistory = (history.riskBias ?? 0) > 0.3;
    const attitudePool = ATTITUDE.filter(
      (a) => (a.minSteps === undefined || baselineSteps >= a.minSteps) && (!a.requiresRiskyHistory || riskyHistory)
    );
    const attitude = weightedPick(rng, attitudePool, (a) => {
      let w = 1;
      for (const [trait, coef] of Object.entries(a.affinity ?? {})) {
        w += coef * (traits[trait as keyof typeof traits] - 0.5) * 1.6;
      }
      return Math.max(0.06, w);
    }).text;

    const base = {
      id: i,
      age,
      ageBand: segment.ageBand,
      sex,
      baselineSteps,
      mortalityPer1k: Math.round(mortality * 100) / 100,
      wearableOwner,
      motivation: round2(motivation),
      conscientiousness: round2(conscientiousness),
      timePressure: round2(timePressure),
      techSavvy: round2(techSavvy),
      healthAnxiety: round2(healthAnxiety),
      financialPressure: round2(financialPressure),
      occupation,
      district,
      family,
      healthHistory: history.text,
      attitude,
      incomeBand: occ.income,
    };
    agents.push({ ...base, personaBlurb: personaBlurb(base) });
  }
  return agents;
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

export function bookPriors(market: Market) {
  const segments = globalLifeSegments(market);
  return bookPriorsFromSegments(segments);
}

export function bookPriorsFromSegments(segments: GlobalLifeSegment[]) {
  const avgMortality =
    segments.reduce((s, b) => s + b.mortalityPer1k * b.weight, 0) /
    segments.reduce((s, b) => s + b.weight, 0);
  const avgSteps =
    segments.reduce((s, b) => s + b.baselineSteps * b.weight, 0) /
    segments.reduce((s, b) => s + b.weight, 0);
  const wearablePct =
    segments.reduce((s, b) => s + b.wearableOwnership * b.weight, 0) /
    segments.reduce((s, b) => s + b.weight, 0);
  return {
    avgMortalityPer1k: avgMortality,
    avgSteps,
    wearablePct,
  };
}
