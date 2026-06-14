# Brief — Unify the Campaign Builder and Pricing Simulator into a Book-Level Reward-Budget Portfolio Allocator

**Repo:** `HealthID-B2B-Platform` (insurer cockpit)
**Status:** Design brief for a major build. Read the whole thing before touching code — the *why* matters as much as the *what*, because the current builder is philosophically backwards relative to the engine and a naive "add a Simulate button" will entrench the wrong model.
**Author's note:** this came out of a deep design session. Where it says "decide during build," that's a genuine open question, not an oversight — flag it, propose a default, don't silently pick.

---

## 0. The thesis (what the enterprise user is actually doing)

The insurer is **not building marketing campaigns. They are allocating a finite incentive budget across their book of lives to drive *verified* behaviour change in the most valuable way — and every dollar must clear ROI at the portfolio level.**

The "value" is multi-pool, not just health: claims avoided (morbidity), mortality margin (life book), retained premium (retention), acquired LTV (acquisition), upsell/growth, and — critically — **data fidelity**, which is a *multiplier* on all the others. A "campaign" is a **line item** in this allocation, not the top-level object.

This is already how the engine thinks. `server/engine/orchestrator.ts` states it outright: *"Do not set reward; reward is derived downstream."* The whole chain is **reward → engagement (`rewardResponse`) → behaviour/dose (`doseResponse`) → claims \$ (`claimsBridge`) + mortality margin (`mortalityMargin`) → present-valued, verification-graded value (`lifeInsuranceValue`)**, optimised across cohorts by `cohortRewardAllocator`, all under Monte-Carlo uncertainty. **Reward is an output of a value-first optimisation.**

The problem we're fixing: the **campaign builder treats reward as a user input** — `src/pages/CampaignCreate.tsx` has the operator type `pointsPerVerification` into a box, assisted only by the lightweight `src/components/campaigns/ActuarialROICalculator.tsx`. Meanwhile the real optimiser — `src/simulator-agentic/` with its `RewardOptimization` (ROI curve, `optimalReward`, "suggest optimal reward" in `RewardDriver.tsx`) — sits on a **separate page the builder never calls.** Two surfaces can produce two different reward numbers for the same campaign, which is a credibility hole in front of an actuary. We are merging them so that **building a campaign *is* committing a priced slice of a portfolio optimisation.**

---

## 1. The object reframe

| Today | Target |
|---|---|
| Campaign = top-level object you create (metric, targeting, **manual reward**, budget) | **Allocation** = top-level object: a budget distributed across the book |
| Reward = typed input | Reward = **solved output** of the value model, per line |
| Simulator = separate exploration page | Simulator = **the pricing engine behind the allocation** |
| Campaign builder = a 5-step form | Campaign builder = **drill-down + commit** on one line of the allocation |

One object, two faces (see §4): a **Plan** face (steer the allocation, commit) and a **Monitor** face (watch it perform, recalibrate). The cockpit that already exists (`src/pages/Actuary.tsx`, "Today's brief…") is the Monitor face. This brief builds the Plan face and unifies them around one portfolio object.

---

## 2. The value model

### 2.1 Multi-pool value
Each candidate play produces present-valued, risk-adjusted value across one or more pools, each with its own dose-response, evidence tier/confidence, and payback horizon:

- **Morbidity** — `claimsBridge`
- **Mortality margin** — `mortalityMargin`
- **Retention** — retained premium (renewal plays)
- **Acquisition** — LTV of pre-verified open-pool members (beyond campaign horizon)
- **Growth / upsell** — `growth.ts`, `UpsellProduct`
- **Data fidelity** — see §2.3 (a multiplier, not a pool you bank directly)

### 2.2 Verified value (verification grade is a value multiplier — the business model in one number)
`server/engine/lifeInsuranceValue.ts` already scales value by verification grade: `self_reported 0.25 → device 0.5 → source_attested 0.72 → multi_signal 0.86 → zero_custody_verified 1.0`. A verified outcome is worth ~4× a self-reported one because the insurer can actually **book** it. Keep this front and centre: it's *why* the ZK/proof layer is a pricing feature, not a privacy nicety, and it's what makes pay-for-verified-outcome rational.

### 2.3 Data fidelity is a portfolio multiplier, not a campaign type
Because of §2.2, a play that merely gets a cohort to connect a wearable (raise its verification grade) **lifts the bookable value of every other play on that cohort.** The optimiser MUST model this second-order effect or it will systematically under-invest in the single highest-leverage move. Treat fidelity uplift as an **enablement term** that credits the originating play with the downstream value it unlocks (see §3.2).

---

## 3. The optimisation

**Objective:** maximise total risk-adjusted, present-valued, *verified* value across pools, per dollar of reward.

**Hard constraint:** **portfolio-level ROI ≥ target (≥ 1).** Decided: ROI is enforced at the **portfolio** level, not per play — high-ROI plays (claims, mortality) may subsidise strategically valuable but individually-negative plays (acquisition, fidelity). When ring-fences are on (§3.3), the floor applies *per ring-fence*.

