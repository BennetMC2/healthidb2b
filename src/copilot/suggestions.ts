import type { PartnerIndustry } from '@/types';

export interface Suggestion {
  label: string;
  prompt: string;
}

const shared: Suggestion[] = [
  { label: 'Next best campaign', prompt: 'Recommend the next best Health Points campaign to launch and explain why' },
  { label: 'Outcome posture', prompt: 'How are my campaigns performing against their commercial objectives?' },
  { label: 'Launch risk scan', prompt: 'Flag the main launch risks across signal improvement, acquisition, and retention campaigns' },
  { label: 'Verification trail', prompt: 'Summarize the verification trail in executive language for a partner' },
];

const industrySpecific: Record<PartnerIndustry, Suggestion[]> = {
  insurance: [
    { label: 'Signal campaign', prompt: 'Which wearable signal campaign should absorb more Health Points budget?' },
    { label: 'Underwriting angle', prompt: 'How does the same engine support underwriting and pre-policy verification without changing the platform story?' },
    { label: 'Partner brief', prompt: 'Brief this platform for a partner executive with acquisition, retention, and signal improvement as the lead story' },
  ],
  pharma: [
    { label: 'Cohort recruitment', prompt: 'How is cohort recruitment progressing across my campaigns?' },
    { label: 'Trial enrollment', prompt: 'What are my clinical trial enrollment rates?' },
  ],
  employer: [
    { label: 'Wellness engagement', prompt: 'How is employee wellness engagement trending?' },
    { label: 'Program ROI', prompt: "What's the ROI on my wellness programs?" },
  ],
  research: [
    { label: 'Data access', prompt: 'How fast can I access verified health data?' },
    { label: 'Proof validity', prompt: 'What is the statistical validity of my proofs?' },
  ],
  healthcare: [
    { label: 'Patient outcomes', prompt: 'How are patient outcome verifications performing?' },
    { label: 'Breach risk', prompt: 'What is my data breach risk profile?' },
  ],
};

const pageSuggestions: Record<string, Suggestion[]> = {
  '/app/cohorts': [
    { label: 'Identity breakdown', prompt: 'How are identities distributed across trust tiers?' },
    { label: 'Source penetration', prompt: 'Which data sources have the highest penetration?' },
  ],
  '/app/campaigns': [
    { label: 'Active campaigns', prompt: 'Which live campaigns deserve more budget or attention right now?' },
    { label: 'Campaign ROI', prompt: 'Which campaign has the strongest modeled commercial case and why?' },
  ],
  '/app/compliance': [
    { label: 'Trail summary', prompt: 'Show me the latest verification trail summary' },
    { label: 'Proof failures', prompt: 'Are there any recent proof failures?' },
  ],
};

export function getPageSuggestions(route: string, industry: PartnerIndustry): Suggestion[] {
  // Match page route (strip hash, params)
  const parts = route.split('/');
  const basePath = parts[1] === 'app' ? `/app/${parts[2] || 'campaigns'}` : `/${parts[1] || 'campaigns'}`;
  const pageSpecific = pageSuggestions[basePath] || [];
  return [...pageSpecific, ...industrySpecific[industry], ...shared].slice(0, 6);
}

/** @deprecated Use getPageSuggestions instead */
export function getSuggestions(industry: PartnerIndustry): Suggestion[] {
  return [...industrySpecific[industry], ...shared];
}
