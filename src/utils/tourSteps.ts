import type { Step } from 'react-joyride';

export const tourSteps: Step[] = [
  {
    target: '[data-tour="overview-hero"]',
    content: 'Welcome to HealthID. This page explains the core protocol — how we replace raw data custody with zero-knowledge verification.',
    title: 'Protocol Overview',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="explorer-nav"]',
    content: 'The Network Explorer shows the Open Pool — all anonymized health identities available for targeting. No personal data is ever exposed.',
    title: 'Network Explorer',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '[data-tour="explorer-metrics"]',
    content: 'Key pool metrics at a glance: total reachable identities, average health score, verification rates, and connected data sources.',
    title: 'Pool Metrics',
    placement: 'bottom',
  },
  {
    target: '[data-tour="explorer-filters"]',
    content: 'Segment the pool by health score, reputation tier, connected wearable sources, demographics, and more. Use presets for common cohorts.',
    title: 'Cohort Filtering',
    placement: 'right',
  },
  {
    target: '[data-tour="campaigns-nav"]',
    content: 'Create Snapshot (one-time proof) or Stream (continuous verification) challenges. Each campaign targets a specific health metric.',
    title: 'Campaigns',
    placement: 'right',
  },
  {
    target: '[data-tour="treasury-nav"]',
    content: 'Your budget grows through T-Bill yield while waiting for user proofs. The Value Multiplier shows how $1.00 of budget becomes $1.50+ of user value.',
    title: 'Treasury Operations',
    placement: 'right',
  },
  {
    target: '[data-tour="compliance-nav"]',
    content: 'Full audit trail proving zero PII exposure. Every verification is a cryptographic receipt — the dashboard never touches raw health data.',
    title: 'Compliance & Audit',
    placement: 'right',
  },
  {
    target: '[data-tour="zk-badge"]',
    content: 'Zero-Knowledge Mode is always active. All verifications use ZK proofs — no raw medical data is ever transmitted, stored, or displayed.',
    title: 'Zero-Knowledge Architecture',
    placement: 'right',
  },
];
