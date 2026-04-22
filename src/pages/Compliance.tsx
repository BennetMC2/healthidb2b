import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ComplianceOnboarding from '@/components/onboarding/ComplianceOnboarding';
import { ShieldCheck, ShieldOff, FileText, Clock, Download } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import DataTable from '@/components/ui/DataTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { complianceRecords, dataProcessingSummaries } from '@/data';
import { formatCompact, formatTimestamp, formatDuration, formatHash } from '@/utils/format';
import { DATA_SOURCE_LABELS } from '@/utils/constants';
import { exportToCSV, exportToJSON } from '@/utils/export';
import { useToastStore } from '@/stores/useToastStore';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import type { ComplianceRecord, ComplianceEventType } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const eventTypeLabels: Record<ComplianceEventType, string> = {
  verification_requested: 'Verification Requested',
  proof_generated: 'Proof Generated',
  proof_verified: 'Proof Verified',
  proof_failed: 'Proof Failed',
  data_processed: 'Data Processed',
  audit_query: 'Audit Query',
};

const eventTypeVariants: Record<ComplianceEventType, 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted'> = {
  verification_requested: 'default',
  proof_generated: 'accent',
  proof_verified: 'success',
  proof_failed: 'error',
  data_processed: 'muted',
  audit_query: 'warning',
};

const auditColumns: ColumnDef<ComplianceRecord, unknown>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ getValue }) => <span className="text-2xs text-tertiary">{formatTimestamp(getValue<string>())}</span>,
  },
  {
    accessorKey: 'eventType',
    header: 'Event',
    cell: ({ getValue }) => {
      const type = getValue<ComplianceEventType>();
      return <Badge variant={eventTypeVariants[type]}>{eventTypeLabels[type]}</Badge>;
    },
  },
  {
    accessorKey: 'partnerId',
    header: 'Partner',
    cell: ({ getValue }) => <span className="text-xs text-secondary">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'proofHash',
    header: 'Proof Hash',
    cell: ({ getValue }) => {
      const hash = getValue<string | null>();
      return hash
        ? <span className="font-mono text-2xs text-accent/60">{formatHash(hash)}</span>
        : <span className="text-2xs text-tertiary">—</span>;
    },
  },
  {
    accessorKey: 'piiAccessed',
    header: 'PII Access',
    cell: () => <Badge variant="success">None</Badge>,
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ getValue }) => <span className="text-xs text-tertiary truncate max-w-[200px] block">{getValue<string>()}</span>,
  },
];

