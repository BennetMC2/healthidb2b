import type {
  TreasuryState,
  TreasuryTransaction,
  TreasurySnapshot,
  TransactionType,
} from '@/types';
import {
  seededRandom,
  randomInt,
  randomFloat,
  randomItem,
  generateId,
  weightedIndex,
} from './seed';
import { partners } from './partners';

// ── Configuration ───────────────────────────────────────────────────

const SEED = 9001;
const TRANSACTION_COUNT = 100;
const SNAPSHOT_DAYS = 180;

// ── Treasury State ──────────────────────────────────────────────────

export const treasuryState: TreasuryState = {
  totalBudget: 250_000,
  availableBalance: 148_320,
  yieldRate: 0.045,
  yieldGenerated: 8_412.75,
  valueMultiplier: 1.47,
  pointsDistributed: 87_450,
  pointsReserved: 42_000,
  pointsExpired: 3_820,
};

// ── Treasury Transactions ───────────────────────────────────────────

const TRANSACTION_TYPES: TransactionType[] = [
  'deposit',
  'yield_credit',
  'distribution',
  'expiration',
  'withdrawal',
];

/** Weights: deposits 20%, yield credits 25%, distributions 35%, expirations 10%, withdrawals 10% */
const TRANSACTION_WEIGHTS = [0.20, 0.25, 0.35, 0.10, 0.10];

const DESCRIPTIONS: Record<TransactionType, string[]> = {
  deposit: [
    'Partner budget deposit',
    'Quarterly budget top-up',
    'Campaign funding deposit',
    'Initial programme funding',
  ],
  yield_credit: [
    'Daily yield accrual',
    'Weekly yield credit',
    'Compounded yield credit',
    'Treasury yield distribution',
  ],
  distribution: [
    'Verification reward distribution',
    'Campaign participant payout',
    'Batch reward settlement',
    'Achievement reward payout',
  ],
  expiration: [
    'Unused points expiration',
    'Quarterly point expiry',
    'Dormant account point sweep',
  ],
  withdrawal: [
    'Partner balance withdrawal',
    'Budget reallocation withdrawal',
    'End-of-campaign withdrawal',
  ],
};

function generateTransactions(): TreasuryTransaction[] {
  const rng = seededRandom(SEED);
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const partnerIds = partners.map((p) => p.id);
  const result: TreasuryTransaction[] = [];

  // Generate timestamps sorted chronologically
  const timestamps: number[] = [];
  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const ms = sixMonthsAgo.getTime() + rng() * (now.getTime() - sixMonthsAgo.getTime());
    timestamps.push(ms);
  }
  timestamps.sort((a, b) => a - b);

  let runningBalance = 50_000; // Starting balance

  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const typeIndex = weightedIndex(rng, TRANSACTION_WEIGHTS);
    const type = TRANSACTION_TYPES[typeIndex];
    const partnerId = randomItem(rng, partnerIds);
    const description = randomItem(rng, DESCRIPTIONS[type]);

    let amount: number;
    switch (type) {
      case 'deposit':
        amount = randomInt(rng, 5000, 50000);
        runningBalance += amount;
        break;
      case 'yield_credit':
        amount = Math.round(randomFloat(rng, 20, 250) * 100) / 100;
        runningBalance += amount;
        break;
      case 'distribution':
        amount = -randomInt(rng, 100, 5000);
        runningBalance += amount;
        break;
      case 'expiration':
        amount = -randomInt(rng, 50, 1500);
        runningBalance += amount;
        break;
      case 'withdrawal':
        amount = -randomInt(rng, 1000, 15000);
        runningBalance += amount;
        break;
    }

    // Keep balance from going negative
    if (runningBalance < 0) {
      runningBalance -= amount;
      amount = Math.abs(amount);
      runningBalance += amount;
    }

    result.push({
      id: generateId(rng, 'txn'),
      type,
      amount,
      balance: Math.round(runningBalance * 100) / 100,
      description,
      timestamp: new Date(timestamps[i]).toISOString(),
      partnerId,
    });
  }

  return result;
}

export const treasuryTransactions: TreasuryTransaction[] = generateTransactions();

// ── Treasury Snapshots (daily for 180 days) ─────────────────────────

function generateSnapshots(): TreasurySnapshot[] {
  const rng = seededRandom(SEED + 100);
  const now = new Date();
  const result: TreasurySnapshot[] = [];

  let cumulativeYield = 0;
  let totalBudget = 150_000;
  let pointsDistributed = 15_000;

  for (let day = SNAPSHOT_DAYS; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    // Simulate gradual growth
    const dailyYield = Math.round(randomFloat(rng, 30, 70) * 100) / 100;
    cumulativeYield = Math.round((cumulativeYield + dailyYield) * 100) / 100;

    // Budget increases with occasional deposits
    if (rng() < 0.05) {
      totalBudget += randomInt(rng, 5000, 25000);
    }

    // Points distributed grows daily
    pointsDistributed += randomInt(rng, 100, 800);

    // Value multiplier grows slowly
    const valueMultiplier = Math.round((1.0 + (SNAPSHOT_DAYS - day) * 0.0026 + rng() * 0.02) * 1000) / 1000;

    result.push({
      date: date.toISOString().split('T')[0],
      totalBudget,
      yieldAccrued: dailyYield,
      cumulativeYield,
      pointsDistributed,
      valueMultiplier,
    });
  }

  return result;
}

export const treasurySnapshots: TreasurySnapshot[] = generateSnapshots();
