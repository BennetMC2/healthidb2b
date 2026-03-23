import type { PartnerIndustry } from '@/types';

export interface IndustryContext {
  headline: string;
  subheadline: string;
  painPoint: string;
  costOfInaction: string;
  costSource: string;
  ctaLabel: string;
  featuredMetric: string;
  // Comparison callouts for Treasury
  costPerVerification: { traditional: string; healthid: string };
  timeToVerify: { traditional: string; healthid: string };
  piiExposure: { traditional: string; healthid: string };
}

export const industryContexts: Record<PartnerIndustry, IndustryContext> = {
  insurance: {
    headline: 'Underwrite Without Ingesting PHI',
    subheadline: 'Verify policyholder health outcomes cryptographically — no raw data custody, no breach surface, no HIPAA liability.',
    painPoint: 'Every health record you store is a liability. Breach costs, compliance overhead, and regulatory fines scale with data volume.',
    costOfInaction: 'The average healthcare data breach costs $9.77M',
    costSource: 'IBM Cost of a Data Breach Report, 2024',
    ctaLabel: 'See How Insurers Use HealthID',
    featuredMetric: 'blood_glucose',
    costPerVerification: { traditional: '$18–25', healthid: '$4.80' },
    timeToVerify: { traditional: '2–4 weeks', healthid: '340ms' },
    piiExposure: { traditional: '~2,400/mo', healthid: '0' },
  },
  pharma: {
    headline: 'Recruit Verified Cohorts in Hours, Not Months',
    subheadline: 'Access pre-verified health identities through zero-knowledge proofs — no IRB data custody debates, no patient data handling.',
    painPoint: 'Clinical trial recruitment costs $15K–70K per patient and takes months. Data transfer agreements add weeks of legal overhead.',
    costOfInaction: '80% of clinical trials fail to meet enrollment timelines',
    costSource: 'Tufts CSDD, 2022',
    ctaLabel: 'See How Pharma Uses HealthID',
    featuredMetric: 'hrv',
    costPerVerification: { traditional: '$22–40', healthid: '$5.20' },
    timeToVerify: { traditional: '6–12 weeks', healthid: '340ms' },
    piiExposure: { traditional: '~5,800/mo', healthid: '0' },
  },
  employer: {
    headline: 'Run Wellness Programs Without Data Liability',
    subheadline: 'Verify employee health goals with cryptographic proofs — no sensitive health data in your HR systems.',
    painPoint: 'Corporate wellness programs collect sensitive health data that sits in HR systems. Low engagement meets high compliance risk.',
    costOfInaction: 'Employers spend $700+/employee annually on wellness with <30% engagement',
    costSource: 'Mercer National Survey of Employer-Sponsored Health Plans, 2023',
    ctaLabel: 'See How Employers Use HealthID',
    featuredMetric: 'vo2_max',
    costPerVerification: { traditional: '$12–18', healthid: '$3.40' },
    timeToVerify: { traditional: '1–2 weeks', healthid: '340ms' },
    piiExposure: { traditional: '~1,200/mo', healthid: '0' },
  },
  research: {
    headline: 'Access Health Data Without Touching Health Data',
    subheadline: 'Query verified health outcomes across a privacy-preserving network — zero data handling, full statistical validity.',
    painPoint: 'Research data access requires months of IRB approval, data use agreements, and de-identification pipelines.',
    costOfInaction: 'Data access delays cost research organizations $30K per day in lost productivity',
    costSource: 'JAMIA Research Access Study, 2023',
    ctaLabel: 'See How Researchers Use HealthID',
    featuredMetric: 'heart_rate_resting',
    costPerVerification: { traditional: '$15–30', healthid: '$4.50' },
    timeToVerify: { traditional: '3–6 months', healthid: '340ms' },
    piiExposure: { traditional: '~3,400/mo', healthid: '0' },
  },
  healthcare: {
    headline: 'Verify Patient Outcomes Without Storing Patient Data',
    subheadline: 'Transition from custodial health data to zero-knowledge verification — cryptographic certainty without regulatory risk.',
    painPoint: 'Healthcare organizations store more sensitive data per capita than any other industry. Every record is a breach target.',
    costOfInaction: 'Healthcare has led all industries in breach costs for 14 consecutive years',
    costSource: 'IBM Cost of a Data Breach Report, 2024',
    ctaLabel: 'See How Healthcare Uses HealthID',
    featuredMetric: 'sleep_quality',
    costPerVerification: { traditional: '$20–35', healthid: '$5.80' },
    timeToVerify: { traditional: '1–3 weeks', healthid: '340ms' },
    piiExposure: { traditional: '~4,100/mo', healthid: '0' },
  },
};
