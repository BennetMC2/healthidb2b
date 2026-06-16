# HealthID — Platform UX + Model-Management Build Plan (DRAFT)

**Decisions framing this plan:** models become *managed data* (not code) · the UX reorganizes around the **allocate → commit → monitor → recalibrate** loop · we build *demo-now, pilot-ready* — every demo choice must not block the pilot.

**Status:** planning draft to react to. Nothing here is built yet.

---

## 0. The one insight

"Tweak values / drop in a new model" and "improve the enterprise flow" are **the same problem**. The thing that makes a model droppable-in (models as versioned data, managed through the product) is the same thing that makes the platform feel enterprise-grade. The **model-management experience is the connective tissue** — plan it as the spine, hang the rest off it.

What already exists (so we're building on, not from zero):
- Engine resolves a model at runtime (`resolveActiveModel`) — store-agnostic-ready.
- Model Studio edits assumptions + signs off — but **in-memory only**.
- `model_input_versions` table + `/api/governance/model-inputs` — unused, sitting there for exactly this.
- `BRIEF_Portfolio_Allocator_Integration.md` — an existing north star for the loop-based UX.
- Models are currently **hardcoded TS** (`server/engine/models.ts`, `assumptionSets.ts`) — the main thing to move.

---

## 1. Information architecture & flow (UX)

### From a toolbox to a workflow
Today nav is a flat tool list (AI Actuary · Simulator · Campaign Studio · Cohorts · Model Studio · Treasury · Verification Trail · Settings). Reorganize into **four workflow phases + a governance layer**, so it reads as one job:

| Phase | What it is | Folds in today's |
|---|---|---|
| **1 · Plan** | Propose-first allocation cockpit: engine recommends how to spend the budget across the book → steer weights / budget / ROI floor → drill into a play (engine-priced) → commit | AI Actuary (landing) + Allocator + Simulator (as drill-down) + Campaign Create |
| **2 · Run / Monitor** | Committed campaigns performing against holdouts; verification trail; recalibration alerts | Campaigns (live) + Verification Trail + cohort trajectories |
| **3 · Book / Cohorts** | The population & cohort explorer (the thing the insurer is allocating across) | Cohorts / Network Explorer |
| **4 · Treasury** | Budget & yield mechanics | Treasury |
| **◆ Models** (governance layer, role-gated) | Create / fork / edit / import / sign / activate models; the Assumptions Register | Model Studio + new model management |
| **⚙ Settings / Admin** | Tenant, API keys, roles | Settings |

### Cross-cutting UX principles
- **Never a blank page** — Plan opens on a proposed, ROI-positive allocation ("here's what I'd do with your $X").
- **One narrative** — a breadcrumb/stepper shows where you are in the loop; the loop closes visibly (commit → proofs → "what it learned" on next open).
- **Roles shape the view** — actuary sees Models + sign-off; operator sees Plan + Run; admin sees everything. (Headers already carry org/role.)
- **Trust surfaced everywhere** — the "Model: X" badge, provenance flags (🟢🟡🟠🔵), and audit are always one glance away. This *is* the product's differentiator.
- **First-run & empty states** — onboarding that walks the loop once; sensible empty states.

### Demo-now vs pilot for UX
- **Demo-now:** relabel/regroup nav into the four phases; make Plan propose-first; keep existing pages behind the new IA (low-risk, mostly frontend).
- **Pilot:** full Plan/Monitor reframe per the Allocator brief; role-gated views; multi-tenant book switching.

---

## 2. Model lifecycle (models as managed data)

### Target data model
A **model = metadata + a validated assumption-set payload**, stored as versioned data:
```
model {
  id, name, version, parentModelId,
  basis (evidence|forward|ai|expert_calibrated),
  governanceStatus (draft|signed),
  confidencePosture (floor|base|ceiling),
  visibility (buyer_facing|internal_only),
  owner, signedBy, signedAt,
  payload: AssumptionSet,        // the whole economic/clinical/program set
  changelog: ChangeLogEntry[],
}
```
Most of this metadata already exists in `shared/models.ts`. The new part is **persisting the payload as data + versioning**.

### The single most important "don't paint into a corner" move
**Define the `AssumptionSet` payload schema in `shared/` with zod, now.** One source of truth for the shape + validation. Then storage can be a JSON file for the demo and a DB table for the pilot **without touching the engine or the UI**. Make `resolveActiveModel` read through a small **store interface** (`getModel`, `listModels`, `saveModelVersion`) so the backend swaps cleanly: demo = in-memory/JSON, pilot = DB (the `model_input_versions` table).

### Lifecycle operations (this *is* the "drop in a model" capability)
- **Create / Fork** — fork = clone + `parentModelId` (Forward already works this way).
- **Edit** — Studio edit → persisted override → new version (today it's in-memory; make it stick).
- **Import** ⭐ — ingest a **filled expert worksheet** (CSV/JSON from Craig/Candice/Piet) → validate → draft model. This is the bridge from the experts to the product, and a killer demo moment ("we just dropped in Piet's signed model and the whole book re-priced").
- **Validate** — zod schema + sanity rules (no negative attribution, costs present, the two trust tables reconciled, etc.). Validation rules come from the experts' bounds.
- **Sign off** — actuary names + dates → `signed` → immutable; further edits require a fork. (Provenance integrity: ai_projected can't silently flow into a signed floor.)
- **Activate** — set the session/tenant active model (engine already honors `modelId`).
- **Diff / Compare** — vs parent or vs another model (Studio has diff-vs-floor already).
- **Version & rollback.**

### Migration path (incremental, never breaks the engine)
1. Define `AssumptionSet` zod schema in `shared/`; validate the existing TS sets against it.
2. Add the store interface; seed it from today's hardcoded sets (so behavior is identical).
3. `resolveActiveModel` reads from the store (fallback to TS).
4. Persist Studio edits as versions.
5. Worksheet import → draft model.
6. DB-back the store; add roles + activation gating (pilot).

---

## 3. Phasing — demo-now, pilot-ready

| Capability | Demo-now (ship for the sales demo) | Pilot-ready (architect now, build later) |
|---|---|---|
| **IA / flow** | Regroup nav into the four loop phases; propose-first Plan | Full Plan/Monitor reframe; role-gated views |
| **Model storage** | `AssumptionSet` zod schema + JSON/in-memory store behind an interface | DB-backed (`model_input_versions`), versioned, rollback |
| **Studio edits** | Persist within a session/process | Persist to DB with full change log + audit |
| **Worksheet import** | Import → draft model (in-memory) → activate live in the demo | Validated pipeline, per-tenant, role-gated |
| **Sign-off** | Real status flip + badge | Governed, immutable, role-restricted |
| **Tenancy / roles** | Thread tenant + role through request context (headers exist); don't expose UI yet | Real auth, multi-tenant models + books, role UI |
| **Prove-it-works** | — | Wire `backtests` / `lifeBacktest` to real holdout data |

**Decisions that keep the door open for pilot (make these now even in the demo):**
1. `AssumptionSet` schema lives in `shared/` (one source, validated).
2. `resolveActiveModel` goes through a store interface (storage is swappable).
3. Tenant + role flow through request context everywhere, even if the UI ignores them for now.

---

## 4. Risks / open questions
- **Allocator reorg touches routing** — phase it behind current pages so the demo never destabilizes.
- **Validation bounds depend on the experts** — ties directly to the worksheets; chicken-and-egg, so ship import with loose validation first.
- **Cohorting + privacy** (from the model plan) intersects the Book view — the k-anonymity floor is a correctness/legal precondition, not "later." Flag for the Book/Cohorts phase.
- **Multi-tenant data model** — decide early whether models are global, per-tenant, or both (shared base + tenant forks).

---

## 5. Suggested sequence
- **Phase 0 (now, planning):** this doc + a clickable IA sketch + the `AssumptionSet` schema definition.
- **Phase 1 (demo slice):** loop-based IA · persist Studio edits + sign-off · worksheet import → activate.
- **Phase 2 (pilot architecture):** DB-backed models · roles/permissions · multi-tenant · validation rules · backtest wiring.

---

*Companion docs in repo: `BRIEF_Portfolio_Allocator_Integration.md` (UX north star), `expert-briefs/` (worksheets feeding model import), the model plan (six pieces + owners).*
