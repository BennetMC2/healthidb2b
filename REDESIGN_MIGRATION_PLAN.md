# HealthID Cockpit — Redesign Migration Plan

Source of truth for the look: `healthid-redesign.html` (Cowork mock-up). The *why* and build order: `IMPLEMENTATION.md`. This plan ports that intent into the **real** codebase — adapting to our components, **not** pasting static markup.

**Key reality:** this is an *evolution, not a rebrand* (same dark cockpit, same `#e6824f` accent), and **most "components to build" already exist** — so this is largely a refactor-toward-one-consistent-pattern, phased and low-risk.

## Decisions locked (override the mock-up where noted)
- **Naming:** keep our names — **AI Actuary** (not "Signals"), **Campaign Studio** (not "Campaigns"), **Verification Trail** (not "Verification"). Apply the redesign's *grouping* with our *labels*.
- **Simulator:** adopt the clean 3-step on-ramp (Goal → Reward lever → Outcome), but **"Run full simulation" launches the existing live member-agent console + Monte Carlo as the step-3 payoff** — the impressive part stays, just better framed. Do NOT bury the agent console behind "Advanced".
- **Treasury:** keep it in the nav (under the "Run" group).
- **Numbers:** use the **real engine numbers** (`playEconomics`), never the mock-up's illustrative ones (mock shows VO₂ 4.6×; real is ~4.3×).

## Design principles (from the brief)
- One hero metric per object; everything else is progressive disclosure.
- One primary action per surface; secondary actions are quiet (ghost).
- Plain language first, expert term second (caption/tooltip the jargon).
- One shared page template: `PageHeader` (label + H2 + one-line purpose + right actions) → `KpiStrip` → content → optional collapsible right rail.
- Guidance lives in the flow (steppers, empty states, inline hints) — no "How to read this" panels.
- Cohorts is the reference layout; converge others toward it.

## Component reuse map (mock-up → existing code)
| Mock-up component | Status | Existing location |
|---|---|---|
| KpiStrip / KpiCard | reuse | `components/ui/MetricCard` |
| PageHeader | reuse | `SectionHeader` |
| SignalPlayCard | refactor | Actuary `OpportunityCard` |
| DataTable + filter pills | reuse | `components/ui/DataTable` |
| CohortCard | reuse | `NetworkExplorer` cards |
| AssumptionRow (inline diff) | refactor | `ModelStudio` (diff currently in side panel) |
| Stepper | reuse | `CampaignCreate` wizard |
| RewardLever | reuse | Simulator reward slider / `RewardExplorer` |
| Tag / StatusPill / Tooltip | reuse | `Badge`, `InfoTooltip` |
| RightRail (collapsible) | refactor | Actuary `aside` |
| Research feed · FDE card · "liability avoided" | net-new | stub with synthetic/real data |

## Token reconciliation
The live theme is already dark + amber. Action: confirm the mock-up's `:root` values map to our existing theme variables (Tailwind config / CSS vars); add any missing semantic tokens (good/warn/info already exist as accent variants). No re-theme.

## Phased build (confirm before each phase)
- **Phase 0 — Shell & shared template.** Sidebar groups: **Decide** (AI Actuary, Simulator) · **Run** (Campaign Studio, Cohorts, Treasury) · **Trust & Setup** (Model Studio, Verification Trail, Settings). Tidy 3-zone header. Lock the `PageHeader` + `KpiStrip` pattern as the one template. *Touches: `Layout`, `Sidebar`, `Header`, `MetricCard`, `SectionHeader`. Low risk, unlocks everything.*
- **Phase 1 — AI Actuary.** `OpportunityCard` → hero ROI + "Show pricing detail" disclosure (the 8 stats collapse) + single primary CTA (Create campaign); secondary actions quiet. Plain-language page headline.
- **Phase 2 — Simulator.** 3-step flow as the on-ramp; **step 3 runs the real agent console + Monte Carlo** (preserved). Delete the "How to read this" panel; fold guidance into steps. Advanced controls (sources, composite index, sample size) behind an expander — but the agent stream stays front-and-centre on run.
- **Phase 3 — Campaign Studio.** Family + status become visible filter pills above the `DataTable`; the cramped side panel becomes a row-expand drawer.
- **Phase 4 — Model Studio.** Move the draft→floor diff onto the assumption row; demote the citation to a quiet "source" link; Clinical/Actuarial/Program become a filter, not a tab layer. (Keep the sign-off + provenance flags we built.)
- **Phase 5 — Verification Trail · Settings · Cohorts.** Trim Verification's 6 KPIs to 4; add keyboard-reachable tooltips to crypto terms; light Cohorts/Settings polish to the shared template.

## Cross-cutting polish (during each phase)
Real focus states; keyboard nav for sidebar + stepper; `aria-expanded` on disclosures; tooltips reachable by keyboard; respect `prefers-reduced-motion`; tables get sticky header + empty/loading states.

## Risks / guardrails
- **Don't dilute the Simulator** — the agent console/Monte Carlo is the credibility moment. 3-step is the frame, not a replacement.
- **Preserve what we just built** — model switcher + badge + toast, `playEconomics` consistency, Model Studio sign-off/provenance, the Tier-1 nav/dead-control cleanup.
- **Phase behind current pages** — never destabilise the live demo; each phase is independently shippable.
- **Real numbers only** — wire to `playEconomics`, not the mock's figures.

## Net-new content to decide later
Research-feed rail, forward-deployed-engineer card, "liability avoided" KPI — stub with synthetic data for the demo, mark as placeholder.
