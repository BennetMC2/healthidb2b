import type { WalkthroughStep } from './types';

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'campaign-engine-entry',
    route: '/campaigns',
    title: 'The Campaign Engine',
    narration:
      'This is the heart of the product. A life insurer configures a measurable health programme, targets a consented cohort, and models the business case before launch.',
    targetSelector: null,
    actionType: 'auto',
  },
  {
    id: 'create-programme',
    route: '/campaigns/new',
    title: 'Design the Programme',
    narration:
      'The workflow starts with a campaign, not an abstract protocol. Outcome, signal, cohort, incentives, and modeled commercial impact are configured in one place.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'explore-pool',
    route: '/explorer',
    title: 'Shape the Reachable Cohort',
    narration:
      'The member pool is where campaign targeting becomes commercially real. Teams filter for trust, markets, signal quality, and cohort fit before launching.',
    targetSelector: '[data-tour="explorer-metrics"]',
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'filter-cohort',
    route: '/explorer',
    title: 'Target with Precision',
    narration:
      'Segmentation happens at the cohort level, not through raw data review. Use the filters to simulate a high-signal life insurance audience.',
    targetSelector: '[data-tour="explorer-filters"]',
    actionType: 'click-target',
    actionHint: 'Click "High-Value Cohort" preset',
  },
  {
    id: 'view-campaigns',
    route: '/campaigns',
    title: 'Move to a Live Programme',
    narration:
      'Campaigns operationalize the cohort and signal logic into an insurer-controlled programme. Open any active campaign to see the analytical workspace.',
    targetSelector: null,
    actionType: 'click-any-in',
    actionHint: 'Click any campaign card',
    delayMs: 300,
  },
  {
    id: 'campaign-detail',
    route: null,
    title: 'Review the Workspace',
    narration:
      'This is the buyer-grade workspace: KPI strip, business framing, momentum, activation funnel, and receipt timeline in one view.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'proof-animation',
    route: null,
    title: 'Open a Receipt',
    narration:
      'Receipt-level evidence is the technical credibility layer. Open any row to show how a campaign translates into a verifiable insurer-facing outcome.',
    targetSelector: '[data-walkthrough="verification-feed"]',
    actionType: 'click-any-in',
    actionHint: 'Click a verification row',
    autoScrollTo: '[data-walkthrough="verification-feed"]',
  },
  {
    id: 'compliance-audit',
    route: '/compliance',
    title: 'Show Buyer Diligence',
    narration:
      'The verification trail supports diligence conversations with buyers, security stakeholders, and pilot sponsors. It is evidence, not security theater.',
    targetSelector: null,
    actionType: 'auto',
    delayMs: 400,
  },
  {
    id: 'summary',
    route: '/campaigns',
    title: 'Ready for a Pilot Conversation?',
    narration:
      'You have now seen the core product loop: design the programme, target the cohort, review verified outcomes, and support the pilot conversation with analytical evidence.',
    targetSelector: null,
    actionType: 'auto',
  },
];
