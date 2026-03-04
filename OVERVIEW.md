# HealthID B2B Platform

A sales demo platform for a privacy-preserving health data verification protocol. Enterprise partners (insurers, pharma companies, employers) can verify user health outcomes using **zero-knowledge proofs** without ever touching raw health data. Data stays on-device; the platform delivers cryptographic proof receipts instead.

Built as a self-contained interactive sales tool — all data is deterministically seeded, no backend required.

## Stack

| Technology | Role |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 6 | Build / dev server |
| Tailwind CSS 3 | Styling (custom dark design system) |
| Zustand | State management |
| Recharts + D3 | Data visualization |
| @tanstack/react-table | Data tables |
| react-router-dom 6 | Routing |
| react-joyride | Tooltip product tour |
| lucide-react | Icons |

## Project Structure

```
src/
  App.tsx                     # Root: router, tours, demo walkthrough
  pages/                      # 8 route pages
  components/
    layout/                   # Header, Sidebar, Layout, NotificationDropdown
    ui/                       # Shared UI primitives (Badge, DataTable, MetricCard, etc.)
    campaigns/                # ProofAnimation, LaunchSuccess
    treasury/                 # SankeyDiagram, WaterfallChart, GrowthChart, ROICalculator
    walkthrough/              # DemoWalkthrough, NarrationBar, SpotlightOverlay
  data/                       # All seeded mock data (identities, campaigns, treasury, etc.)
  stores/                     # Zustand stores (demo, partner, toast)
  hooks/                      # useSimulatedLoading
  types/                      # TypeScript type definitions
  utils/                      # Formatters, constants, export helpers
  walkthrough/                # Demo script steps and types
```

## Pages

### Overview (`/overview`)
The sales landing page. Shows the cost of custodial data models, an animated side-by-side comparison (traditional vs. HealthID verification), and industry-specific messaging that adapts to the selected partner persona.

### Network Explorer (`/explorer`)
Browse 5,000 seeded anonymized health identities. Filter by health score, reputation tier (Bronze through Diamond), connected data sources, age, and gender. Includes distribution charts and filter presets like "High-Value Cohort" and "Lab-Confirmed."

### Campaigns (`/campaigns`)
Lists 10 campaigns across three partner organizations with status filters, aggregate metrics, and reusable campaign templates (Physical Screening Proof, Sleep Quality Monitor, Activity Streak Challenge).

### Campaign Create (`/campaigns/new`)
Five-step wizard: choose type (Snapshot or Stream), define a health metric challenge, set targeting criteria, configure rewards/budget, then review and launch.

### Campaign Detail (`/campaigns/:id`)
Drill into a single campaign. Shows enrollment stats, a multi-stage verification funnel with conversion rates, and a live feed of ZK proof receipts. Clicking a receipt triggers an animated proof visualization — the centerpiece "magic moment" of the demo.

### Treasury (`/treasury`)
Budget management and yield mechanics. Features a D3 Sankey diagram showing value flow, a 180-day growth chart, a waterfall breakdown, an interactive ROI calculator, and a transaction ledger.

### Compliance (`/audit`)
Audit trail showing zero PII access events — the core selling point. Displays audit records, ZK proof counts, and monthly data processing summaries. Supports CSV/JSON export.

### Settings (`/settings`)
Per-partner configuration: profile, API keys, webhooks, notification preferences, data retention policies, and allowed regions.

## Demo Partners

Three personas selectable from the header dropdown. Switching partners tailors the Overview messaging to that industry.

| Partner | Tier | Industry |
|---|---|---|
| Meridian Health Insurance | Enterprise | Insurance |
| NovaGenix Pharmaceuticals | Professional | Pharma |
| BrightWell Corporate Wellness | Starter | Employer |

## Data Layer

All data is generated deterministically using a seeded PRNG — no randomness between builds, no API calls.

- **5,000 health identities** with health scores (normal distribution, mean 65), reputation tiers (power-law), connected wearable/lab sources, and demographics
- **10 campaigns** (draft, active, completed, paused) with realistic funnel drop-off rates
- **100 treasury transactions** across a 6-month history with daily snapshots
- **Compliance records** where `piiAccessed` is typed as the literal `false` — architecturally enforced

## Walkthrough System

Two separate tour systems:

1. **Sales Demo** — An 11-step scripted walkthrough driven by `DemoWalkthrough`. Uses a spotlight overlay, action hints, and a fixed narration bar at the bottom. Some steps are interactive (user must click a specific element to advance). Keyboard navigation supported (arrow keys, Escape).

2. **Tooltip Tour** — A secondary Joyride-based tooltip tour triggered from the header. Disabled while the sales demo is active.

## Design System

Dark, terminal-inspired aesthetic built on a custom Tailwind palette:

- **Backgrounds**: near-black base (`#0a0b0d`), surface (`#111318`), elevated (`#161920`)
- **Accent**: blue (`#4ca5ff`) for interactive/ZK elements
- **Typography**: Inter (sans), JetBrains Mono (mono), scaled-down font sizes
- **Reputation tier colors**: diamond (purple), platinum (blue), gold, silver, bronze
- **Custom animations**: fade-in, slide-in, flow-pulse, hash-reveal, proof-step, shimmer

## Running Locally

```bash
npm install
npm run dev
```

## Deployment

Configured for Vercel (`vercel.json` present). Static output, no server required.
