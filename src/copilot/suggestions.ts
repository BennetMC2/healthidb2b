import type { PartnerIndustry } from '@/types';

export interface Suggestion {
  label: string;
  prompt: string;
}

const shared: Suggestion[] = [
  { label: 'Next best campaign', prompt: 'Recommend the next best claims-reduction campaign to launch for this insurer and explain why' },
  { label: 'Outcome posture', prompt: 'How are my claims-oriented campaigns performing against business expectations?' },
  { label: 'Launch risk scan', prompt: 'Flag the main launch risks in my claims-reduction portfolio' },
  { label: 'Verification trail', prompt: 'Summarize the verification trail in executive language for an insurer' },
];

const industrySpecific: Record<PartnerIndustry, Suggestion[]> = {
  insurance: [
    { label: 'Claims posture', prompt: 'How does this campaign support claims reduction and where is the model weakest?' },
    { label: 'Underwriting angle', prompt: 'How does the same engine support underwriting and pre-policy verification without changing the platform story?' },
    { label: 'Life insurer angle', prompt: 'Brief this platform for a Hong Kong or Japan life insurer executive with claims reduction as the lead story' },
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
    { label: 'Active campaigns', prompt: 'Which live claims-reduction campaigns deserve more budget or attention right now?' },
    { label: 'Campaign ROI', prompt: 'Which campaign has the strongest modeled claims-impact case and why?' },
  ],
  '/compliance': [
    { label: 'Trail summary', prompt: 'Show me the latest verification trail summary' },
    { label: 'Proof failures', prompt: 'Are there any recent proof failures?' },
  ],
};

export function getPageSuggestions(route: string, industry: PartnerIndustry): Suggestion[] {
  // Match page route (strip hash, params)
  const basePath = '/' + (route.split('/')[1] || 'campaigns');
  const pageSpecific = pageSuggestions[basePath] || [];
  return [...pageSpecific, ...industrySpecific[industry], ...shared].slice(0, 6);
}

/** @deprecated Use getPageSuggestions instead */
export function getSuggestions(industry: PartnerIndustry): Suggestion[] {
  return [...industrySpecific[industry], ...shared];
}
