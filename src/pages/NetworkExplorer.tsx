import { useState, useMemo } from 'react';
import { Globe, Users, Activity, Database } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import DataTable from '@/components/ui/DataTable';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { ReputationBadge } from '@/components/ui/Badge';
import { identities } from '@/data';
import { formatNumber, formatCompact } from '@/utils/format';
import {
  DATA_SOURCE_LABELS,
  REPUTATION_TIER_ORDER,
  REPUTATION_TIER_LABELS,
  REPUTATION_TIER_COLORS,
  AGE_RANGES,
} from '@/utils/constants';
import { useDemoStore } from '@/stores/useDemoStore';
import type { HealthIdentity, ReputationTier, DataSource, FilterState } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const defaultFilters: FilterState = {
  healthScoreRange: [0, 100],
  reputationTiers: [],
  dataSources: [],
  ageRanges: [],
  genders: [],
};

const presets = [
  { label: 'High-Value Cohort', filters: { healthScoreRange: [75, 100] as [number, number], reputationTiers: ['diamond', 'platinum', 'gold'] as ReputationTier[], dataSources: [], ageRanges: [], genders: [] } },
  { label: 'Wearable-Verified', filters: { healthScoreRange: [0, 100] as [number, number], reputationTiers: [], dataSources: ['apple_health', 'fitbit', 'garmin', 'oura', 'whoop'] as DataSource[], ageRanges: [], genders: [] } },
  { label: 'Lab-Confirmed', filters: { healthScoreRange: [0, 100] as [number, number], reputationTiers: [], dataSources: ['lab_results'] as DataSource[], ageRanges: [], genders: [] } },
];

