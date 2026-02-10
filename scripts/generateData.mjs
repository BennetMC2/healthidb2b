import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'src', 'data');

// Seed for deterministic random
let seed = 12345;
function seededRandom() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((seededRandom() * (max - min) + min).toFixed(decimals));
}

function randomChoice(arr) {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function randomChoices(arr, count) {
  const shuffled = [...arr].sort(() => seededRandom() - 0.5);
  return shuffled.slice(0, count);
}

function generateId() {
  return [...Array(24)].map(() => Math.floor(seededRandom() * 16).toString(16)).join('');
}

function generateDate(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return new Date(start + seededRandom() * (end - start)).toISOString();
}

// Constants
const REPUTATION_TIERS = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const REGIONS = ['northeast', 'southeast', 'midwest', 'southwest', 'west'];
const DATA_SOURCES = ['apple_health', 'fitbit', 'garmin', 'oura', 'whoop', 'google_fit', 'samsung_health'];
const CAMPAIGN_TYPES = ['daily_challenge', 'weekly_goal', 'streak', 'milestone', 'event'];
const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'active', 'paused', 'completed'];
const HEALTH_METRICS = ['steps', 'active_minutes', 'sleep_hours', 'sleep_quality', 'heart_rate_resting', 'calories_burned'];
const CLINICAL_EVENT_TYPES = ['blood_panel', 'cholesterol', 'glucose', 'a1c', 'vitamin_d', 'thyroid', 'metabolic_panel', 'lipid_panel'];
const PARTNER_INDUSTRIES = ['insurance', 'pharma', 'employer', 'research', 'healthcare'];

// Generate Partners
function generatePartners() {
  return [
    {
      id: 'partner_001',
      name: 'Vitality Insurance Co.',
      logo: '/logos/vitality.svg',
      industry: 'insurance',
      tier: 'enterprise',
      contactEmail: 'wellness@vitalityins.com',
      apiKeyPrefix: 'vit_live_',
      settings: {
        notificationsEnabled: true,
        weeklyReportEnabled: true,
        dataRetentionDays: 365,
        allowedRegions: ['northeast', 'southeast', 'midwest', 'southwest', 'west'],
      },
      createdAt: '2023-06-15T10:00:00Z',
      stats: {
        totalCampaigns: 12,
        activeCampaigns: 3,
        totalVerifications: 4521,
        totalPointsDistributed: 892000,
        totalBudgetUsed: 178400,
      },
    },
    {
      id: 'partner_002',
      name: 'WellPath Pharma',
      logo: '/logos/wellpath.svg',
      industry: 'pharma',
      tier: 'enterprise',
      contactEmail: 'trials@wellpathpharma.com',
      apiKeyPrefix: 'wp_live_',
      settings: {
        notificationsEnabled: true,
        weeklyReportEnabled: true,
        dataRetentionDays: 730,
        allowedRegions: ['northeast', 'west'],
      },
      createdAt: '2023-09-22T14:30:00Z',
      stats: {
        totalCampaigns: 8,
        activeCampaigns: 2,
        totalVerifications: 2103,
        totalPointsDistributed: 456000,
        totalBudgetUsed: 91200,
      },
    },
    {
      id: 'partner_003',
      name: 'TechCorp Employee Wellness',
      logo: '/logos/techcorp.svg',
      industry: 'employer',
      tier: 'professional',
      contactEmail: 'hr-wellness@techcorp.io',
      apiKeyPrefix: 'tc_live_',
      settings: {
        notificationsEnabled: true,
        weeklyReportEnabled: false,
        dataRetentionDays: 180,
        allowedRegions: ['west', 'southwest'],
      },
      createdAt: '2024-01-10T09:00:00Z',
      stats: {
        totalCampaigns: 5,
        activeCampaigns: 2,
        totalVerifications: 1234,
        totalPointsDistributed: 245000,
        totalBudgetUsed: 49000,
      },
    },
    {
      id: 'partner_004',
      name: 'HealthMetrics Research',
      logo: '/logos/healthmetrics.svg',
      industry: 'research',
      tier: 'starter',
      contactEmail: 'data@healthmetrics.org',
      apiKeyPrefix: 'hmr_live_',
      settings: {
        notificationsEnabled: false,
        weeklyReportEnabled: true,
        dataRetentionDays: 90,
        allowedRegions: ['northeast', 'midwest'],
      },
      createdAt: '2024-03-05T11:15:00Z',
      stats: {
        totalCampaigns: 3,
        activeCampaigns: 1,
        totalVerifications: 567,
        totalPointsDistributed: 85000,
        totalBudgetUsed: 17000,
      },
    },
  ];
}

