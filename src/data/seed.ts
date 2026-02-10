// ── Seeded Random Number Generator ──────────────────────────────────
// Mulberry32 — a fast, high-quality 32-bit PRNG with deterministic output.
// All mock data is generated from this so it stays stable across reloads.

/**
 * Creates a seeded pseudo-random number generator using the Mulberry32 algorithm.
 * Returns a function that produces floats in [0, 1) on each call.
 */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max] (inclusive). */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Random float in [min, max). */
export function randomFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

/** Pick a single random item from an array. */
export function randomItem<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick `count` unique random items from an array (Fisher-Yates partial shuffle). */
export function randomItems<T>(rng: () => number, arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Box-Muller transform for normally-distributed values.
 * Returns a value centered on `mean` with the given `stddev`.
 */
export function normalDistribution(rng: () => number, mean: number, stddev: number): number {
  let u = 0;
  let v = 0;
  // Avoid log(0)
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stddev;
}

/** Generate a hex hash string like `0x3a7f9b2c...` (64 hex chars after 0x). */
export function generateHash(rng: () => number): string {
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += Math.floor(rng() * 16).toString(16);
  }
  return hash;
}

/** Generate an ID like `hid_a3f7b2c1` with a given prefix. */
export function generateId(rng: () => number, prefix: string): string {
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += Math.floor(rng() * 16).toString(16);
  }
  return `${prefix}_${id}`;
}

/**
 * Pick an index from a weighted distribution array.
 * `weights` does not need to sum to 1 — it is normalised internally.
 */
export function weightedIndex(rng: () => number, weights: readonly number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** Generate a random ISO-8601 date string between two Date objects. */
export function randomDate(rng: () => number, start: Date, end: Date): string {
  const ms = start.getTime() + rng() * (end.getTime() - start.getTime());
  return new Date(ms).toISOString();
}
