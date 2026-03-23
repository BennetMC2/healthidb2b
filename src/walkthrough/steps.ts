import type { WalkthroughStep } from './types';

export const walkthroughSteps: WalkthroughStep[] = [
  // ── HOOK: Start with the cost ──────────────────────────────────────
  {
    id: 'overview-story',
    route: '/overview',
    title: 'The Cost of Custodial Data',
    narration:
      'Every health record your organization stores is an open liability — regulatory fines, breach costs, compliance overhead. HealthID eliminates the liability entirely. Watch how.',
    targetSelector: '[data-tour="overview-hero"]',
    actionType: 'auto',
  },

  // ── PAIN: Let the red flow sink in ─────────────────────────────────
  {
    id: 'overview-pain',
    route: '/overview',
    title: 'Choose Your Perspective',
    narration:
      'HealthID solves different problems for different stakeholders. Whether you\'re focused on compliance risk, actuarial savings, or user engagement — click a persona to see the value proposition tailored to your role.',
    targetSelector: '[data-tour="overview-personas"]',
    actionType: 'auto',
    delayMs: 500,
  },

  // ── SOLUTION: The pool ─────────────────────────────────────────────
  {
    id: 'explore-pool',
    route: '/explorer',
    title: '5,000 Identities — Zero Liability',
    narration:
      'These are real, verifiable health identities — reachable right now, without ingesting a single byte of their data. In a traditional system, every one of these would be a liability row in your database. Here, they\'re just proof endpoints.',
    targetSelector: '[data-tour="explorer-metrics"]',
    actionType: 'auto',
    delayMs: 400,
  },

  // ── PROVE IT: Targeting works without data access ──────────────────
  {
    id: 'filter-cohort',
    route: '/explorer',
    title: 'Target a Cohort in Seconds',
    narration:
      'You can segment by health score, reputation, data sources, and demographics — all without accessing personal data. Click "High-Value Cohort" to see identities with health scores 75+ and top-tier reputation.',
    targetSelector: '[data-tour="explorer-filters"]',
    actionType: 'click-target',
    actionHint: 'Click "High-Value Cohort" preset',
  },

  // ── ACTIVATE: Campaigns ────────────────────────────────────────────
  {
    id: 'view-campaigns',
    route: '/campaigns',
    title: 'Turn Cohorts into Campaigns',
    narration:
      'Each campaign defines a health metric challenge and collects zero-knowledge proof receipts — not data files. Click into any active campaign to see the conversion funnel.',
    targetSelector: null,
    actionType: 'click-any-in',
    actionHint: 'Click any campaign card',
    delayMs: 300,
  },

  // ── FUNNEL: Show conversion ────────────────────────────────────────
  {
    id: 'campaign-detail',
    route: null,
    title: 'From Pool to Proof',
    narration:
      'The funnel shows conversion from eligible pool through to verified proofs. Every "verified" entry is a cryptographic receipt — the underlying health data never left the user\'s device. No new liability was created.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },

  // ── MAGIC MOMENT: The proof ────────────────────────────────────────
  {
    id: 'proof-animation',
    route: null,
    title: 'Watch the Impossible',
    narration:
      'In a traditional system, this verification would require ingesting the patient\'s data, storing it, and running a compliance check — creating a new liability record. Click any verification row and watch what happens instead.',
    targetSelector: '[data-walkthrough="verification-feed"]',
    actionType: 'click-any-in',
    actionHint: 'Click a verification row',
    autoScrollTo: '[data-walkthrough="verification-feed"]',
  },

  // ── ECONOMICS: Treasury ────────────────────────────────────────────
  {
    id: 'treasury-economics',
    route: '/treasury',
    title: 'Your Budget Works While You Wait',
    narration:
      'Idle funds earn yield from T-Bills at 4–5% APY. Combined with enterprise buying power, every $1.00 of budget creates $1.50+ of user value. Compare that to traditional claims processing where every dollar is a sunk cost.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },

  // ── ROI: Make it tangible ──────────────────────────────────────────
  {
    id: 'roi-calculator',
    route: '/treasury',
    title: 'Model Your ROI',
    narration:
      'Drag the budget slider to see the projection. At $100K over 12 months, you\'ll generate yield, amplify buying power, and bring cost-per-verification down to a fraction of traditional processing. Try it.',
    targetSelector: '[data-walkthrough="roi-calculator"]',
    actionType: 'interact',
    actionHint: 'Try adjusting the budget slider',
    autoScrollTo: '[data-walkthrough="roi-calculator"]',
  },

  // ── TRUST: Compliance ──────────────────────────────────────────────
  {
    id: 'compliance-audit',
    route: '/compliance',
    title: 'Your Audit Trail — Zero PII',
    narration:
      'Every operation is logged as a cryptographic receipt. Zero PII access events — the protocol never touches raw health data. This is what you show your regulator: a complete audit trail proving you never handled the data at all.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },

  // ── CLOSE: CTA ─────────────────────────────────────────────────────
  {
    id: 'summary',
    route: '/overview',
    title: 'Ready to Run a Pilot?',
    narration:
      'You\'ve seen the full loop: pool exploration, cohort targeting, zero-knowledge verification, treasury yield, and compliance proof. Every step replaced data liability with cryptographic certainty. Let\'s talk about a pilot deployment.',
    targetSelector: null,
    actionType: 'auto',
  },
];