export default function NetworkExplorer() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);
  const demoActive = useDemoStore((s) => s.isActive);
  const notifyUserAction = useDemoStore((s) => s.notifyUserAction);

  const filtered = useMemo(() => {
    return identities.filter((id) => {
      if (id.healthScore < filters.healthScoreRange[0] || id.healthScore > filters.healthScoreRange[1]) return false;
      if (filters.reputationTiers.length > 0 && !filters.reputationTiers.includes(id.reputationTier)) return false;
      if (filters.dataSources.length > 0 && !filters.dataSources.some((ds) => id.connectedSources.includes(ds))) return false;
      if (filters.ageRanges.length > 0 && !filters.ageRanges.includes(id.demographics.ageRange)) return false;
      if (filters.genders.length > 0 && !filters.genders.includes(id.demographics.gender)) return false;
      return true;
    });
  }, [filters]);

  // Compute distributions
  const tierDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    REPUTATION_TIER_ORDER.forEach((t) => (counts[t] = 0));
    filtered.forEach((id) => counts[id.reputationTier]++);
    return REPUTATION_TIER_ORDER.map((t) => ({ tier: t, count: counts[t], pct: counts[t] / Math.max(filtered.length, 1) }));
  }, [filtered]);

  const scoreDistribution = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${i * 10 + 9}`,
      min: i * 10,
      max: i * 10 + 9,
      count: 0,
    }));
    filtered.forEach((id) => {
      const idx = Math.min(Math.floor(id.healthScore / 10), 9);
      buckets[idx].count++;
    });
    return buckets;
  }, [filtered]);

  const sourceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(DATA_SOURCE_LABELS).forEach((k) => (counts[k] = 0));
    filtered.forEach((id) => id.connectedSources.forEach((s) => counts[s]++));
    return Object.entries(counts)
      .map(([source, count]) => ({ source: source as DataSource, count, pct: count / Math.max(filtered.length, 1) }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const maxScoreCount = Math.max(...scoreDistribution.map((b) => b.count), 1);

  const columns: ColumnDef<HealthIdentity, unknown>[] = [
    { accessorKey: 'anonymizedId', header: 'Identity', cell: ({ getValue }) => <span className="font-mono text-xs text-accent/80">{getValue<string>()}</span> },
    { accessorKey: 'healthScore', header: 'Health Score', cell: ({ getValue }) => {
      const v = getValue<number>();
      const color = v >= 80 ? 'text-health-excellent' : v >= 60 ? 'text-health-good' : v >= 40 ? 'text-health-moderate' : 'text-health-poor';
      return <span className={`font-mono text-sm ${color}`}>{v}</span>;
    }},
    { accessorKey: 'reputationTier', header: 'Reputation', cell: ({ getValue }) => <ReputationBadge tier={getValue<ReputationTier>()} /> },
    { accessorKey: 'connectedSources', header: 'Sources', cell: ({ getValue }) => <span className="text-xs text-secondary">{getValue<DataSource[]>().length}</span> },
    { accessorKey: 'verificationCount', header: 'Verifications', cell: ({ getValue }) => <span className="font-mono text-xs text-secondary">{getValue<number>()}</span> },
    { accessorKey: 'demographics', header: 'Age', cell: ({ getValue }) => <span className="text-xs text-tertiary">{getValue<HealthIdentity['demographics']>().ageRange}</span> },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Section Header */}
      <SectionHeader title="Open Pool" description="Anonymized health identities reachable through the protocol. No personal data is stored or transmitted." icon={<Globe size={16} />} />

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-3" data-tour="explorer-metrics">
        <MetricCard
          label="Reachable Identities"
          value={formatCompact(filtered.length)}
          subValue={`of ${formatCompact(identities.length)}`}
          icon={<Globe size={14} />}
        />
        <MetricCard
          label="Avg Health Score"
          value={(filtered.reduce((s, i) => s + i.healthScore, 0) / Math.max(filtered.length, 1)).toFixed(1)}
          icon={<Activity size={14} />}
        />
        <MetricCard
          label="Verified Identities"
          value={formatNumber(filtered.filter((i) => i.verificationCount > 0).length)}
          subValue={`${((filtered.filter((i) => i.verificationCount > 0).length / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`}
          icon={<Users size={14} />}
        />
        <MetricCard
          label="Data Sources Connected"
          value={formatNumber(filtered.reduce((s, i) => s + i.connectedSources.length, 0))}
          icon={<Database size={14} />}
        />
      </div>

      {/* Presets + filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-ghost text-xs"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <div className="h-3 w-px bg-border" />
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setFilters(p.filters);
              if (demoActive) notifyUserAction();
            }}
            className="btn-ghost text-2xs"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setFilters(defaultFilters)}
          className="btn-ghost text-2xs text-tertiary"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-[220px] flex-shrink-0 card overflow-auto scrollbar-thin space-y-4" data-tour="explorer-filters">
            <div className="text-xs text-tertiary mb-2">Narrow the pool to target specific cohorts for campaigns.</div>
            {/* Health Score Range */}
            <div>
              <label className="metric-label block mb-1.5">Health Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.healthScoreRange[0]}
                  onChange={(e) => setFilters({ ...filters, healthScoreRange: [+e.target.value, filters.healthScoreRange[1]] })}
                  className="input-field w-16 text-xs font-mono"
                />
                <span className="text-tertiary text-xs">—</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.healthScoreRange[1]}
                  onChange={(e) => setFilters({ ...filters, healthScoreRange: [filters.healthScoreRange[0], +e.target.value] })}
                  className="input-field w-16 text-xs font-mono"
                />
              </div>
            </div>

            {/* Reputation Tiers */}
            <div>
              <label className="metric-label block mb-1.5">Reputation Tier</label>
              <div className="space-y-1">
                {REPUTATION_TIER_ORDER.map((tier) => (
                  <label key={tier} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.reputationTiers.includes(tier)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...filters.reputationTiers, tier]
                          : filters.reputationTiers.filter((t) => t !== tier);
                        setFilters({ ...filters, reputationTiers: next });
                      }}
                      className="accent-accent"
                    />
                    <span className="text-xs text-secondary">{REPUTATION_TIER_LABELS[tier]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <label className="metric-label block mb-1.5">Data Sources</label>
              <div className="space-y-1">
                {(Object.entries(DATA_SOURCE_LABELS) as [DataSource, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.dataSources.includes(key)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...filters.dataSources, key]
                          : filters.dataSources.filter((d) => d !== key);
                        setFilters({ ...filters, dataSources: next });
                      }}
                      className="accent-accent"
                    />
                    <span className="text-xs text-secondary">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Ranges */}
            <div>
              <label className="metric-label block mb-1.5">Age Range</label>
              <div className="space-y-1">
                {AGE_RANGES.map((range) => (
                  <label key={range} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.ageRanges.includes(range)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...filters.ageRanges, range]
                          : filters.ageRanges.filter((r) => r !== range);
                        setFilters({ ...filters, ageRanges: next });
                      }}
                      className="accent-accent"
                    />
                    <span className="text-xs text-secondary">{range}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="metric-label block mb-1.5">Gender</label>
              <div className="space-y-1">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.genders.includes(g)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...filters.genders, g]
                          : filters.genders.filter((x) => x !== g);
                        setFilters({ ...filters, genders: next });
                      }}
                      className="accent-accent"
                    />
                    <span className="text-xs text-secondary capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Health Score Distribution */}
            <div className="card col-span-1">
              <div className="flex items-center gap-1.5 mb-2"><span className="metric-label">Health Score Distribution</span><InfoTooltip content="Composite score (0–100) derived from verified wearable and clinical data sources. Higher scores indicate more consistent health tracking." /></div>
              <div className="flex items-end gap-[2px] h-[100px]">
                {scoreDistribution.map((b) => (
                  <div key={b.range} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-accent/30 hover:bg-accent/50 rounded-t-sm transition-colors"
                      style={{ height: `${(b.count / maxScoreCount) * 100}%`, minHeight: b.count > 0 ? '2px' : '0' }}
                    />
                    <span className="text-2xs text-tertiary font-mono">{b.min}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reputation Breakdown */}
            <div className="card col-span-1">
              <div className="flex items-center gap-1.5 mb-2"><span className="metric-label">Reputation Tiers</span><InfoTooltip content="Data trustworthiness rating based on source quality and verification history. Diamond = highest biological proof density." /></div>
              <div className="space-y-1.5">
                {tierDistribution.map((t) => (
                  <div key={t.tier} className="flex items-center gap-2">
                    <span className="text-2xs text-secondary w-16 truncate">{REPUTATION_TIER_LABELS[t.tier]}</span>
                    <div className="flex-1 h-[14px] bg-base rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          width: `${t.pct * 100}%`,
                          backgroundColor: REPUTATION_TIER_COLORS[t.tier],
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span className="text-2xs font-mono text-tertiary w-10 text-right">
                      {(t.pct * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Source Penetration */}
            <div className="card col-span-1">
              <div className="flex items-center gap-1.5 mb-2"><span className="metric-label">Source Penetration</span><InfoTooltip content="Which wearable devices and clinical sources identities have connected. More sources = richer verification capability." /></div>
              <div className="space-y-1.5">
                {sourceDistribution.slice(0, 6).map((s) => (
                  <div key={s.source} className="flex items-center gap-2">
                    <span className="text-2xs text-secondary w-20 truncate">{DATA_SOURCE_LABELS[s.source]}</span>
                    <div className="flex-1 h-[14px] bg-base rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-accent/40 rounded-sm transition-all duration-300"
                        style={{ width: `${s.pct * 100}%` }}
                      />
                    </div>
                    <span className="text-2xs font-mono text-tertiary w-10 text-right">
                      {(s.pct * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Identity Table */}
          <div className="card flex-1 min-h-0 p-0 overflow-hidden">
            <DataTable data={filtered} columns={columns} pageSize={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
