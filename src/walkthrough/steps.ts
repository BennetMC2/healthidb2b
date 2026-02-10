import type { WalkthroughStep } from './types';

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'overview-story',
    route: '/overview',
    title: 'The Problem We Solve',
    narration:
      'Health insurers hold raw medical data, creating massive regulatory liability. HealthID replaces data custody with zero-knowledge verification — partners receive cryptographic proof receipts, never raw data.',
    targetSelector: '[data-tour="overview-hero"]',
    actionType: 'auto',
  },
  {
    id: 'explore-pool',
    route: '/explorer',
    title: 'The Open Pool',
    narration:
      'This is the Open Pool — thousands of anonymized health identities reachable through the protocol. Each identity is a composite of connected wearable and clinical sources. No personal data is ever exposed.',
    targetSelector: '[data-tour="explorer-metrics"]',
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'filter-cohort',
    route: '/explorer',
    title: 'Segment a Cohort',
    narration:
      'Use the filter panel to narrow the pool. Click the "High-Value Cohort" preset to select identities with health scores 75+ and top-tier reputation — the ideal target for a verification campaign.',
    targetSelector: '[data-tour="explorer-filters"]',
    actionType: 'click-target',
    actionHint: 'Click "High-Value Cohort" preset',
  },
  {
    id: 'view-campaigns',
    route: '/campaigns',
    title: 'Campaigns Dashboard',
    narration:
      'Campaigns are how you engage the pool. Each campaign defines a health metric challenge, targets a cohort, and collects zero-knowledge proof receipts. Click into any active campaign to explore.',
    targetSelector: null,
    actionType: 'click-any-in',
    actionHint: 'Click any campaign card',
    delayMs: 300,
  },
  {
    id: 'campaign-detail',
    route: null,
    title: 'Campaign Funnel',
    narration:
      'The funnel shows conversion from eligible pool through to verified and rewarded identities. Each "verified" entry is a ZK proof — the raw health data never left the user\'s device.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'proof-animation',
    route: null,
    title: 'Watch a Proof in Action',
    narration:
      'Click any row in the Verification Feed below to watch the zero-knowledge proof process — from on-device data access through circuit compilation to verified receipt.',
    targetSelector: '[data-walkthrough="verification-feed"]',
    actionType: 'click-any-in',
    actionHint: 'Click a verification row',
    autoScrollTo: '[data-walkthrough="verification-feed"]',
  },
  {
    id: 'treasury-economics',
    route: '/treasury',
    title: 'Treasury Economics',
    narration:
      'Your budget works while it waits. Idle funds earn yield from T-Bills at 4–5% APY, and enterprise buying power turns every $1.00 of budget into $1.50+ of user value.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'roi-calculator',
    route: '/treasury',
    title: 'Model Your ROI',
    narration:
      'Drag the budget slider to model returns. The projection includes T-Bill yield, enterprise buying power, and estimated cost per verification. Try adjusting to see how value scales.',
    targetSelector: '[data-walkthrough="roi-calculator"]',
    actionType: 'interact',
    actionHint: 'Try adjusting the budget slider',
    autoScrollTo: '[data-walkthrough="roi-calculator"]',
  },
  {
    id: 'compliance-audit',
    route: '/compliance',
    title: 'Compliance & Audit Trail',
    narration:
      'Every operation is logged as a cryptographic receipt. Zero PII events — the protocol never touches raw health data. This audit trail is your proof of compliance for regulators.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'summary',
    route: '/overview',
    title: 'Ready to Build',
    narration:
      'You\'ve seen the full protocol: pool exploration, cohort filtering, campaign creation, zero-knowledge proof verification, treasury yield, and compliance audit. HealthID replaces data liability with cryptographic certainty.',
    targetSelector: null,
    actionType: 'auto',
  },
];
