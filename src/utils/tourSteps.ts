import type { Step } from 'react-joyride';

export const tourSteps: Step[] = [
  {
    target: '[data-tour="campaigns-nav"]',
    content: 'This branch is organized around the campaign engine. Start here: it is the clearest expression of what the product sells.',
    title: 'Campaign Engine',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '[data-tour="explorer-nav"]',
    content: 'The member pool shows reachable cohorts the insurer can target without turning the app into a generic identity explorer.',
    title: 'Member Pool',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '[data-tour="explorer-metrics"]',
    content: 'These metrics frame reach, signal quality, and cohort readiness for campaign design.',
    title: 'Cohort Metrics',
    placement: 'bottom',
  },
  {
    target: '[data-tour="explorer-filters"]',
    content: 'Filter by market, trust, source quality, and eligibility criteria to shape a commercially credible insurer cohort.',
    title: 'Cohort Filtering',
    placement: 'right',
  },
  {
    target: '[data-tour="campaigns-nav"]',
    content: 'Campaigns are the operating center: one configuration surface powers claims reduction, underwriting, acquisition, and renewal narratives.',
    title: 'Programme Design',
    placement: 'right',
  },
  {
    target: '[data-tour="compliance-nav"]',
    content: 'The verification trail gives buyers and technical stakeholders a diligence-friendly receipt view without generic security theater.',
    title: 'Verification Trail',
    placement: 'right',
  },
  {
    target: '[data-tour="zk-badge"]',
    content: 'The badge communicates the operating mode succinctly: verified outcomes in, raw data exposure out.',
    title: 'Verified Outcomes Mode',
    placement: 'right',
  },
];
