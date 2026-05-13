import type { WalkthroughStep } from './types';

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'actuary-nav',
    route: '/app/actuary',
    title: 'AI Actuary',
    narration:
      'This cockpit turns verified wearable signals into campaign plays that can be priced, launched, and measured against expected book value.',
    targetSelector: '[data-tour="actuary-nav"]',
    actionType: 'auto',
    delayMs: 300,
  },
  {
    id: 'actuary-opportunities',
    route: '/app/actuary',
    title: 'Wearable signal campaigns',
    narration:
      'VO2 Max, HRV, sleep, and resting heart rate each become a campaign recommendation with Health Points pricing and projected commercial impact.',
    targetSelector: '[data-walkthrough="actuary-opportunities"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'actuary-ask',
    route: '/app/actuary',
    title: 'Actuary Copilot',
    narration:
      'Actuary Copilot explains which campaign to launch, how to price rewards, and where modifiable risk is building in the partner book.',
    targetSelector: '[data-walkthrough="actuary-ask"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'explorer-nav',
    route: '/app/explorer',
    title: 'Member Pool',
    narration:
      'The Member Pool shows who is reachable with enough trust and signal quality to be commercially relevant, without exposing raw health records.',
    targetSelector: '[data-tour="explorer-nav"]',
    actionType: 'auto',
    delayMs: 300,
  },
  {
    id: 'explorer-metrics',
    route: '/app/explorer',
    title: 'Cohort readiness',
    narration:
      'These top-line metrics frame reach, verification readiness, and signal density before any programme is designed.',
    targetSelector: '[data-tour="explorer-metrics"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'explorer-presets',
    route: '/app/explorer',
    title: 'Preset cohorts',
    narration:
      'These controls shape the reachable audience quickly. Teams can move from broad pool to high-trust cohort without turning the product into a generic data explorer.',
    targetSelector: '[data-walkthrough="explorer-presets"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'campaigns-nav',
    route: '/app/campaigns',
    title: 'Campaign Studio',
    narration:
      'This is the execution surface. Partners turn wearable signals, anonymous open-pool segments, and retention cohorts into Health Points campaigns.',
    targetSelector: '[data-tour="campaigns-nav"]',
    actionType: 'auto',
    delayMs: 300,
  },
  {
    id: 'campaigns-hero',
    route: '/app/campaigns',
    title: 'Campaign families',
    narration:
      'Campaign Studio separates signal improvement, acquisition, retention, and engagement so each campaign is measured against the right commercial outcome.',
    targetSelector: '[data-walkthrough="campaigns-hero"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'campaigns-portfolio',
    route: '/app/campaigns',
    title: 'Live campaign portfolio',
    narration:
      'This portfolio view shows what is already in market, what is still in draft, and where a partner should focus operational attention.',
    targetSelector: '[data-walkthrough="campaigns-portfolio"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'compliance-nav',
    route: '/app/compliance',
    title: 'Verification Trail',
    narration:
      'This page supports diligence and trust. It records verification activity, proof events, and receipt delivery in a format buyers can actually understand.',
    targetSelector: '[data-tour="compliance-nav"]',
    actionType: 'auto',
    delayMs: 300,
  },
  {
    id: 'compliance-receipts',
    route: '/app/compliance',
    title: 'Receipt-only operating model',
    narration:
      'This section explains the core trust boundary: partners receive verification receipts and outcome evidence, not raw member health data.',
    targetSelector: '[data-walkthrough="compliance-receipts"]',
    actionType: 'auto',
    delayMs: 350,
  },
  {
    id: 'settings-nav',
    route: '/app/settings',
    title: 'Settings',
    narration:
      'Settings is where the partner controls configuration, retention, and integration posture.',
    targetSelector: '[data-tour="settings-nav"]',
    actionType: 'auto',
    delayMs: 300,
  },
  {
    id: 'settings-profile',
    route: '/app/settings',
    title: 'Partner configuration',
    narration:
      'This is the administrative layer: partner profile, API access, webhook settings, and data retention controls in one place.',
    targetSelector: '[data-walkthrough="settings-profile"]',
    actionType: 'auto',
    delayMs: 350,
  },
];
