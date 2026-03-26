import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TreasuryOnboarding from '@/components/onboarding/TreasuryOnboarding';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { Vault, TrendingUp, ArrowUpRight, Coins, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import InfoTooltip from '@/components/ui/InfoTooltip';
import SankeyDiagram from '@/components/treasury/SankeyDiagram';
import WaterfallChart from '@/components/treasury/WaterfallChart';
import GrowthChart from '@/components/treasury/GrowthChart';
import ROICalculator from '@/components/treasury/ROICalculator';
import MultiplierSources from '@/components/treasury/MultiplierSources';
import ClaimsImpactChart from '@/components/treasury/ClaimsImpactChart';
import FundingComparison from '@/components/treasury/FundingComparison';
import ActuarialROICalculator from '@/components/campaigns/ActuarialROICalculator';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { identities, computeTreasuryState, treasuryTransactions, treasurySnapshots } from '@/data';
import { formatCurrency, formatCurrencyPrecise, formatMultiplier, formatNumber, formatTimestamp } from '@/utils/format';
import type { TreasuryTransaction, TreasurySnapshot, TransactionType } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const typeVariants: Record<TransactionType, 'success' | 'accent' | 'warning' | 'error' | 'default'> = {
  deposit: 'success',
  yield_credit: 'accent',
  distribution: 'warning',
  expiration: 'error',
  withdrawal: 'default',
};

const typeLabels: Record<TransactionType, string> = {
  deposit: 'Deposit',
  yield_credit: 'Yield',
  distribution: 'Distribution',
  expiration: 'Expiration',
  withdrawal: 'Withdrawal',
};

const columns: ColumnDef<TreasuryTransaction, unknown>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ getValue }) => (
      <span className="text-2xs text-tertiary">{formatTimestamp(getValue<string>())}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => {
      const type = getValue<TransactionType>();
      return <Badge variant={typeVariants[type]}>{typeLabels[type]}</Badge>;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ getValue, row }) => {
      const amount = getValue<number>();
      const isPositive = ['deposit', 'yield_credit'].includes(row.original.type);
      return (
        <span className={`font-mono text-xs ${isPositive ? 'text-success' : 'text-error'}`}>
          {isPositive ? '+' : '-'}{formatCurrencyPrecise(Math.abs(amount))}
        </span>
      );
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-secondary">{formatCurrencyPrecise(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ getValue }) => (
      <span className="text-xs text-tertiary">{getValue<string>()}</span>
    ),
  },
];

