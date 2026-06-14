import { partners } from './partners';

export interface PartnerPortfolio {
  partnerId: string;
  lives: number;
  dataSources: number;
  indexedPapers: number;
  verifiedReceipts: number;
  avgTrust: string;
  leadSignal: string;
  opportunityCount: number;
  morningBrief: string;
  switcherNote: string;
  fde: {
    name: string;
    role: string;
    channel: string;
    nextSync: string;
  };
  researchFeed: Array<{
    time: string;
    title: string;
    impact: string;
  }>;
}

export const partnerPortfolios: PartnerPortfolio[] = [
  {
    partnerId: partners[0].id,
    lives: 36000,
    dataSources: 108402,
    indexedPapers: 4217,
    verifiedReceipts: 8289,
    avgTrust: 'High',
    leadSignal: 'VO2 Max',
    opportunityCount: 4,
    morningBrief:
      'Overnight, the VO2 Max activation cohort grew by 47 lives and the modelled ROI estimate tightened. Sleep Regularity is drifting but remains a second-wave play until verification density improves.',
    switcherNote: 'Pacific has enough wearable density to price behaviour-change campaigns around VO2 Max, HRV, sleep, and resting heart rate.',
    fde: {
      name: 'Kenji Tanaka',
      role: 'Forward Deployed Engineer',
      channel: '#pacific-healthid',
      nextSync: 'Thu 09:30 HKT',
    },
    researchFeed: [
      { time: '09:18', title: 'Nature Medicine wearable activity update indexed', impact: 'Strengthens VO2 Max and Zone 2 pricing assumptions.' },
      { time: '08:44', title: 'Lancet sleep-risk review reweighted', impact: 'Raises sleep confidence but keeps causal score below cardio.' },
      { time: '08:12', title: 'APAC resting-heart-rate cohort backtest completed', impact: 'Emerging signal remains narrow but audit trail is clean.' },
    ],
  },
  {
    partnerId: partners[1].id,
    lives: 22400,
    dataSources: 64210,
    indexedPapers: 3912,
    verifiedReceipts: 5210,
    avgTrust: 'Medium-high',
    leadSignal: 'HRV',
    opportunityCount: 3,
    morningBrief:
      'Harbour Life is showing recovery drift before renewal season. HRV Recovery is now the highest-priority campaign because it touches fewer members but has the clearest short-horizon intervention path.',
    switcherNote: 'Southeast Asia portfolio where HRV and renewal recovery are the strongest near-term plays.',
    fde: {
      name: 'Maya Lim',
      role: 'Forward Deployed Engineer',
      channel: '#harbour-healthid',
      nextSync: 'Fri 10:00 SGT',
    },
    researchFeed: [
      { time: '09:06', title: 'HRV recovery literature sweep completed', impact: 'Medium confidence upgraded on data credibility.' },
      { time: '08:37', title: 'Singapore renewal cohort refreshed', impact: '2,940 lives inside renewal window.' },
      { time: '08:05', title: 'Lab-proof underwriting screen reviewed', impact: 'Clinical proof remains buyer-diligence asset.' },
    ],
  },
  {
    partnerId: partners[2].id,
    lives: 12800,
    dataSources: 38760,
    indexedPapers: 3620,
    verifiedReceipts: 3124,
    avgTrust: 'Medium',
    leadSignal: 'Sleep',
    opportunityCount: 3,
    morningBrief:
      'NovaBridge is younger and acquisition-led. Sleep and respiratory signals should lead the demo because they create low-friction quote and onboarding moments for digital distribution.',
    switcherNote: 'Digital-first book with acquisition and sleep-led conversion signals.',
    fde: {
      name: 'Ari Chen',
      role: 'Forward Deployed Engineer',
      channel: '#novabridge-healthid',
      nextSync: 'Wed 16:00 HKT',
    },
    researchFeed: [
      { time: '09:20', title: 'Sleep + respiratory signal pack refreshed', impact: 'Supports digital quote friction reduction.' },
      { time: '08:49', title: 'Open-pool acquisition segment expanded', impact: 'Adds 410 anonymous reachable members.' },
      { time: '08:18', title: 'SpO2 proof receipt sample verified', impact: 'No raw-device-data exposure across test flow.' },
    ],
  },
];

export function getPartnerPortfolio(partnerId: string): PartnerPortfolio {
  return partnerPortfolios.find((portfolio) => portfolio.partnerId === partnerId) ?? partnerPortfolios[0];
}
