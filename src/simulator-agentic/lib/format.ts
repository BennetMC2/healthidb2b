// ONE formatter module for the results page. Every number the user sees goes
// through here, so units can never silently diverge between panels.
//
// Conventions:
//  - Rewards are stored internally as USD / member / MONTH (PMPM) and shown
//    PMPM-first everywhere, with the per-year equivalent as a secondary unit.
//  - "Frac" arguments are fractions (0.24 = 24%), never pre-multiplied.
//  - "Roi" arguments are ratios (0.8 = 80% return on cost).
import { HP_PER_USD } from "@shared/schema";

export function safeNumber(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

// --- money ---
export function fmtUsd(n: number | null | undefined, compact = true): string {
  const v = safeNumber(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (compact) {
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

// --- percentages (fractions in, % out) ---
export function fmtPct(x: number | null | undefined, digits = 0): string {
  return `${(safeNumber(x) * 100).toFixed(digits)}%`;
}

// ROI ratio (0.8 → "+80%", -0.2 → "−20%")
export function fmtRoi(ratio: number | null | undefined, digits = 0): string {
  const v = safeNumber(ratio);
  const pct = (v * 100).toFixed(digits);
  return v > 0 ? `+${pct}%` : `${pct}%`;
}

// --- rewards (canonical unit: USD PMPM) ---
export function fmtPmpm(usdPerMonth: number | null | undefined): string {
  return `$${safeNumber(usdPerMonth).toFixed(2)} PMPM`;
}

export function fmtPerYear(usdPerMonth: number | null | undefined): string {
  return `$${Math.round(safeNumber(usdPerMonth) * 12).toLocaleString()}/member·yr`;
}

export function fmtHp(usdPerMonth: number | null | undefined): string {
  return `${Math.round(safeNumber(usdPerMonth) * HP_PER_USD).toLocaleString()} HP/mo`;
}

// The full canonical reward line: "$8.50 PMPM · = $102/member·yr · 850 HP/mo"
export function rewardLine(usdPerMonth: number | null | undefined): string {
  return `${fmtPmpm(usdPerMonth)} · = ${fmtPerYear(usdPerMonth)} · ${fmtHp(usdPerMonth)}`;
}
