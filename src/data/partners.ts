import type { Partner } from '@/types';
import { seededRandom, generateId } from './seed';

// ── Partners ────────────────────────────────────────────────────────
// Three APAC life & health insurer personas: enterprise, professional, starter.

const rng = seededRandom(2024);

export const partners: Partner[] = [
  {
    id: generateId(rng, 'prt'),
    label: 'Pacific Assurance Group',
    tier: 'enterprise',
    industry: 'insurance',
    apiKeyPrefix: 'pag_live_',
    settings: {
      notifications: {
        verificationAlerts: true,
        budgetAlerts: true,
        weeklyDigest: true,
        complianceReports: true,
      },
      dataRetention: {
        proofRetentionDays: 365,
        auditLogRetentionDays: 730,
      },
      allowedRegions: ['Singapore', 'Hong Kong', 'Thailand', 'Malaysia', 'Indonesia'],
      maxConcurrentCampaigns: 25,
    },
    createdAt: '2024-06-15T10:30:00.000Z',
  },
  {
    id: generateId(rng, 'prt'),
    label: 'Harbour Life Insurance',
    tier: 'professional',
    industry: 'insurance',
    apiKeyPrefix: 'hli_live_',
    settings: {
      notifications: {
        verificationAlerts: true,
        budgetAlerts: true,
        weeklyDigest: true,
        complianceReports: false,
      },
      dataRetention: {
        proofRetentionDays: 180,
        auditLogRetentionDays: 365,
      },
      allowedRegions: ['Singapore', 'Malaysia', 'Thailand'],
      maxConcurrentCampaigns: 10,
    },
    createdAt: '2024-09-03T14:15:00.000Z',
  },
  {
    id: generateId(rng, 'prt'),
    label: 'NovaBridge Digital',
    tier: 'starter',
    industry: 'insurance',
    apiKeyPrefix: 'nbd_live_',
    settings: {
      notifications: {
        verificationAlerts: false,
        budgetAlerts: true,
        weeklyDigest: true,
        complianceReports: false,
      },
      dataRetention: {
        proofRetentionDays: 90,
        auditLogRetentionDays: 180,
      },
      allowedRegions: ['Hong Kong', 'Singapore'],
      maxConcurrentCampaigns: 5,
    },
    createdAt: '2025-01-20T09:00:00.000Z',
  },
];
