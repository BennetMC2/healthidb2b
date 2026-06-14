import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  PieChart,
  Sliders,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Pin,
  Eye,
  EyeOff,
  ArrowUpDown,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { getPartnerPortfolio } from '@/data/partnerPortfolios';
import { formatCurrencyCompact, formatCurrency, formatNumber } from '@/utils/format';
import { USE_CASE_LABELS } from '@/utils/constants';
import { WEIGHT_LABELS, VERIFICATION_GRADE_LABELS } from '@/types/portfolio';
import type { ObjectiveWeights, AllocationLine, LineStatus } from '@/types/portfolio';
import SectionHeader from '@/components/ui/SectionHeader';
import { MetricBadge, UseCaseBadge } from '@/components/ui/Badge';

// ── Weight Slider ────────────────────────────────────────────────────

function WeightSlider({
  label,
  weightKey,
  value,
  onChange,
}: {
  label: string;
  weightKey: keyof ObjectiveWeights;
  value: number;
  onChange: (key: keyof ObjectiveWeights, value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-[120px] text-xs text-secondary truncate">{label}</label>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(weightKey, Number(e.target.value) / 100)}
        className="flex-1 h-1.5 appearance-none rounded-full bg-elevated cursor-pointer accent-accent"
      />
      <span className="w-[38px] text-right font-mono text-xs text-tertiary">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ── Portfolio Summary Tile ───────────────────────────────────────────

function SummaryTile({
  label,
  value,
  subValue,
  variant = 'default',
}: {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning';
}) {
  const valueColor = {
    default: 'text-primary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
  }[variant];

  return (
    <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
      <div className="text-2xs text-tertiary uppercase tracking-wider">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold ${valueColor}`}>{value}</div>
      {subValue && <div className="mt-0.5 text-2xs text-tertiary">{subValue}</div>}
    </div>
  );
}

// ── Confidence indicator ─────────────────────────────────────────────

function ConfidenceDot({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cls = {
    high: 'bg-success',
    medium: 'bg-warning',
    low: 'bg-tertiary',
  }[confidence];
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

// ── Line detail slide-over ───────────────────────────────────────────

function LineDetailPanel({
  line,
  onClose,
  onPin,
  onToggleStatus,
}: {
  line: AllocationLine;
  onClose: () => void;
  onPin: (lineId: string, hp: number | null) => void;
  onToggleStatus: (lineId: string, status: LineStatus) => void;
}) {
  const pools = [
    { label: 'Claims reduction', value: line.value.claims, color: 'text-accent' },
    { label: 'Mortality margin', value: line.value.mortality, color: 'text-primary' },
    { label: 'Retention', value: line.value.retention, color: 'text-success' },
    { label: 'Acquisition', value: line.value.acquisition, color: 'text-info' },
    { label: 'Data fidelity', value: line.value.fidelity, color: 'text-warning' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-primary/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface border-l border-border shadow-xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-primary">{line.name}</h3>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <MetricBadge metric={line.signal} />
              <UseCaseBadge useCase={line.useCase} />
            </div>
          </div>
          <button onClick={onClose} className="text-tertiary hover:text-secondary p-1 rounded hover:bg-hover">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Status + actions */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
              line.status === 'included' ? 'bg-success/10 text-success border-success/20' :
              line.status === 'pinned' ? 'bg-accent/10 text-accent border-accent/20' :
              'bg-hover text-tertiary border-border'
            }`}>
              {line.status === 'included' && <Check size={12} />}
              {line.status === 'pinned' && <Pin size={12} />}
              {line.status === 'excluded' && <EyeOff size={12} />}
              {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
            </span>
            <div className="flex-1" />
            {line.status !== 'excluded' && (
              <button
                onClick={() => onToggleStatus(line.id, 'excluded')}
                className="text-xs text-tertiary hover:text-error flex items-center gap-1"
              >
                <EyeOff size={12} /> Exclude
              </button>
            )}
            {line.status === 'excluded' && (
              <button
                onClick={() => onToggleStatus(line.id, 'included')}
                className="text-xs text-tertiary hover:text-success flex items-center gap-1"
              >
                <Eye size={12} /> Include
              </button>
            )}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2">
              <div className="text-2xs text-tertiary">Derived reward</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-primary">
                {line.derivedRewardHp} HP
              </div>
              <div className="text-2xs text-tertiary">${line.derivedRewardUsd}/verification</div>
            </div>
            <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2">
              <div className="text-2xs text-tertiary">Line ROI</div>
              <div className={`mt-0.5 font-mono text-sm font-semibold ${line.roi >= 1 ? 'text-success' : 'text-warning'}`}>
                {line.roi.toFixed(1)}x
              </div>
            </div>
            <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2">
              <div className="text-2xs text-tertiary">Budget allocated</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-primary">
                {formatCurrencyCompact(line.budgetAllocated)}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2">
              <div className="text-2xs text-tertiary">Cohort size</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-primary">
                {formatNumber(line.cohortSize)}
              </div>
              <div className="text-2xs text-tertiary">{line.cohort}</div>
            </div>
          </div>

          {/* Pool breakdown */}
          <div>
            <div className="text-xs font-medium text-secondary mb-2">Value by pool</div>
            <div className="space-y-1.5">
              {pools.map((pool) => {
                const pct = line.value.total > 0 ? (pool.value / line.value.total) * 100 : 0;
                return (
                  <div key={pool.label} className="flex items-center gap-2">
                    <span className="w-[110px] text-2xs text-tertiary truncate">{pool.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-[60px] text-right font-mono text-2xs text-secondary">
                      {formatCurrencyCompact(pool.value)}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <span className="w-[110px] text-2xs font-medium text-primary">Total</span>
                <div className="flex-1" />
                <span className="w-[60px] text-right font-mono text-2xs font-semibold text-primary">
                  {formatCurrencyCompact(line.value.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Detail rows */}
          <div className="space-y-2">
            <DetailRow label="Verification grade" value={VERIFICATION_GRADE_LABELS[line.verificationGrade]} />
            <DetailRow label="Confidence" value={`${(line.confidenceScore * 100).toFixed(0)}%`} badge={line.confidence} />
            <DetailRow label="Payback" value={`${line.paybackMonths} months`} />
            <DetailRow label="Morbidity shift" value={`${line.morbidityShiftBps} bps`} />
            <DetailRow label="Expected verified" value={formatNumber(line.expectedVerifiedLives)} />
            <DetailRow label="Holdout" value={`${line.holdoutPct}%`} />
          </div>

          {/* Evidence note */}
          <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2.5">
            <div className="text-2xs text-tertiary mb-1">Evidence note</div>
            <div className="text-xs text-secondary leading-relaxed">{line.evidenceNote}</div>
          </div>

          {/* Cross-play */}
          {(line.enables.length > 0 || line.enabledBy.length > 0) && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5">
              <div className="text-2xs text-accent font-medium mb-1">Cross-play attribution</div>
              {line.enables.length > 0 && (
                <div className="text-xs text-secondary">
                  Enables {line.enables.length} downstream {line.enables.length === 1 ? 'line' : 'lines'} via verification-grade uplift
                </div>
              )}
              {line.enabledBy.length > 0 && (
                <div className="text-xs text-secondary">Enabled by fidelity play</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, badge }: { label: string; value: string; badge?: 'high' | 'medium' | 'low' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-tertiary">{label}</span>
      <div className="flex items-center gap-1.5">
        {badge && <ConfidenceDot confidence={badge} />}
        <span className="font-mono text-xs text-secondary">{value}</span>
      </div>
    </div>
  );
}

// ── Sort helpers ─────────────────────────────────────────────────────

type SortKey = 'name' | 'weightedValue' | 'roi' | 'budgetAllocated' | 'confidence' | 'status';

function sortLines(lines: AllocationLine[], sortKey: SortKey, sortAsc: boolean): AllocationLine[] {
  const sorted = [...lines].sort((a, b) => {
    switch (sortKey) {
      case 'name': return a.name.localeCompare(b.name);
      case 'weightedValue': return a.weightedValue - b.weightedValue;
      case 'roi': return a.roi - b.roi;
      case 'budgetAllocated': return a.budgetAllocated - b.budgetAllocated;
      case 'confidence': return a.confidenceScore - b.confidenceScore;
      case 'status': {
        const order = { pinned: 0, included: 1, excluded: 2 };
        return order[a.status] - order[b.status];
      }
    }
  });
  return sortAsc ? sorted : sorted.reverse();
}

// ── Main page ────────────────────────────────────────────────────────

export default function Allocator() {
  const partner = usePartnerStore((s) => s.currentPartner);
  const portfolio = getPartnerPortfolio(partner.id);
  const { allocation, initialize, setSingleWeight, setBudget, setRoiFloor, pinLine, setLineStatus, commitAllocation } = usePortfolioStore();

  const [sortKey, setSortKey] = useState<SortKey>('weightedValue');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [showFrontier, setShowFrontier] = useState(true);

  // Initialize on mount
  useEffect(() => {
    if (!allocation) {
      initialize(partner.id, partner.label, portfolio.lives);
    }
  }, [allocation, initialize, partner.id, partner.label, portfolio.lives]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }, [sortKey, sortAsc]);

  const sortedLines = useMemo(() => {
    if (!allocation) return [];
    return sortLines(allocation.lines, sortKey, sortAsc);
  }, [allocation, sortKey, sortAsc]);

  const selectedLine = useMemo(() => {
    if (!selectedLineId || !allocation) return null;
    return allocation.lines.find((l) => l.id === selectedLineId) ?? null;
  }, [selectedLineId, allocation]);

  const frontierData = useMemo(() => {
    if (!allocation) return [];
    return allocation.frontier.map((p) => ({
      spend: p.budgetSpend,
      value: p.portfolioValue,
      roi: p.roi,
      lines: p.lineCount,
    }));
  }, [allocation]);

  if (!allocation) {
    return (
      <div className="flex items-center justify-center h-64 text-tertiary">
        Initializing portfolio solver...
      </div>
    );
  }

  const isCommitted = allocation.status === 'committed';

  return (
    <div className="space-y-5">
      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="card border-t-2 border-t-accent">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
              <PieChart size={20} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.18em] text-accent">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                Portfolio Allocator · {partner.label}
              </div>
              <h1 className="mt-1 text-xl font-semibold text-primary font-display">
                Incentive budget allocation
              </h1>
              <p className="mt-1 text-sm text-secondary max-w-xl">
                Allocate your incentive budget across {formatNumber(portfolio.lives)} addressable lives.
                Drag the objective weights to re-solve the portfolio in real time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCommitted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                <Lock size={13} />
                Committed
              </span>
            ) : (
              <button
                onClick={() => commitAllocation()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                <Check size={14} />
                Commit allocation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Objective weight panel ──────────────────────────────────── */}
      <div className="card">
        <SectionHeader
          title="Objective weights"
          description="Steer the portfolio by adjusting how the solver values each outcome pool."
          icon={<Sliders size={16} />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 mt-3">
          {(Object.entries(WEIGHT_LABELS) as [keyof ObjectiveWeights, string][]).map(([key, label]) => (
            <WeightSlider
              key={key}
              label={label}
              weightKey={key}
              value={allocation.weights[key]}
              onChange={setSingleWeight}
            />
          ))}
        </div>

        {/* Budget + ROI floor inline controls */}
        <div className="flex flex-wrap items-end gap-4 mt-4 pt-3 border-t border-border">
          <div>
            <label className="text-2xs text-tertiary uppercase tracking-wider">Budget envelope</label>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-xs text-tertiary">$</span>
              <input
                type="number"
                value={allocation.constraints.budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                step={10000}
                min={10000}
                className="w-[100px] rounded border border-border bg-elevated px-2 py-1 font-mono text-sm text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-2xs text-tertiary uppercase tracking-wider">ROI floor</label>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                value={allocation.constraints.roiFloor}
                onChange={(e) => setRoiFloor(Number(e.target.value))}
                step={0.1}
                min={0}
                className="w-[60px] rounded border border-border bg-elevated px-2 py-1 font-mono text-sm text-primary focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-tertiary">x minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Portfolio summary band ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryTile
          label="Total value"
          value={formatCurrencyCompact(allocation.totalValue.total)}
          variant="accent"
        />
        <SummaryTile
          label="Budget used"
          value={formatCurrencyCompact(allocation.totalBudget)}
          subValue={`of ${formatCurrencyCompact(allocation.constraints.budget)}`}
        />
        <SummaryTile
          label="Portfolio ROI"
          value={`${allocation.portfolioRoi.toFixed(1)}x`}
          variant={allocation.portfolioRoi >= allocation.constraints.roiFloor ? 'success' : 'warning'}
        />
        <SummaryTile
          label="Lines included"
          value={`${allocation.includedLineCount}`}
          subValue={`of ${allocation.lines.length} candidates`}
        />
        <SummaryTile
          label="Addressable lives"
          value={formatNumber(allocation.addressableLives)}
        />
        <SummaryTile
          label="Confidence"
          value={`${Math.round(allocation.weightedConfidence * 100)}%`}
          variant={allocation.weightedConfidence >= 0.6 ? 'success' : allocation.weightedConfidence >= 0.4 ? 'warning' : 'default'}
        />
      </div>

      {/* ── Allocation table ────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <SectionHeader
          title="Allocation lines"
          description={`${allocation.includedLineCount} lines included in the current allocation.`}
          icon={<Target size={16} />}
        />

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <SortHeader label="Play" sortKey="name" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Weighted value" sortKey="weightedValue" current={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <SortHeader label="ROI" sortKey="roi" current={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <SortHeader label="Budget" sortKey="budgetAllocated" current={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <SortHeader label="Confidence" sortKey="confidence" current={sortKey} asc={sortAsc} onSort={handleSort} className="text-center" />
                <SortHeader label="Status" sortKey="status" current={sortKey} asc={sortAsc} onSort={handleSort} className="text-center" />
              </tr>
            </thead>
            <tbody>
              {sortedLines.map((line) => (
                <tr
                  key={line.id}
                  onClick={() => setSelectedLineId(line.id)}
                  className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-hover/50 ${
                    line.status === 'excluded' ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-primary">{line.name}</span>
                      <div className="flex items-center gap-1.5">
                        <MetricBadge metric={line.signal} />
                        <span className="text-2xs text-tertiary">{line.cohort}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm text-primary">
                    {formatCurrencyCompact(line.weightedValue)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono text-sm ${line.roi >= 1 ? 'text-success' : 'text-warning'}`}>
                    {line.roi.toFixed(1)}x
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-sm text-secondary">
                    {line.budgetAllocated > 0 ? formatCurrencyCompact(line.budgetAllocated) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ConfidenceDot confidence={line.confidence} />
                      <span className="text-2xs text-tertiary hidden sm:inline">
                        {line.confidence === 'high' ? 'High' : line.confidence === 'medium' ? 'Med' : 'Low'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${
                      line.status === 'included' ? 'bg-success/10 text-success' :
                      line.status === 'pinned' ? 'bg-accent/10 text-accent' :
                      'bg-hover text-tertiary'
                    }`}>
                      {line.status === 'included' && <Check size={10} />}
                      {line.status === 'pinned' && <Pin size={10} />}
                      {line.status === 'excluded' && <EyeOff size={10} />}
                      {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Efficient frontier chart ────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader
            title="Efficient frontier"
            description="Budget spend vs portfolio value across weight profiles. Your current allocation is marked."
            icon={<TrendingUp size={16} />}
            className="mb-0"
          />
          <button
            onClick={() => setShowFrontier(!showFrontier)}
            className="text-xs text-tertiary hover:text-secondary flex items-center gap-1"
          >
            {showFrontier ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showFrontier ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showFrontier && frontierData.length > 0 && (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 20, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--n-border))" />
                <XAxis
                  type="number"
                  dataKey="spend"
                  name="Budget spend"
                  tick={{ fontSize: 11, fill: 'rgb(var(--n-tertiary))' }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                  label={{ value: 'Budget spend', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'rgb(var(--n-tertiary))' }}
                />
                <YAxis
                  type="number"
                  dataKey="value"
                  name="Portfolio value"
                  tick={{ fontSize: 11, fill: 'rgb(var(--n-tertiary))' }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                  label={{ value: 'Portfolio value', angle: -90, position: 'insideLeft', offset: 16, fontSize: 10, fill: 'rgb(var(--n-tertiary))' }}
                />
                {/* Current allocation reference */}
                <ReferenceLine
                  x={allocation.totalBudget}
                  stroke="rgb(var(--a-accent))"
                  strokeDasharray="6 4"
                  strokeOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--n-surface))',
                    borderColor: 'rgb(var(--n-border))',
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 12px 24px rgba(15,23,42,0.06)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Budget spend') return [formatCurrency(value), name];
                    return [formatCurrency(value), name];
                  }}
                />
                <Scatter data={frontierData} fill="rgb(var(--a-accent))">
                  {frontierData.map((entry, idx) => {
                    const isCurrent = Math.abs(entry.spend - allocation.totalBudget) < 5000;
                    return (
                      <Cell
                        key={idx}
                        fill={isCurrent ? 'rgb(var(--a-accent))' : 'rgb(var(--n-tertiary))'}
                        r={isCurrent ? 7 : 4}
                        strokeWidth={isCurrent ? 2 : 0}
                        stroke="rgb(var(--n-surface))"
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Pool breakdown ──────────────────────────────────────────── */}
      <div className="card">
        <SectionHeader
          title="Value by pool"
          description="How the portfolio's total value breaks down across outcome pools."
          icon={<Sparkles size={16} />}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
          {([
            { key: 'claims' as const, label: 'Claims reduction' },
            { key: 'mortality' as const, label: 'Mortality margin' },
            { key: 'retention' as const, label: 'Retention' },
            { key: 'acquisition' as const, label: 'Acquisition' },
            { key: 'fidelity' as const, label: 'Data fidelity' },
          ]).map(({ key, label }) => {
            const val = allocation.totalValue[key];
            const pct = allocation.totalValue.total > 0 ? (val / allocation.totalValue.total) * 100 : 0;
            return (
              <div key={key} className="rounded-lg border border-border bg-surface/70 px-3 py-2.5">
                <div className="text-2xs text-tertiary">{label}</div>
                <div className="mt-1 font-mono text-lg font-semibold text-primary">
                  {formatCurrencyCompact(val)}
                </div>
                <div className="mt-1 h-1 rounded-full bg-elevated overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-0.5 text-2xs text-tertiary">{pct.toFixed(0)}% of total</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Line detail slide-over ──────────────────────────────────── */}
      {selectedLine && (
        <LineDetailPanel
          line={selectedLine}
          onClose={() => setSelectedLineId(null)}
          onPin={pinLine}
          onToggleStatus={setLineStatus}
        />
      )}
    </div>
  );
}

// ── Table sort header ────────────────────────────────────────────────

function SortHeader({
  label,
  sortKey: key,
  current,
  asc,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = current === key;
  return (
    <th
      onClick={() => onSort(key)}
      className={`px-3 py-2 text-2xs font-medium text-tertiary uppercase tracking-wider cursor-pointer hover:text-secondary select-none ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          asc ? <ChevronUp size={10} /> : <ChevronDown size={10} />
        ) : (
          <ArrowUpDown size={10} className="opacity-30" />
        )}
      </span>
    </th>
  );
}

