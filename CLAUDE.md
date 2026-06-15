# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (frontend + API via server/vite.ts)
npm run build        # tsc + vite build + npm run build:api (esbuild via script/build-api.ts)
npm run lint         # ESLint (flat config in eslint.config.js)
npm run preview      # Preview static build
```

There is no test suite. No single-test command exists.

The backend runs via Express (`server/sim-server.ts`); in dev mode Vite proxies API calls to it through `server/vite.ts`. In production (`server/vercel.ts`) the Express app is the Vercel serverless entry point.

## Architecture

### Two distinct "apps" in one repo

**Frontend sales demo** (`src/pages/`, `src/data/`, `src/components/`) — a fully static, self-contained interactive sales tool for enterprise partners. All data is deterministically seeded (no API calls, no randomness between builds). Three selectable partner personas (insurer, pharma, employer) drive UI copy. The walkthrough/tour system is in `src/walkthrough/` and `src/components/walkthrough/`.

**Agentic simulator** (`src/simulator-agentic/`, `server/engine/`, `server/routes.ts`) — a live actuarial engine that calls Claude via `@anthropic-ai/sdk`. This is separate from the static demo and is routed at `/simulator`, `/actuary`, `/operator`, `/allocator`. It has a real SQLite backend (`data.db`, accessed via Drizzle ORM in `server/storage.ts`).

### The actuarial engine chain (`server/engine/`)

This is the pricing core. The flow is:

```
orchestrator.ts (LLM parses goal → selects signals)
  → rewardResponse.ts (elasticity curve: reward → engagement)
  → doseResponse.ts (engagement → behaviour/dose change)
  → claimsBridge.ts (dose → claims $ avoided)
  → mortalityMargin.ts (dose → mortality margin)
  → lifeInsuranceValue.ts (scales value by verification grade: self_reported 0.25 → zero_custody_verified 1.0)
  → cohortRewardAllocator.ts (optimises reward across cohorts under ROI constraint)
  → montecarlo.ts + uncertainty.ts (confidence intervals)
```

**Key invariant from `orchestrator.ts`:** `Do not set reward; reward is derived downstream.` Reward is a *solved output* of the value model, not a user input. This is architecturally central — see `BRIEF_Portfolio_Allocator_Integration.md` for the ongoing build that enforces this in the UI.

### Shared schema (`shared/`)

`shared/schema.ts` and `shared/tables.ts` define all cross-boundary types: `ResolvedPlan`, `RewardStrategyConfig`, `RewardOptimization`, `CohortRewardAllocation(Result)`, `LifeInsuranceValueResult`, `MonteCarloResult`. Always extend these rather than inventing parallel types. This `shared/` directory is also the contract boundary with the consumer app (`longevity-guide`) — don't diverge schema here.

### State management

Zustand stores in `src/stores/` handle demo state, partner persona, and toasts. TanStack Query (`@tanstack/react-query`) handles server state for the agentic simulator routes. Static demo pages don't use TanStack Query.

### In-progress major build

`BRIEF_Portfolio_Allocator_Integration.md` describes a significant architectural shift: unifying `src/pages/CampaignCreate.tsx` (which currently has a manual `pointsPerVerification` input) with the agentic simulator's `RewardOptimization` / `RewardDriver` logic, so the campaign builder calls the engine and reward is always engine-derived. The new page is `src/pages/Allocator.tsx`. Read the full brief before touching reward-related code — it explains the philosophy and what not to entrench.

### Dead code warning

There was previously a `src/simulator/` directory (a "campaign-centric 7-chapter" rebuild). It has been removed or was never routed. If it reappears, it is dead — do not treat it as authoritative.

## Design system

Dark, terminal-inspired. Base background `#0a0b0d`, surface `#111318`, elevated `#161920`. Accent blue `#4ca5ff`. Reputation tier colours: diamond (purple), platinum (blue), gold, silver, bronze. Custom Tailwind animations: `fade-in`, `slide-in`, `flow-pulse`, `hash-reveal`, `proof-step`, `shimmer`. Typography: Inter (sans), JetBrains Mono (mono).

## Deployment

Vercel. `vercel.json` present. The build emits a static frontend plus a serverless Express entry (`server/vercel.ts`). The `build:api` step (`script/build-api.ts`) bundles the server with esbuild into `dist/`.
