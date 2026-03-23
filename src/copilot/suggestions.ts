import type { PartnerIndustry } from '@/types';

export interface Suggestion {
  label: string;
  prompt: string;
}

const shared: Suggestion[] = [
  { label: 'Campaign overview', prompt: 'Give me an overview of my campaigns' },
  { label: 'Verification stats', prompt: 'How are my verifications performing?' },
  { label: 'Treasury balance', prompt: "What's my treasury balance and yield?" },
  { label: 'Compliance status', prompt: 'Show me my compliance status' },
];

const industrySpecific: Record<PartnerIndustry, Suggestion[]> = {
  insurance: [
    { label: 'Underwriting proofs', prompt: 'How are zero-knowledge proofs reducing underwriting costs?' },
    { label: 'PHI exposure', prompt: 'What is my PII/PHI exposure risk?' },
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
  '/overview': [
    { label: 'Platform summary', prompt: 'Give me a high-level summary of the platform' },
    { label: 'Key metrics', prompt: 'What are the key metrics across the platform?' },
  ],
  '/explorer': [
    { label: 'Identity breakdown', prompt: 'How are identities distributed across trust tiers?' },
    { label: 'Source penetration', prompt: 'Which data sources have the highest penetration?' },
  ],
  '/campaigns': [
    { label: 'Active campaigns', prompt: 'How are my active campaigns performing?' },
    { label: 'Campaign ROI', prompt: 'Which campaign has the best verification rate?' },
  ],
  '/treasury': [
    { label: 'Yield update', prompt: 'How much yield has been generated?' },
    { label: 'Value multiplier', prompt: 'Explain the value multiplier mechanism' },
  ],
  '/compliance': [
    { label: 'Audit summary', prompt: 'Show me my compliance audit summary' },
    { label: 'Proof failures', prompt: 'Are there any recent proof failures?' },
  ],
};

export function getPageSuggestions(route: string, industry: PartnerIndustry): Suggestion[] {
  // Match page route (strip hash, params)
  const basePath = '/' + (route.split('/')[1] || 'overview');
  const pageSpecific = pageSuggestions[basePath] || [];
  return [...pageSpecific, ...industrySpecific[industry], ...shared].slice(0, 6);
}

/** @deprecated Use getPageSuggestions instead */
export function getSuggestions(industry: PartnerIndustry): Suggestion[] {
  return [...industrySpecific[industry], ...shared];
}