export default function Treasury() {
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const loading = useSimulatedLoading(500);
  const location = useLocation();

  // ── Partner-scoped treasury data ──────────────────────────────────
  const partnerTransactions = useMemo(
    () => treasuryTransactions.filter((t) => t.partnerId === currentPartner.id),
    [currentPartner.id],
  );

  const ts = useMemo(
    () => computeTreasuryState(partnerTransactions),
    [partnerTransactions],
  );

  // Scale snapshots proportionally by partner's share of total budget
  const partnerSnapshots = useMemo(() => {
    const globalState = computeTreasuryState(treasuryTransactions);
    const ratio = globalState.totalBudget > 0 ? ts.totalBudget / globalState.totalBudget : 0;
    return treasurySnapshots.map((s): TreasurySnapshot => ({
      ...s,
      totalBudget: Math.round(s.totalBudget * ratio),
      yieldAccrued: Math.round(s.yieldAccrued * ratio * 100) / 100,
      cumulativeYield: Math.round(s.cumulativeYield * ratio * 100) / 100,
      pointsDistributed: Math.round(s.pointsDistributed * ratio),
    }));
  }, [ts.totalBudget]);

  // Operations section: collapsed by default, auto-expand if hash targets it
  const [showOperations, setShowOperations] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('healthid_treasury_onboarded')
  );

  // Scroll to section via hash
  useEffect(() => {
    if (loading) return;
    const hash = location.hash.replace('#', '');
    if (hash) {
      // Auto-expand operations if hash targets something inside it
      if (hash === 'operations') {
        setShowOperations(true);
      }
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [loading, location.hash]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full animate-pulse">
        <div className="skeleton h-8 w-72" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded" />)}
        </div>
        <div className="skeleton h-48 rounded" />
        <div className="flex-1 skeleton rounded" />
      </div>
    );
  }

  const totalUserValue = ts.totalBudget * ts.valueMultiplier;
  const audienceSize = identities.length || 5000;

  return (
    <div className="flex flex-col gap-6 h-full">
      {showOnboarding && <TreasuryOnboarding onDismiss={() => setShowOnboarding(false)} />}

      {/* ── Section 1: Header + Headline Metrics ────────────────────── */}
      <div>
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="text-accent/60"><Vault size={16} /></span>
            <h2 className="text-sm font-semibold text-primary">The Economic Yield Engine</h2>
          </div>
          <p className="text-xs text-tertiary mt-0.5 leading-relaxed max-w-[640px]">
            Transforming partner budgets from cost centers into subsidized ecosystems
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            label="Budget Deployed"
            value={formatCurrency(ts.totalBudget)}
            icon={<Vault size={14} />}
          />
          <MetricCard
            label="Yield Generated"
            value={formatCurrency(ts.yieldGenerated)}
            subValue={`${(ts.yieldRate * 100).toFixed(1)}% APY`}
            icon={<TrendingUp size={14} />}
            trend={{ value: ts.yieldRate * 100, label: 'T-Bill yield' }}
          >
            <InfoTooltip content="Generated from US Treasury Bills (T-Bills) while funds await distribution. Current rate reflects prevailing short-term government bond yields." />
          </MetricCard>
          <MetricCard
            label="Value Multiplier"
            value={formatMultiplier(ts.valueMultiplier)}
            icon={<ArrowUpRight size={14} />}
          >
            <InfoTooltip content="Protocol cost ~1.5 cents wholesale, user value 3.0+ cents retail = 150% Value Arbitrage. Driven by yield generation and enterprise wholesale buying power." />
          </MetricCard>
          <MetricCard
            label="Total User Value"
            value={formatCurrency(totalUserValue)}
            subValue={`from ${formatCurrency(ts.totalBudget)} budget`}
            icon={<DollarSign size={14} />}
          >
            <InfoTooltip content="The punchline: total value delivered to users after yield generation and wholesale buying power amplify the base budget." />
          </MetricCard>
        </div>
      </div>

      {/* ── Section 2: The Multiplier Effect ────────────────────────── */}
      <div id="multiplier-effect">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">The Multiplier Effect</h3>
          <p className="text-2xs text-tertiary mt-0.5">How $1 becomes ${ts.valueMultiplier.toFixed(2)}+</p>
        </div>

        <MultiplierSources />

        <div id="value-multiplier" className="grid grid-cols-2 gap-3 mt-3">
          <div id="sankey" className="card">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="metric-label">Value Flow</span>
              <InfoTooltip content="How $1.00 of budget flows through the protocol and becomes $1.50+ of user value." />
            </div>
            <SankeyDiagram
              budget={ts.totalBudget}
              yield_={ts.yieldGenerated}
              buyingPower={ts.totalBudget * (ts.valueMultiplier - 1) - ts.yieldGenerated}
              totalValue={totalUserValue}
            />
          </div>
          <div className="card">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="metric-label">Value Breakdown</span>
              <InfoTooltip content="Stepped breakdown of value creation: base budget + yield + buying power." />
            </div>
            <WaterfallChart
              budget={ts.totalBudget}
              yield_={ts.yieldGenerated}
              buyingPower={ts.totalBudget * (ts.valueMultiplier - 1) - ts.yieldGenerated}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: The Yield Engine ─────────────────────────────── */}
      <div id="yield-engine">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">The Yield Engine</h3>
          <p className="text-2xs text-tertiary mt-0.5">Budget growth over time</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="metric-label">Budget Growth</span>
            <InfoTooltip content="Budget value over time, including accrued T-Bill yield." />
          </div>
          <GrowthChart data={partnerSnapshots} />
          <p className="text-2xs text-tertiary mt-2 leading-relaxed">
            Funds held in tokenized T-Bills (BlackRock BUIDL / Ondo USDY). Principal protected, yield recycled into the reward pool.
          </p>
        </div>

        <div id="roi-calculator" className="mt-3">
          <ROICalculator />
        </div>
      </div>

      {/* ── Section 4: The Insurer Payoff ───────────────────────────── */}
      <div id="actuarial-roi">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">The Insurer Payoff</h3>
          <p className="text-2xs text-tertiary mt-0.5">From risk classification to risk reduction</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ActuarialROICalculator
            metric="hba1c"
            type="snapshot"
            useCase="underwriting"
            maxParticipants={audienceSize}
            budgetCeiling={25000}
          />
          <ClaimsImpactChart />
        </div>

        {/* Behavioral Economics */}
        <div id="behavioral-economics" className="card mt-3">
          <span className="metric-label block mb-2">Reward Type Impact</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-elevated p-3">
              <div className="text-2xs text-tertiary uppercase tracking-wider mb-1">Cash Rewards</div>
              <div className="font-mono text-lg font-bold text-secondary">1.0x</div>
              <div className="text-2xs text-tertiary mt-0.5">Baseline engagement</div>
            </div>
            <div className="rounded-lg border border-accent/20 bg-accent-dim/20 p-3">
              <div className="text-2xs text-accent uppercase tracking-wider mb-1">Aspirational Rewards</div>
              <div className="font-mono text-lg font-bold text-accent">1.5–2.5x</div>
              <div className="text-2xs text-tertiary mt-0.5">Sustained habit formation</div>
            </div>
          </div>
          <p className="text-2xs text-tertiary mt-2 leading-relaxed">
            Flights, experiences, and aspirational rewards drive 1.5–2.5x more sustained engagement than cash equivalents.
            Source: Vitality/Discovery wellness programme longitudinal data (2012–2023).
          </p>
        </div>
      </div>

      {/* ── Section 5: Competitive Context ──────────────────────────── */}
      <div>
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Competitive Context</h3>
        </div>
        <FundingComparison />
      </div>

      {/* ── Section 6: Treasury Operations (collapsible) ────────────── */}
      <div id="operations">
        <button
          onClick={() => setShowOperations((v) => !v)}
          className="flex items-center gap-2 w-full text-left py-2 group"
        >
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider group-hover:text-accent transition-colors">
            Treasury Operations
          </h3>
          {showOperations ? (
            <ChevronUp size={14} className="text-tertiary" />
          ) : (
            <ChevronDown size={14} className="text-tertiary" />
          )}
        </button>

        {showOperations && (
          <div className="flex flex-col gap-3 mt-1">
            {/* Points metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Points Distributed"
                value={formatNumber(ts.pointsDistributed)}
                icon={<Coins size={14} />}
              />
              <MetricCard
                label="Points Reserved"
                value={formatNumber(ts.pointsReserved)}
                subValue={`${formatNumber(ts.pointsExpired)} expired`}
              >
                <InfoTooltip content="Health Points allocated to active campaigns but not yet distributed. Expire after 24 months of inactivity." />
              </MetricCard>
              <MetricCard
                label="Points Expired"
                value={formatNumber(ts.pointsExpired)}
              />
            </div>

            {/* Controls + Transaction History */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Controls */}
              <div className="card w-[240px] flex-shrink-0 space-y-4">
                <span className="metric-label block">Treasury Controls</span>
                <div>
                  <label className="text-2xs text-tertiary block mb-1">Budget Ceiling</label>
                  <input
                    type="text"
                    defaultValue={formatCurrency(ts.totalBudget)}
                    className="input-field w-full font-mono text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-2xs text-tertiary block mb-1">Point Expiration</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      defaultValue={24}
                      className="input-field w-16 font-mono text-xs"
                    />
                    <span className="text-2xs text-tertiary">months inactivity</span>
                  </div>
                </div>
                <div>
                  <label className="text-2xs text-tertiary block mb-1">Wholesale Rate</label>
                  <div className="text-sm font-mono text-secondary">$0.012 / HP</div>
                </div>
                <div>
                  <label className="text-2xs text-tertiary block mb-1">Available Balance</label>
                  <div className="text-sm font-mono text-accent">{formatCurrency(ts.availableBalance)}</div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="flex-1 card p-0 overflow-hidden">
                <DataTable data={partnerTransactions} columns={columns} pageSize={15} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