// Generate Users
function generateUsers(count = 1000) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const healthScore = randomInt(25, 98);
    const reputationPoints = randomInt(0, 15000);
    const tier = reputationPoints >= 10000 ? 'diamond' :
                 reputationPoints >= 5000 ? 'platinum' :
                 reputationPoints >= 2000 ? 'gold' :
                 reputationPoints >= 500 ? 'silver' : 'bronze';

    users.push({
      id: `user_${String(i + 1).padStart(4, '0')}`,
      anonymousId: generateId(),
      healthScore,
      reputationTier: tier,
      reputationPoints,
      ageRange: randomChoice(AGE_RANGES),
      region: randomChoice(REGIONS),
      connectedSources: randomChoices(DATA_SOURCES, randomInt(1, 4)),
      joinedAt: generateDate('2023-01-01', '2024-10-01'),
      lastActiveAt: generateDate('2024-09-01', '2024-10-15'),
      totalVerifications: randomInt(0, 50),
      totalCampaignsJoined: randomInt(0, 20),
    });
  }
  return users;
}

// Generate Daily Health Data (90 days for sample of 100 users)
function generateDailyHealthData(users, days = 90) {
  const data = [];
  const sampleUsers = users.slice(0, 100); // Sample for reasonable file size
  const endDate = new Date('2024-10-15');

  for (const user of sampleUsers) {
    for (let d = 0; d < days; d++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - d);

      data.push({
        id: `dhd_${user.id}_${date.toISOString().split('T')[0]}`,
        userId: user.id,
        date: date.toISOString().split('T')[0],
        steps: randomInt(2000, 15000),
        activeMinutes: randomInt(10, 120),
        sleepHours: randomFloat(4, 10, 1),
        sleepQuality: randomInt(40, 100),
        heartRateAvg: randomInt(60, 100),
        heartRateResting: randomInt(50, 85),
        caloriesBurned: randomInt(1500, 3500),
        stressScore: randomInt(10, 80),
        hydrationLiters: randomFloat(0.5, 4, 1),
        bloodOxygenAvg: randomInt(94, 100),
        hrvMs: randomInt(20, 80),
      });
    }
  }
  return data;
}