### 3.1 Solve for reward, don't ask for it
Per line, the engine produces the reward ROI curve and the optimum (reuse `RewardOptimization` / `RewardDriver` logic from `src/simulator-agentic/`). The operator chooses *where on the curve to sit* (max ROI ↔ max lives moved ↔ spend-to-budget), they don't type a number. The `pointsPerVerification` box in `CampaignCreate.tsx` is replaced by a point-on-curve selection bound to the engine output.

### 3.2 Cross-play value attribution (the meatiest new modelling)
Under a portfolio floor, enabling plays (acquisition, fidelity) look like losers in isolation, so they must be **credited for value created elsewhere**:
- **Fidelity play value** = own (often negative) ROI **+** the uplift it creates in other plays' bookable value via the verification multiplier.
- **Acquisition play value** = own ROI **+** future premium/LTV beyond horizon.

Your `campaignCombiner` already models the *negative* cross-effect (overlap discount, to avoid double-counting). This adds the **positive** cross-effect (enablement credit). Build them as two sides of one cross-play interaction layer.

**Guardrail against "strategic" becoming a dumping ground for losers** — every enabling/subsidised play must have:
1. a **named mechanism** for its spillover,
2. a **measurable signal** it's working (fidelity → verification-grade change in the proofs; acquisition → LTV/retention), and
3. a **proof-based sunset**: if the spillover doesn't materialise in the receipts within a window, the subsidy auto-pulls.
This is also a credibility feature — it's the first objection an actuary will raise about a portfolio floor.

### 3.3 Ring-fences are configuration, not architecture
Build **one joint optimiser over the whole book** (the cross-line value in §2.3/§3.2 only exists if you optimise jointly). Expose **optional per-line ring-fence constraints** (min/max budget per business line) for customers with siloed P&Ls. A per-line setup is just the joint optimiser with hard ring-fences on; the ROI floor then applies per ring-fence. **Decouple the math (always joint) from the org chart (config + permissions + who may set objective weights).** Do not build per-line silos as the primitive — you'd throw away the differentiator.

### 3.4 Two scarce resources: dollars *and* member attention
Budget is not the only constraint. Every business line competes for the same member's finite attention; over-nudging causes fatigue. Model an **attention budget per member** that all plays draw on, with the overlap/fatigue logic in `campaignCombiner` extended to operate **across** lines, not just within one. *(Exact attention-cap mechanics — per-member nudge cap, decay, priority arbitration — decide during build; propose a default.)*

### 3.5 Live recalibration (the moat)
`rewardResponse` fits the elasticity curve from **observed reward arms**. So: early plays are priced from published priors (conservative, wide CIs); as real verified proofs return, they re-price from the **book's own measured elasticity** (tighter, more confident, can justify spending more where it pays). The allocation is **re-optimised over time** as evidence accrues. This is the same proof stream that powers the holdout/trajectory measurement — pricing and proof are one loop.

---

## 4. The operator flow — "she steers it, she doesn't build it"

Recommended default. Value/book-first at the top; goal-first natural language as a drill-down; **never a blank page.**

**Plan mode** (periodic — reallocating):
1. **Open on a proposal.** The tool greets her with a sensible default ROI-positive allocation of her budget across the book — "here's what I'd do with your \$X against \$Y of addressable liability, and why." Never an empty form.
2. **Steer with a few high-level levers, re-solving live:** budget envelope, **objective weights** (claims vs retention vs acquisition vs growth vs fidelity), ROI floor, horizon, constraints (ring-fences, attention caps, exclusions). Dragging a weight and watching the allocation + efficient frontier move is the core interaction. *The objective function is the product.*
3. **Drill into any line to interrogate or override** → today's single-campaign view, but **pre-priced**: reward curve, evidence + its ceiling, holdout design, verification grade required, projected verified value with CIs. Pin a reward or exclude a cohort → the **portfolio re-optimises around the pin.** This drill-down is also the **trust architecture** (actuaries reject black boxes; they accept numbers they can open up). Your engine already emits methodology/evidence/sensitivity — surface it here.
4. **Goal-first NL = "add a play / what-if."** "What if I also went after diabetes claims in SG?" → `orchestrator.ts` parses → prices → drops a candidate line into the portfolio to accept/reject. NL stays central but in its right role (exploring additions), not collapsing the book into one goal.
5. **Commit → loop closes.** Chosen allocation becomes live campaigns; configs flow to consumer delivery → proofs → trajectories → recalibration. Next open leads with **what it learned** ("the cardio play's measured response beat its price — \$X to reallocate").

**Monitor mode** (day-to-day): the existing cockpit (`src/pages/Actuary.tsx`) — watch the committed portfolio perform against holdouts, recalibration alerts. Same portfolio object, different face.

