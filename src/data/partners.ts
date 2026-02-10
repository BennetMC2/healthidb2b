import type { Partner } from '@/types';

// ── Partners ────────────────────────────────────────────────────────
// Three partners representing the enterprise, professional, and starter tiers.

export const partners: Partner[] = [
  {
    id: 'partner_a1',
    label: 'Meridian Health Insurance',
    tier: 'enterprise',
    industry: 'insurance',
    apiKeyPrefix: 'mhi_live_',
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
      allowedRegions: ['North America', 'Europe', 'Asia Pacific'],
      maxConcurrentCampaigns: 25,
    },
    createdAt: '2024-06-15T10:30:00.000Z',
  },
  {
    id: 'partner_b2',
    label: 'NovaGenix Pharmaceuticals',
    tier: 'professional',
    industry: 'pharma',
    apiKeyPrefix: 'ngp_live_',
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
      allowedRegions: ['North America', 'Europe'],
      maxConcurrentCampaigns: 10,
    },
    createdAt: '2024-09-03T14:15:00.000Z',
  },
  {
    id: 'partner_c3',
    label: 'BrightWell Corporate Wellness',
    tier: 'starter',
    industry: 'employer',
    apiKeyPrefix: 'bcw_live_',
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
      allowedRegions: ['North America'],
      maxConcurrentCampaigns: 3,
    },
    createdAt: '2025-01-20T09:00:00.000Z',
  },
];