// Generate Campaigns
function generateCampaigns() {
  return [
    {
      id: 'camp_001',
      partnerId: 'partner_001',
      name: '10K Steps Challenge',
      description: 'Walk 10,000 steps daily for 7 consecutive days to earn rewards and improve your health score.',
      type: 'streak',
      status: 'active',
      criteria: {
        metric: 'steps',
        operator: 'gte',
        value: 10000,
        durationDays: 7,
        streakRequired: 7,
      },
      eligibility: {
        minHealthScore: 30,
        reputationTiers: ['silver', 'gold', 'platinum', 'diamond'],
        ageRanges: ['25-34', '35-44', '45-54'],
        regions: ['northeast', 'southeast', 'midwest', 'southwest', 'west'],
        requiredSources: ['apple_health', 'fitbit', 'garmin'],
      },
      rewards: {
        pointsPerCompletion: 500,
        bonusPoints: 100,
        maxParticipants: 5000,
        totalBudget: 50000,
      },
      schedule: {
        startDate: '2024-10-01T00:00:00Z',
        endDate: '2024-10-31T23:59:59Z',
        enrollmentDeadline: '2024-10-15T23:59:59Z',
      },
      stats: {
        invited: 3500,
        enrolled: 2847,
        active: 1923,
        completed: 1456,
        verified: 1389,
        pointsDistributed: 694500,
        budgetSpent: 34725,
      },
      createdAt: '2024-09-15T10:00:00Z',
      updatedAt: '2024-10-14T08:30:00Z',
    },
    {
      id: 'camp_002',
      partnerId: 'partner_001',
      name: 'Sleep Better Week',
      description: 'Achieve 7+ hours of quality sleep for 5 nights this week.',
      type: 'weekly_goal',
      status: 'active',
      criteria: {
        metric: 'sleep_hours',
        operator: 'gte',
        value: 7,
        durationDays: 7,
        streakRequired: 5,
      },
      eligibility: {
        minHealthScore: 25,
        reputationTiers: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        regions: ['northeast', 'midwest'],
      },
      rewards: {
        pointsPerCompletion: 300,
        maxParticipants: 3000,
        totalBudget: 30000,
      },
      schedule: {
        startDate: '2024-10-07T00:00:00Z',
        endDate: '2024-10-20T23:59:59Z',
      },
      stats: {
        invited: 2100,
        enrolled: 1654,
        active: 1287,
        completed: 892,
        verified: 845,
        pointsDistributed: 253500,
        budgetSpent: 12675,
      },
      createdAt: '2024-09-28T14:00:00Z',
      updatedAt: '2024-10-13T16:45:00Z',
    },
    {
      id: 'camp_003',
      partnerId: 'partner_002',
      name: 'Cardio Health Trial',
      description: 'Maintain resting heart rate below 70 bpm for clinical research study.',
      type: 'milestone',
      status: 'active',
      criteria: {
        metric: 'heart_rate_resting',
        operator: 'lte',
        value: 70,
        durationDays: 30,
      },
      eligibility: {
        minHealthScore: 50,
        maxHealthScore: 80,
        reputationTiers: ['gold', 'platinum', 'diamond'],
        ageRanges: ['35-44', '45-54', '55-64'],
        requiredSources: ['apple_health', 'fitbit', 'oura', 'whoop'],
        minVerifications: 5,
      },
      rewards: {
        pointsPerCompletion: 1000,
        bonusPoints: 250,
        maxParticipants: 500,
        totalBudget: 75000,
      },
      schedule: {
        startDate: '2024-09-15T00:00:00Z',
        endDate: '2024-11-15T23:59:59Z',
        enrollmentDeadline: '2024-10-01T23:59:59Z',
      },
      stats: {
        invited: 450,
        enrolled: 387,
        active: 312,
        completed: 156,
        verified: 148,
        pointsDistributed: 148000,
        budgetSpent: 37000,
      },
      createdAt: '2024-08-20T09:00:00Z',
      updatedAt: '2024-10-14T11:20:00Z',
    },
    {
      id: 'camp_004',
      partnerId: 'partner_003',
      name: 'Active Minutes Marathon',
      description: 'Log 150+ active minutes per week for our corporate wellness program.',
      type: 'weekly_goal',
      status: 'completed',
      criteria: {
        metric: 'active_minutes',
        operator: 'gte',
        value: 150,
        durationDays: 7,
      },
      eligibility: {
        reputationTiers: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        regions: ['west', 'southwest'],
      },
      rewards: {
        pointsPerCompletion: 200,
        maxParticipants: 2000,
        totalBudget: 20000,
      },
      schedule: {
        startDate: '2024-09-01T00:00:00Z',
        endDate: '2024-09-30T23:59:59Z',
      },
      stats: {
        invited: 1800,
        enrolled: 1456,
        active: 0,
        completed: 1123,
        verified: 1089,
        pointsDistributed: 217800,
        budgetSpent: 10890,
      },
      createdAt: '2024-08-15T10:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
    },
    {
      id: 'camp_005',
      partnerId: 'partner_004',
      name: 'Stress Management Study',
      description: 'Participate in our research on stress reduction techniques.',
      type: 'event',
      status: 'scheduled',
      criteria: {
        metric: 'stress_score',
        operator: 'lte',
        value: 50,
        durationDays: 14,
      },
      eligibility: {
        minHealthScore: 20,
        reputationTiers: ['silver', 'gold', 'platinum'],
        ageRanges: ['25-34', '35-44', '45-54'],
        regions: ['northeast', 'midwest'],
      },
      rewards: {
        pointsPerCompletion: 750,
        bonusPoints: 150,
        maxParticipants: 300,
        totalBudget: 25000,
      },
      schedule: {
        startDate: '2024-11-01T00:00:00Z',
        endDate: '2024-11-30T23:59:59Z',
        enrollmentDeadline: '2024-11-07T23:59:59Z',
      },
      stats: {
        invited: 0,
        enrolled: 0,
        active: 0,
        completed: 0,
        verified: 0,
        pointsDistributed: 0,
        budgetSpent: 0,
      },
      createdAt: '2024-10-10T15:00:00Z',
      updatedAt: '2024-10-10T15:00:00Z',
    },
  ];
}

// Generate Participation Events
function generateParticipationEvents(users, campaigns, count = 15000) {
  const events = [];
  const eventTypes = ['invited', 'viewed', 'enrolled', 'started', 'progress_update', 'completed', 'verified', 'rewarded', 'dropped'];
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'completed');

  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const campaign = randomChoice(activeCampaigns);

    events.push({
      id: `pe_${String(i + 1).padStart(6, '0')}`,
      userId: user.id,
      campaignId: campaign.id,
      eventType: randomChoice(eventTypes),
      timestamp: generateDate(campaign.schedule.startDate, '2024-10-15'),
      metadata: seededRandom() > 0.7 ? { progress: randomInt(10, 100) } : undefined,
    });
  }

  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Generate Verifications