**Why this flow:** matches how an actuary thinks (liability + allocation, not single bets); spends her scarce attention on weights/trade-offs not data entry; and makes the optimiser *trustworthy* via interrogation at every altitude. It also opens far stronger in a demo than a blank goal box.

---

## 5. How this maps onto the existing code

**Reuse (don't rebuild):**
- `server/engine/*` — the whole actuarial chain is the pricing core: `orchestrator`, `rewardResponse`, `doseResponse`, `claimsBridge`, `mortalityMargin`, `lifeInsuranceValue`, `cohortRewardAllocator`, `montecarlo`, `uncertainty`, `assumptionSets`, `discounting`, `registry`, `signalCompatibility`.
- `src/simulator-agentic/` — `RewardOptimization`, `RewardDriver` ("suggest optimal reward"), `RewardExplorer`, methodology/evidence/sensitivity components. This becomes the **per-line pricer + drill-down**.
- `shared/schema.ts` / `shared/tables.ts` — `ResolvedPlan`, `RewardStrategyConfig`, `RewardOptimization`, `CohortRewardAllocation(Result)`, `LifeInsuranceValueResult`, `MonteCarloResult`, etc. Extend these for the portfolio object rather than inventing parallel types.
- The new cohort-trajectory + holdout work (`src/data/cohortTrajectories.ts`, `src/components/charts/CohortTrajectoryChart.tsx`, `DeliveryLoopPreview.tsx`) — the Monitor-mode and proof/measurement surfaces.

**Build:**
1. **Portfolio object + solver** — a layer above `cohortRewardAllocator` that allocates one budget across cohorts × pools under the portfolio ROI floor, with the cross-play attribution layer (§3.2) and ring-fence/attention constraints (§3.3/§3.4). Output: per-line reward + projected verified value + ROI + confidence, plus an efficient frontier.
2. **Plan UI** — the propose→steer→drill→commit surface (§4). Objective-weight panel is the hero control.
3. **Rewire `CampaignCreate.tsx`** — replace the manual reward step with the engine-priced point-on-curve; "create" becomes "commit this line of the allocation." Retire/forward `ActuarialROICalculator`'s standalone number to the shared engine so there is **one source of truth for the reward.**
4. **Cross-play attribution + sunset guardrails** (§3.2).
5. **Attention constraint** across lines (§3.4).

**Clean up (blocking confusion):** there are **three** simulator code areas — `src/simulator-agentic/` (active, routed), `src/simulator/` (**dead** — the "campaign-centric 7-chapter" rebuild, not routed anywhere; salvage its campaign-centric chapters into the Plan UI **or delete it**), and `server/engine/` (the model layer). Decide and remove the dead tree; it will mislead anyone reading the repo. Also: **no ESLint config exists** — add a flat `eslint.config.js` so `npm run lint` works.

---

## 6. Ecosystem keystone (consumer ↔ enterprise)

Pricing the reward is the hinge between the two apps. The committed allocation emits **reward configs** that flow to the consumer app's delivery (Liv conversation + Offer card) → the consumer emits **verified proofs** against the campaign rule → proofs feed both the **measurement** (holdout trajectory) and the **recalibration** (§3.5). Define the **shared campaign/cohort/reward/proof contract** (cohort rule, reward strategy, verification rule, proof type) as the interface the consumer app consumes. The consumer repo (`longevity-guide`) already has `campaigns` / `insurerCampaigns` / proofs tables, so the models can be reconciled rather than invented. Keep this contract in `shared/` as the single source of truth. *(Consumer-side wiring is a later, separate effort — out of scope here; just don't diverge the schema.)*

---

## 7. Open decisions to make during build (flag, propose a default, don't silently pick)

1. **Exact objective-weight set** — the minimal set of business-line weights the operator dials (claims, mortality, retention, acquisition, growth, fidelity?). Fewer is better; propose a starting set.
2. **Attention-cap mechanics** (§3.4) — per-member nudge cap, decay window, cross-line priority arbitration.
3. **One budget vs ring-fenced** is config, but ship a **sensible default** (recommend: single joint budget, ring-fences off) and the permission model for *who sets the weights*.
4. **Sunset window** for subsidised enabling plays (§3.2) — how long before an unproven spillover pulls the subsidy.
5. **Frontier axes** — which 2–3 objectives the efficient-frontier visual trades off by default.

---

## 8. Definition of done

An actuary opens the tool to a **proposed, ROI-positive allocation of her budget across the book**; bends objective weights and watches the allocation and frontier re-solve live; drills into any line to see the **engine-derived reward**, its evidence/holdout/verification grade, and overrides it with the portfolio re-optimising around her; adds a what-if play in natural language; and commits — producing live campaigns whose rewards were **solved, not typed**, whose enabling plays are **portfolio-justified with sunset guardrails**, and whose results flow back to **re-price the next allocation.** One reward number, one source of truth, across builder, simulator, and cockpit.
