import { Vault, TrendingUp, Coins, ArrowUpRight } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import SankeyDiagram from '@/components/treasury/SankeyDiagram';
import WaterfallChart from '@/components/treasury/WaterfallChart';
import GrowthChart from '@/components/treasury/GrowthChart';
import ROICalculator from '@/components/treasury/ROICalculator';
import { treasuryState, treasuryTransactions, treasurySnapshots } from '@/data';
import { formatCurrency, formatCurrencyPrecise, formatMultiplier, formatNumber, formatTimestamp } from '@/utils/format';
import type { TreasuryTransaction, TransactionType } from '@/types';
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
  const ts = treasuryState;

  return (
    <div className="flex flex-col gap-4 h-full">
      <SectionHeader title="Treasury Operations" description="Budget management and yield generation. Idle funds are held in Real-World Assets (T-Bills) generating yield while waiting for user proofs." icon={<Vault size={16} />} />

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-3">
        <MetricCard
          label="Total Budget"
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
          <InfoTooltip content="The ratio of total user value created to original budget invested. Driven by yield generation and enterprise wholesale buying power." />
        </MetricCard>
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
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card col-span-1">
          <div className="flex items-center gap-1.5 mb-2"><span className="metric-label">Value Flow</span><InfoTooltip content="How $1.00 of budget flows through the protocol and becomes $1.50+ of user value." /></div>
          <SankeyDiagram
            budget={ts.totalBudget}
            yield_={ts.yieldGenerated}
            buyingPower={ts.totalBudget * (ts.valueMultiplier - 1) - ts.yieldGenerated}
            totalValue={ts.totalBudget * ts.valueMultiplier}
          />
        </div>
        <div className="card col-span-1">
          <div className="flex items-center gap-1.5 mb-2"><span className="metric-label">Budget Growth</span><InfoTooltip content="Budget value over time, including accrued T-Bill yield." /></div>
          <GrowthChart data={treasurySnapshots} />
        </div>
        <div className="card col-span-1">
          <div className="flex items-center gap-1.5 mb-2"><span className="metric-label">Value Breakdown</span><InfoTooltip content="Stepped breakdown of value creation: base budget + yield + buying power." /></div>
          <WaterfallChart
            budget={ts.totalBudget}
            yield_={ts.yieldGenerated}
            buyingPower={ts.totalBudget * (ts.valueMultiplier - 1) - ts.yieldGenerated}
          />
        </div>
      </div>

      {/* ROI Calculator */}
      <ROICalculator />

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
          <DataTable data={treasuryTransactions} columns={columns} pageSize={15} />
        </div>
      </div>
    </div>
  );
}