function generateVerifications(users, campaigns, count = 500) {
  const verifications = [];
  const proofTypes = ['zk_snark', 'zk_stark', 'bulletproof'];
  const statuses = ['pending', 'verified', 'verified', 'verified', 'failed']; // Weighted toward verified

  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const campaign = randomChoice(campaigns.filter(c => c.status === 'active' || c.status === 'completed'));
    const timestamp = generateDate(campaign.schedule.startDate, '2024-10-15');

    verifications.push({
      id: `ver_${String(i + 1).padStart(5, '0')}`,
      userId: user.id,
      campaignId: campaign.id,
      proofHash: `0x${[...Array(64)].map(() => Math.floor(seededRandom() * 16).toString(16)).join('')}`,
      proofType: randomChoice(proofTypes),
      status: randomChoice(statuses),
      challengeMet: seededRandom() > 0.15,
      verifiedAt: timestamp,
      metadata: {
        dataSourcesUsed: randomChoices(DATA_SOURCES, randomInt(1, 3)),
        timeWindowStart: new Date(new Date(timestamp).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        timeWindowEnd: timestamp,
        aggregationType: randomChoice(['daily_avg', 'sum', 'min', 'max']),
        privacyLevel: randomChoice(['full', 'partial']),
      },
    });
  }

  return verifications.sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt));
}

// Generate Clinical Events
function generateClinicalEvents(users, count = 300) {
  const events = [];

  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const eventType = randomChoice(CLINICAL_EVENT_TYPES);

    events.push({
      id: `clin_${String(i + 1).padStart(4, '0')}`,
      userId: user.id,
      eventType,
      date: generateDate('2024-01-01', '2024-10-15').split('T')[0],
      verified: seededRandom() > 0.2,
      proofHash: seededRandom() > 0.3 ? `0x${[...Array(64)].map(() => Math.floor(seededRandom() * 16).toString(16)).join('')}` : undefined,
      labName: randomChoice(['LabCorp', 'Quest Diagnostics', 'BioReference', 'Sonic Healthcare']),
      resultCategory: randomChoice(['normal', 'normal', 'borderline', 'abnormal']),
    });
  }

  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Generate Health Points Transactions
function generateHealthPoints(users, campaigns, count = 2000) {
  const transactions = [];
  const types = ['earned_campaign', 'earned_campaign', 'earned_bonus', 'earned_referral', 'redeemed', 'adjustment'];

  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const type = randomChoice(types);
    const campaign = type.startsWith('earned_') ? randomChoice(campaigns) : null;

    let amount;
    if (type === 'redeemed') {
      amount = -randomInt(100, 1000);
    } else if (type === 'adjustment') {
      amount = randomInt(-50, 50);
    } else if (type === 'earned_bonus') {
      amount = randomInt(50, 200);
    } else if (type === 'earned_referral') {
      amount = randomInt(100, 500);
    } else {
      amount = randomInt(100, 1000);
    }

    transactions.push({
      id: `hpt_${String(i + 1).padStart(5, '0')}`,
      userId: user.id,
      campaignId: campaign?.id,
      type,
      amount,
      balance: user.reputationPoints + amount,
      timestamp: generateDate('2024-01-01', '2024-10-15'),
      description: type === 'earned_campaign' ? `Completed ${campaign?.name}` :
                   type === 'earned_bonus' ? 'Streak bonus' :
                   type === 'earned_referral' ? 'Referral reward' :
                   type === 'redeemed' ? 'Points redeemed' :
                   'Balance adjustment',
    });
  }

  return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Main execution
console.log('Generating mock data...');

const partners = generatePartners();
console.log(`Generated ${partners.length} partners`);

const users = generateUsers(1000);
console.log(`Generated ${users.length} users`);

const campaigns = generateCampaigns();
console.log(`Generated ${campaigns.length} campaigns`);

const dailyHealthData = generateDailyHealthData(users, 90);
console.log(`Generated ${dailyHealthData.length} daily health records`);

const participationEvents = generateParticipationEvents(users, campaigns, 15000);
console.log(`Generated ${participationEvents.length} participation events`);

const verifications = generateVerifications(users, campaigns, 500);
console.log(`Generated ${verifications.length} verifications`);

const clinicalEvents = generateClinicalEvents(users, 300);
console.log(`Generated ${clinicalEvents.length} clinical events`);

const healthPoints = generateHealthPoints(users, campaigns, 2000);
console.log(`Generated ${healthPoints.length} health point transactions`);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(dataDir, 'partners.json'), JSON.stringify(partners, null, 2));
fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(dataDir, 'campaigns.json'), JSON.stringify(campaigns, null, 2));
fs.writeFileSync(path.join(dataDir, 'daily_health_data.json'), JSON.stringify(dailyHealthData, null, 2));
fs.writeFileSync(path.join(dataDir, 'participation_events.json'), JSON.stringify(participationEvents, null, 2));
fs.writeFileSync(path.join(dataDir, 'verifications.json'), JSON.stringify(verifications, null, 2));
fs.writeFileSync(path.join(dataDir, 'clinical_events.json'), JSON.stringify(clinicalEvents, null, 2));
fs.writeFileSync(path.join(dataDir, 'health_points.json'), JSON.stringify(healthPoints, null, 2));

console.log('All data files written to src/data/');
