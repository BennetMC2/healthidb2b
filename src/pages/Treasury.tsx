import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TreasuryOnboarding from '@/components/onboarding/TreasuryOnboarding';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Activity,
  BarChart2,
  Coins,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
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
import { formatCurrency, formatCurrencyPrecise, formatNumber, formatTimestamp } from '@/utils/format';
import { getMetricsGroupedByCategory } from '@/utils/constants';
import { calculateMultiMetricROI } from '@/utils/actuarial';
import type { TreasuryTransaction, TreasurySnapshot, TransactionType, HealthMetric, CampaignType, CampaignUseCase } from '@/types';
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

const USE_CASE_LABELS: Record<CampaignUseCase, string> = {
  underwriting: 'Underwriting',
  dynamic_premium: 'Dynamic Premium',
  claims_reduction: 'Claims Reduction',
  renewal: 'Renewal',
  acquisition: 'Acquisition',
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

  // ── Actuarial state ────────────────────────────────────────────────
  const [actuarialMetric, setActuarialMetric] = useState<HealthMetric>('hba1c');
  const [actuarialType, setActuarialType] = useState<CampaignType>('snapshot');
  const [actuarialUseCase, setActuarialUseCase] = useState<CampaignUseCase>('underwriting');
  const [additionalMetrics, setAdditionalMetrics] = useState<HealthMetric[]>([]);

  // Portfolio book analysis state
  const [portfolioBookSize, setPortfolioBookSize] = useState(10000);
  const [portfolioAvgPremium, setPortfolioAvgPremium] = useState(1200);

  // Collapsible sections
  const [showOperations, setShowOperations] = useState(false);
  const [showYieldMechanics, setShowYieldMechanics] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('healthid_treasury_onboarded')
  );

  const audienceSize = identities.length || 5000;
  const BUDGET_CEILING = 25000;

  // ── Multi-metric ROI computation ──────────────────────────────────
  const allMetrics = [actuarialMetric, ...additionalMetrics] as HealthMetric[];
  const multiRoi = useMemo(
    () => calculateMultiMetricROI(allMetrics, actuarialUseCase, actuarialType, audienceSize, BUDGET_CEILING),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actuarialMetric, actuarialUseCase, actuarialType, additionalMetrics, audienceSize],
  );

  // ── Portfolio book calculations ────────────────────────────────────
  const portfolioMAPE = portfolioBookSize * portfolioAvgPremium;
  const portfolioVNB = multiRoi.vnbImpactPer1MMAPE * (portfolioMAPE / 1_000_000);
  const portfolioAnnualSavings = multiRoi.savingsPerMember * portfolioBookSize;

  // ── Available metrics for "add" dropdown (exclude already selected) ──
  const metricGroups = getMetricsGroupedByCategory();
  const selectedSet = new Set<HealthMetric>(allMetrics);

  const addMetric = (m: HealthMetric) => {
    if (additionalMetrics.length < 2 && !selectedSet.has(m)) {
      setAdditionalMetrics((prev) => [...prev, m]);
    }
  };

  const removeAdditionalMetric = (m: HealthMetric) => {
    setAdditionalMetrics((prev) => prev.filter((x) => x !== m));
  };

  const [addMetricOpen, setAddMetricOpen] = useState(false);

  // ── Hash-based scrolling ──────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const hash = location.hash.replace('#', '');
    if (hash) {
      if (hash === 'operations') setShowOperations(true);
      if (['sankey', 'roi-calculator', 'value-multiplier', 'behavioral-economics'].includes(hash)) {
        setShowYieldMechanics(true);
      }
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [loading, location.hash]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full animate-pulse">
        <div className="skeleton h-8 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded" />)}
        </div>
        <div className="skeleton h-48 rounded" />
        <div className="flex-1 skeleton rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {showOnboarding && <TreasuryOnboarding onDismiss={() => setShowOnboarding(false)} />}

      {/* ── Section 1: Header + Insurer Headline Metrics ─────────────── */}
      <div>
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="text-accent/60"><TrendingUp size={16} /></span>
            <h2 className="text-sm font-semibold text-primary">Actuarial Impact Engine</h2>
          </div>
          <p className="text-xs text-tertiary mt-0.5 leading-relaxed max-w-[640px]">
            From risk classification to measurable claims reduction — modeled by metric, use case, and population
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Claims Reduction"
            value={multiRoi.isReady ? `${(multiRoi.claimsReductionRate * 100).toFixed(0)}%` : '—'}
            icon={<Activity size={14} />}
          />
          <MetricCard
            label="Projected Savings"
            value={multiRoi.isReady ? formatCurrency(multiRoi.totalProjectedSavings) : '—'}
            subValue={multiRoi.isReady ? `${formatCurrency(multiRoi.savingsPerMember)}/member` : undefined}
            icon={<DollarSign size={14} />}
          >
            <InfoTooltip content="Projected annual claims savings across the active campaign cohort, based on the selected metric and use case." />
          </MetricCard>
          <MetricCard
            label="Morbidity Shift"
            value={multiRoi.isReady && multiRoi.morbidityShiftBps > 0 ? `${multiRoi.morbidityShiftBps} bps` : '—'}
            icon={<BarChart2 size={14} />}
          >
            <InfoTooltip content="Estimated basis-point improvement in morbidity assumption. Language used in actuarial pricing models." />
          </MetricCard>
          <MetricCard
            label="Payback Period"
            value={
              multiRoi.isReady && multiRoi.paybackMonths > 0
                ? multiRoi.paybackMonths >= 36 ? '36 mo+' : `${multiRoi.paybackMonths} mo`
                : '—'
            }
            icon={<ArrowUpRight size={14} />}
          >
            <InfoTooltip content="Months for projected savings to recoup campaign cost. Capped at 36 months." />
          </MetricCard>
        </div>
      </div>

      {/* ── Section 2: The Insurer Payoff (multi-metric) ─────────────── */}
      <div id="actuarial-roi">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">The Insurer Payoff</h3>
          <p className="text-2xs text-tertiary mt-0.5">From risk classification to risk reduction · stack metrics to model combined morbidity impact</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-3">
            {/* Primary metric + type + use case controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={actuarialMetric}
                onChange={(e) => setActuarialMetric(e.target.value as HealthMetric)}
                className="input-field text-xs flex-1 min-w-[140px]"
              >
                {metricGroups.map((group) => (
                  <optgroup key={group.category} label={group.label}>
                    {group.metrics.map((m) => (
                      <option key={m.key} value={m.key} disabled={additionalMetrics.includes(m.key)}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                onClick={() => setActuarialType('snapshot')}
                className={`badge cursor-pointer ${actuarialType === 'snapshot' ? 'badge-accent' : 'badge-default'}`}
              >
                Snapshot
              </button>
              <button
                onClick={() => setActuarialType('stream')}
                className={`badge cursor-pointer ${actuarialType === 'stream' ? 'badge-accent' : 'badge-default'}`}
              >
                Stream
              </button>
            </div>

            {/* Use case row */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(USE_CASE_LABELS) as CampaignUseCase[]).map((uc) => (
                <button
                  key={uc}
                  onClick={() => setActuarialUseCase(uc)}
                  className={`badge cursor-pointer transition-colors ${
                    actuarialUseCase === uc ? 'badge-accent' : 'badge-default hover:bg-accent/10'
                  }`}
                >
                  {USE_CASE_LABELS[uc]}
                </button>
              ))}
            </div>

            {/* Additional metrics row */}
            <div className="flex flex-wrap items-center gap-2">
              {additionalMetrics.map((m) => {
                const label = metricGroups
                  .flatMap((g) => g.metrics)
                  .find((x) => x.key === m)?.label ?? m;
                return (
                  <span key={m} className="badge badge-accent flex items-center gap-1">
                    {label}
                    <button onClick={() => removeAdditionalMetric(m)} className="ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                );
              })}

              {additionalMetrics.length < 2 && (
                <div className="relative">
                  <button
                    onClick={() => setAddMetricOpen((v) => !v)}
                    className="badge badge-default cursor-pointer flex items-center gap-1 hover:bg-accent/10 transition-colors"
                  >
                    <Plus size={10} /> Add metric
                  </button>
                  {addMetricOpen && (
                    <div className="absolute top-full left-0 mt-1 z-10 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[180px] max-h-48 overflow-y-auto">
                      {metricGroups.map((group) => (
                        <div key={group.category}>
                          <div className="px-3 py-1 text-2xs text-tertiary uppercase tracking-wider font-medium bg-elevated">
                            {group.label}
                          </div>
                          {group.metrics
                            .filter((m) => !selectedSet.has(m.key))
                            .map((m) => (
                              <button
                                key={m.key}
                                onClick={() => { addMetric(m.key); setAddMetricOpen(false); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-secondary hover:bg-hover hover:text-primary transition-colors"
                              >
                                {m.label}
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {additionalMetrics.length > 0 && (
                <span className="text-2xs text-tertiary">
                  Combined · 0.75× correlation dampener applied
                </span>
              )}
            </div>

            <ActuarialROICalculator
              metric={actuarialMetric}
              type={actuarialType}
              useCase={actuarialUseCase}
              maxParticipants={audienceSize}
              budgetCeiling={BUDGET_CEILING}
              showVNB={true}
            />
          </div>
          <ClaimsImpactChart />
        </div>
      </div>

      {/* ── Section 3: Portfolio Book Analysis ───────────────────────── */}
      <div id="portfolio-book">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Portfolio Book Analysis</h3>
          <p className="text-2xs text-tertiary mt-0.5">Scale morbidity shift across your full book · enter book size and average premium</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Inputs */}
          <div className="card flex flex-col gap-4">
            <div>
              <label className="text-2xs text-tertiary block mb-1 uppercase tracking-wider font-medium">
                Book Size (policyholders)
              </label>
              <input
                type="number"
                value={portfolioBookSize}
                min={100}
                step={1000}
                onChange={(e) => setPortfolioBookSize(Math.max(100, Number(e.target.value)))}
                className="input-field text-xs font-mono w-full"
              />
            </div>
            <div>
              <label className="text-2xs text-tertiary block mb-1 uppercase tracking-wider font-medium">
                Avg Annual Premium ($)
              </label>
              <input
                type="number"
                value={portfolioAvgPremium}
                min={100}
                step={100}
                onChange={(e) => setPortfolioAvgPremium(Math.max(100, Number(e.target.value)))}
                className="input-field text-xs font-mono w-full"
              />
            </div>
            <div className="text-2xs text-tertiary leading-relaxed">
              Total MAPE:{' '}
              <span className="font-mono font-semibold text-secondary">
                {formatCurrency(portfolioMAPE)}
              </span>
            </div>
          </div>

          {/* Outputs */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs text-tertiary block uppercase tracking-wider font-medium">Total VNB Impact</span>
                <span className="font-mono text-xl font-bold text-accent mt-0.5 block">
                  {multiRoi.isReady ? formatCurrency(portfolioVNB) : '—'}
                </span>
                <span className="text-2xs text-tertiary">
                  {multiRoi.isReady
                    ? `${multiRoi.morbidityShiftBps} bps × ${formatCurrency(multiRoi.vnbImpactPer1MMAPE / 1000)}K per $1M MAPE`
                    : 'Select a metric to compute'}
                </span>
              </div>
              <InfoTooltip content="Value of New Business impact estimated from morbidity improvement. Each basis point of morbidity shift ≈ $4.5K VNB per $1M Modal Annual Premium Equivalent." />
            </div>

            <div className="h-px bg-border" />

            <div>
              <span className="text-2xs text-tertiary block uppercase tracking-wider font-medium">Total Annual Savings</span>
              <span className="font-mono text-xl font-bold text-success mt-0.5 block">
                {multiRoi.isReady ? formatCurrency(portfolioAnnualSavings) : '—'}
              </span>
              <span className="text-2xs text-tertiary">
                {multiRoi.isReady
                  ? `${formatCurrency(multiRoi.savingsPerMember)}/member across ${portfolioBookSize.toLocaleString()} lives`
                  : ''}
              </span>
            </div>

            <div className="h-px bg-border" />

            <div>
              <span className="text-2xs text-tertiary block uppercase tracking-wider font-medium">Morbidity Assumption Shift</span>
              <span className="font-mono text-xl font-bold text-primary mt-0.5 block">
                {multiRoi.isReady && multiRoi.morbidityShiftBps > 0 ? `${multiRoi.morbidityShiftBps} bps` : '—'}
              </span>
              <span className="text-2xs text-tertiary">
                Estimated pricing assumption improvement
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Competitive Context ───────────────────────────── */}
      <div>
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Competitive Context</h3>
        </div>
        <FundingComparison />
      </div>

      {/* ── Section 5: How Rewards Are Funded (collapsible) ──────────── */}
      <div id="yield-mechanics">
        <button
          onClick={() => setShowYieldMechanics((v) => !v)}
          className="flex items-center gap-2 w-full text-left py-2 group"
        >
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider group-hover:text-accent transition-colors">
            How Rewards Are Funded
          </h3>
          {showYieldMechanics ? (
            <ChevronUp size={14} className="text-tertiary" />
          ) : (
            <ChevronDown size={14} className="text-tertiary" />
          )}
          {!showYieldMechanics && (
            <span className="text-2xs text-tertiary ml-1">T-bill yield mechanics, value multiplier, growth projections</span>
          )}
        </button>

        {showYieldMechanics && (
          <div className="flex flex-col gap-4 mt-1">
            {/* Multiplier Effect */}
            <div id="multiplier-effect">
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">The Multiplier Effect</h4>
                <p className="text-2xs text-tertiary mt-0.5">How $1 becomes ${ts.valueMultiplier.toFixed(2)}+</p>
              </div>
              <MultiplierSources />

              <div id="value-multiplier" className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div id="sankey" className="card">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="metric-label">Value Flow</span>
                    <InfoTooltip content="How $1.00 of budget flows through the protocol and becomes $1.50+ of user value." />
                  </div>
                  <SankeyDiagram
                    budget={ts.totalBudget}
                    yield_={ts.yieldGenerated}
                    buyingPower={ts.totalBudget * (ts.valueMultiplier - 1) - ts.yieldGenerated}
                    totalValue={ts.totalBudget * ts.valueMultiplier}
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

            {/* Yield Engine */}
            <div id="yield-engine">
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">The Yield Engine</h4>
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

            {/* Behavioral Economics */}
            <div id="behavioral-economics" className="card">
              <span className="metric-label block mb-2">Reward Type Impact</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        )}
      </div>

      {/* ── Section 6: Treasury Operations (collapsible) ─────────────── */}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