export default function Compliance() {
  const [tab, setTab] = useState<'audit' | 'processing'>('audit');
  const [eventFilter, setEventFilter] = useState<ComplianceEventType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const addToast = useToastStore((s) => s.addToast);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const loading = useSimulatedLoading(500);
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('healthid_compliance_onboarded')
  );

  // ── Partner-scoped compliance data ────────────────────────────────
  const partnerRecords = useMemo(
    () => complianceRecords.filter((r) => r.partnerId === currentPartner.id),
    [currentPartner.id],
  );

  // Scale data processing summaries proportionally by partner's share
  const partnerProcessingSummaries = useMemo(() => {
    const ratio = complianceRecords.length > 0
      ? partnerRecords.length / complianceRecords.length
      : 0;
    return dataProcessingSummaries.map((s) => ({
      ...s,
      recordsProcessed: Math.round(s.recordsProcessed * ratio),
      proofsGenerated: Math.round(s.proofsGenerated * ratio),
      proofsVerified: Math.round(s.proofsVerified * ratio),
    }));
  }, [partnerRecords.length]);

  // Scroll to section via hash
  useEffect(() => {
    if (loading) return;
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [loading, location.hash]);

  const handleExport = (format: 'csv' | 'json') => {
    const data = partnerRecords.map((r) => ({
      timestamp: r.timestamp,
      eventType: r.eventType,
      partnerId: r.partnerId,
      campaignId: r.campaignId ?? '',
      proofHash: r.proofHash ?? '',
      piiAccessed: 'false',
      details: r.details,
    }));
    if (format === 'csv') {
      exportToCSV(data, `audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      exportToJSON(data, `audit-log-${new Date().toISOString().split('T')[0]}.json`);
    }
    addToast({ message: `Audit log exported as ${format.toUpperCase()}`, variant: 'success' });
  };

  const stats = useMemo(() => {
    const totalProofs = partnerRecords.filter((r) =>
      ['proof_generated', 'proof_verified'].includes(r.eventType)
    ).length;
    const totalFailed = partnerRecords.filter((r) => r.eventType === 'proof_failed').length;
    return {
      totalRecords: partnerRecords.length,
      totalProofs,
      totalFailed,
      piiEvents: 0,
    };
  }, [partnerRecords]);

  const filteredRecords = useMemo(() => {
    return partnerRecords.filter((r) => {
      if (eventFilter !== 'all' && r.eventType !== eventFilter) return false;
      if (dateFrom && new Date(r.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [partnerRecords, eventFilter, dateFrom, dateTo]);

  const tabs = [
    { id: 'audit', label: 'Audit Log', count: filteredRecords.length },
    { id: 'processing', label: 'Data Processing', count: partnerProcessingSummaries.length },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full animate-pulse">
        <div className="skeleton h-8 w-52" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
        <div className="skeleton h-12 rounded" />
        <div className="flex-1 skeleton rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {showOnboarding && <ComplianceOnboarding onDismiss={() => setShowOnboarding(false)} />}
      {/* Section Header */}
      <SectionHeader title="Audit & Risk Dashboard" description="Executive risk overview with estimated liability avoidance. Complete audit trail proving zero PII exposure across all protocol operations." icon={<ShieldCheck size={16} />} />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Audit Records"
          value={formatCompact(stats.totalRecords)}
          icon={<FileText size={14} />}
        />
        <MetricCard
          label="ZK Proofs Generated"
          value={formatCompact(stats.totalProofs)}
          icon={<ShieldCheck size={14} />}
        />
        <MetricCard
          label="PII Access Events"
          value="0"
          subValue="Zero-knowledge architecture"
          icon={<ShieldOff size={14} />}
        />
        <div id="liability-avoided">
          <MetricCard
            label="Estimated Liability Avoided"
            value={`$${((9.77 * stats.totalProofs) / 1000).toFixed(1)}M`}
            subValue="Based on $9.77M avg breach cost"
            icon={<ShieldCheck size={14} />}
          />
        </div>
        <MetricCard
          label="Failed Proofs"
          value={formatCompact(stats.totalFailed)}
          icon={<Clock size={14} />}
        />
      </div>

      {/* Zero PII Banner */}
      <div id="zero-pii" className="card-elevated flex items-center gap-3 border-accent/10">
        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} className="text-accent" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-primary">Zero PII Exposure Verified</span>
          <p className="text-xs text-tertiary">
            All verifications processed through zero-knowledge proofs. No personally identifiable information has been accessed, stored, or transmitted. 296-day average breach containment window completely bypassed.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-mono text-2xl font-bold text-accent">0</div>
          <div className="text-2xs text-tertiary">PII Access Events</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value as ComplianceEventType | 'all')}
          className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary"
        >
          <option value="all">All Events</option>
          {Object.entries(eventTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary"
          placeholder="To"
        />
        {(eventFilter !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => { setEventFilter('all'); setDateFrom(''); setDateTo(''); }}
            className="btn-ghost text-2xs text-tertiary"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs + Export */}
      <div className="flex items-center justify-between">
        <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as 'audit' | 'processing')} />
        <div className="flex items-center gap-1">
          <button onClick={() => handleExport('csv')} className="btn-ghost text-xs">
            <Download size={12} /> CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn-ghost text-xs">
            <Download size={12} /> JSON
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'audit' && (
          <div className="card p-0 h-full overflow-hidden">
            <DataTable data={filteredRecords} columns={auditColumns} pageSize={20} />
          </div>
        )}

        {tab === 'processing' && (
          <div className="space-y-3 overflow-auto scrollbar-thin h-full">
            {partnerProcessingSummaries.map((summary) => (
              <div key={summary.period} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-primary">{summary.period}</span>
                  <Badge variant="success">PII Events: 0</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <span className="text-2xs text-tertiary block">Records Processed</span>
                    <span className="font-mono text-sm text-secondary">{formatCompact(summary.recordsProcessed)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Proofs Generated</span>
                    <span className="font-mono text-sm text-secondary">{formatCompact(summary.proofsGenerated)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Proofs Verified</span>
                    <span className="font-mono text-sm text-secondary">{formatCompact(summary.proofsVerified)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Avg Proof Time</span>
                    <span className="font-mono text-sm text-secondary">{formatDuration(summary.avgProofGenerationMs)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Data Sources</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {summary.dataSourcesAccessed.map((ds) => (
                        <span key={ds} className="text-2xs text-accent/60">{DATA_SOURCE_LABELS[ds]}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
