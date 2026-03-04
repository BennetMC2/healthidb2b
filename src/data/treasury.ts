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
        amount = Math.min(randomInt(rng, 100, 5000), runningBalance - 1000);
        if (amount <= 0) { amount = 50; }
        runningBalance -= amount;
        amount = -amount;
        break;
      case 'expiration':
        amount = Math.min(randomInt(rng, 50, 1500), runningBalance - 1000);
        if (amount <= 0) { amount = 25; }
        runningBalance -= amount;
        amount = -amount;
        break;
      case 'withdrawal':
        amount = Math.min(randomInt(rng, 1000, 15000), runningBalance - 1000);
        if (amount <= 0) { amount = 100; }
        runningBalance -= amount;
        amount = -amount;
        break;
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

// ── Derive treasury state from transaction ledger ───────────────────

function computeTreasuryState(transactions: TreasuryTransaction[]): TreasuryState {
  let totalDeposits = 0;
  let totalYield = 0;
  let totalDistributed = 0;
  let totalExpired = 0;
  let totalWithdrawn = 0;

  for (const tx of transactions) {
    switch (tx.type) {
      case 'deposit':
        totalDeposits += tx.amount;
        break;
      case 'yield_credit':
        totalYield += tx.amount;
        break;
      case 'distribution':
        totalDistributed += Math.abs(tx.amount);
        break;
      case 'expiration':
        totalExpired += Math.abs(tx.amount);
        break;
      case 'withdrawal':
        totalWithdrawn += Math.abs(tx.amount);
        break;
    }
  }

  const startingBalance = 50_000;
  const totalBudget = startingBalance + totalDeposits;
  const availableBalance = transactions.length > 0
    ? transactions[transactions.length - 1].balance
    : startingBalance;

  // Points approximate: $0.012 per HP → distributed amount / 0.012
  const pointsDistributed = Math.round(totalDistributed / 0.012);
  const pointsReserved = Math.round(pointsDistributed * 0.48);
  const pointsExpired = Math.round(totalExpired / 0.012);

  const yieldGenerated = Math.round(totalYield * 100) / 100;
  const yieldRate = 0.045;
  const valueMultiplier = Math.round((1 + (yieldGenerated / totalBudget) + 0.20) * 100) / 100;

  return {
    totalBudget: Math.round(totalBudget),
    availableBalance: Math.round(availableBalance * 100) / 100,
    yieldRate,
    yieldGenerated,
    valueMultiplier,
    pointsDistributed,
    pointsReserved,
    pointsExpired,
  };
}

export const treasuryState: TreasuryState = computeTreasuryState(treasuryTransactions);

// ── Treasury Snapshots (daily for 180 days) ─────────────────────────

function generateSnapshots(): TreasurySnapshot[] {
  const rng = seededRandom(SEED + 100);
  const now = new Date();
  const result: TreasurySnapshot[] = [];

  // Start snapshot budget aligned with the transaction starting balance
  let cumulativeYield = 0;
  let totalBudget = 50_000;
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
