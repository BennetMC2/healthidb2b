// ── Portfolio Allocator Store ─────────────────────────────────────────
// Holds the current allocation and exposes actions for the Plan UI.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  solvePortfolio,
  resolveWithWeights,
  resolveWithBudget,
  resolveWithRoiFloor,
} from '@/utils/portfolioSolver';
import { DEFAULT_WEIGHTS, DEFAULT_CONSTRAINTS } from '@/types/portfolio';
import type {
  PortfolioAllocation,
  ObjectiveWeights,
  LineStatus,
} from '@/types/portfolio';

interface PortfolioStore {
  /** Current working allocation */
  allocation: PortfolioAllocation | null;
  /** History of committed allocations */
  committedAllocations: PortfolioAllocation[];

  // ── Actions ──────────────────────────────────────────────────────

  /** Initialize a fresh allocation for a partner */
  initialize: (partnerId: string, partnerLabel: string, partnerLives: number) => void;

  /** Update objective weights — triggers live re-solve */
  setWeights: (weights: ObjectiveWeights) => void;

  /** Update single weight — triggers live re-solve */
  setSingleWeight: (key: keyof ObjectiveWeights, value: number) => void;

  /** Update budget envelope — triggers live re-solve */
  setBudget: (budget: number) => void;

  /** Update ROI floor — triggers live re-solve */
  setRoiFloor: (floor: number) => void;

  /** Pin a line to a specific reward (or null to unpin) */
  pinLine: (lineId: string, rewardHp: number | null) => void;

  /** Toggle a line's status (include/exclude) */
  setLineStatus: (lineId: string, status: LineStatus) => void;

  /** Commit the current allocation (creates campaigns) */
  commitAllocation: () => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      allocation: null,
      committedAllocations: [],

      initialize: (partnerId, partnerLabel, partnerLives) => {
        const allocation = solvePortfolio(
          DEFAULT_WEIGHTS,
          DEFAULT_CONSTRAINTS,
          partnerId,
          partnerLabel,
          partnerLives,
        );
        set({ allocation });
      },

      setWeights: (weights) => {
        const current = get().allocation;
        if (!current) return;
        const allocation = resolveWithWeights(current, weights);
        set({ allocation });
      },

      setSingleWeight: (key, value) => {
        const current = get().allocation;
        if (!current) return;
        const weights = { ...current.weights, [key]: Math.max(0, Math.min(1, value)) };
        const allocation = resolveWithWeights(current, weights);
        set({ allocation });
      },

      setBudget: (budget) => {
        const current = get().allocation;
        if (!current) return;
        const allocation = resolveWithBudget(current, budget);
        set({ allocation });
      },

      setRoiFloor: (floor) => {
        const current = get().allocation;
        if (!current) return;
        const allocation = resolveWithRoiFloor(current, floor);
        set({ allocation });
      },

      pinLine: (lineId, rewardHp) => {
        const current = get().allocation;
        if (!current) return;
        set({
          allocation: {
            ...current,
            lines: current.lines.map((l) =>
              l.id === lineId
                ? { ...l, pinnedRewardHp: rewardHp, status: rewardHp !== null ? 'pinned' as const : 'included' as const }
                : l,
            ),
          },
        });
      },

      setLineStatus: (lineId, status) => {
        const current = get().allocation;
        if (!current) return;

        const updatedLines = current.lines.map((l) =>
          l.id === lineId ? { ...l, status } : l,
        );

        // Recompute aggregates
        const included = updatedLines.filter((l) => l.status === 'included' || l.status === 'pinned');
        const totalBudget = included.reduce((s, l) => s + l.budgetAllocated, 0);
        const totalValue = {
          claims: included.reduce((s, l) => s + l.value.claims, 0),
          mortality: included.reduce((s, l) => s + l.value.mortality, 0),
          retention: included.reduce((s, l) => s + l.value.retention, 0),
          acquisition: included.reduce((s, l) => s + l.value.acquisition, 0),
          fidelity: included.reduce((s, l) => s + l.value.fidelity, 0),
          total: included.reduce((s, l) => s + l.value.total, 0),
        };

        set({
          allocation: {
            ...current,
            lines: updatedLines,
            totalValue,
            totalBudget,
            portfolioRoi: totalBudget > 0 ? Number((totalValue.total / totalBudget).toFixed(2)) : 0,
            includedLineCount: included.length,
          },
        });
      },

      commitAllocation: () => {
        const current = get().allocation;
        if (!current) return;

        const committed: PortfolioAllocation = {
          ...current,
          status: 'committed',
          committedAt: new Date().toISOString(),
        };

        set({
          allocation: committed,
          committedAllocations: [committed, ...get().committedAllocations],
        });
      },
    }),
    {
      name: 'healthid-portfolio-store',
      partialize: (state) => ({
        committedAllocations: state.committedAllocations.slice(0, 10), // keep last 10
      }),
    },
  ),
);
