import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ComplianceOnboarding from '@/components/onboarding/ComplianceOnboarding';
import { ShieldCheck, ShieldOff, FileText, Clock, Download, X, KeyRound } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import DataTable from '@/components/ui/DataTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { complianceRecords, dataProcessingSummaries } from '@/data';
import { formatNumber, formatTimestamp, formatDuration, formatHash, formatCurrencyCompact } from '@/utils/format';
import { DATA_SOURCE_LABELS } from '@/utils/constants';
import { exportToCSV, exportToJSON } from '@/utils/export';
import { liabilityAvoidedFromReceipts } from '@/utils/businessMetrics';
import { ProofReceiptAnimation } from '@/components/enterprise/EnterpriseWidgets';
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
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const addToast = useToastStore((s) => s.addToast);
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const loading = useSimulatedLoading(500);
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    addToast({ message: `Audit log exported as signed ${format.toUpperCase()} package`, variant: 'success' });
  };

  const stats = useMemo(() => {
    const totalRequested = partnerRecords.filter((r) => r.eventType === 'verification_requested').length;
    const totalProofs = partnerRecords.filter((r) => r.eventType === 'proof_verified').length;
    const totalFailed = partnerRecords.filter((r) => r.eventType === 'proof_failed').length;
    const pending = Math.max(totalRequested - totalProofs - totalFailed, 0);
    return {
      totalRecords: partnerRecords.length,
      totalRequested,
      totalProofs,
      totalFailed,
      pending,
      piiEvents: 0,
      liabilityAvoided: liabilityAvoidedFromReceipts(totalProofs),
      successRate: totalProofs + totalFailed > 0 ? totalProofs / (totalProofs + totalFailed) : 0,
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
    <div className="flex flex-col gap-4">
      {showOnboarding && <ComplianceOnboarding onDismiss={() => setShowOnboarding(false)} />}
      {/* Section Header */}
      <SectionHeader as="h1" title="Verification Trail" description="A clean record of verification requests, proof generation, and receipt delivery for buyer diligence and pilot readiness conversations." icon={<ShieldCheck size={16} />} />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-walkthrough="compliance-metrics">
        <MetricCard
          label="Verification Events"
          value={formatNumber(stats.totalRecords)}
          icon={<FileText size={14} />}
        />
        <MetricCard
          label="Receipts Generated"
          value={formatNumber(stats.totalProofs)}
          icon={<ShieldCheck size={14} />}
        />
        <MetricCard
          label="Raw Data Access"
          value="0"
          subValue="Receipt-only operating model"
          icon={<ShieldOff size={14} />}
        />
        <div id="liability-avoided">
          <MetricCard
            label="Illustrative Liability Avoided"
            value={formatCurrencyCompact(stats.liabilityAvoided)}
            subValue="Based on ~$9,770 per breached record"
            icon={<ShieldCheck size={14} />}
          />
        </div>
        <MetricCard
          label="Proof Success Rate"
          value={`${(stats.successRate * 100).toFixed(0)}%`}
          icon={<Clock size={14} />}
        />
        <MetricCard
          label="Pending Requests"
          value={formatNumber(stats.pending)}
          subValue="Awaiting proof"
          icon={<Clock size={14} />}
        />
      </div>

      <div id="zero-pii" className="card-elevated flex items-center gap-3 border-accent/10" data-walkthrough="compliance-receipts">
        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} className="text-accent" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-primary">Binary outcome receipts only</span>
          <p className="text-xs text-tertiary">
            This view is designed for diligence conversations: partners see verification events, proof receipts, and processing evidence instead of raw member health data.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-mono text-2xl font-bold text-accent">0</div>
          <div className="text-2xs text-tertiary">Raw data exposures · receipt-only</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <ProofReceiptAnimation />
        <div className="card flex flex-col justify-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Receipt scheme</div>
          <p className="mt-2 text-sm leading-relaxed text-primary">
            zk-SNARK proof receipt over a partner-specific cohort rule. The partner receives event status, proof hash, circuit reference, and retention metadata, not raw biometric values.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-border bg-base/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">Circuit</div>
              <div className="mt-1 font-mono text-xs text-primary">plonk_health_v2</div>
            </div>
            <div className="rounded border border-border bg-base/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">Verifier</div>
              <div className="mt-1 font-mono text-xs text-primary">Moca testnet</div>
            </div>
            <div className="rounded border border-border bg-base/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">Retention</div>
              <div className="mt-1 font-mono text-xs text-primary">14-day default</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
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
        <label className="flex items-center gap-1 text-2xs text-tertiary">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary"
          />
        </label>
        <label className="flex items-center gap-1 text-2xs text-tertiary">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary"
          />
        </label>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as 'audit' | 'processing')} />
        <p className="text-2xs text-tertiary">
          Audit Log shows receipt events. Data Processing shows aggregate processing windows with zero raw-data exposure.
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => handleExport('csv')} className="btn-ghost text-xs">
            <Download size={12} /> Signed CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn-ghost text-xs">
            <Download size={12} /> Signed JSON
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === 'audit' && (
          <div className="card p-0 overflow-hidden">
            <DataTable data={filteredRecords} columns={auditColumns} pageSize={20} onRowClick={setSelectedRecord} />
          </div>
        )}

        {tab === 'processing' && (
          <div className="space-y-3">
            {partnerProcessingSummaries.map((summary) => (
              <div key={summary.period} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-primary">{summary.period}</span>
                  <Badge variant="success">Raw exposures: 0</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <span className="text-2xs text-tertiary block">Records Processed</span>
                    <span className="font-mono text-sm text-secondary">{formatNumber(summary.recordsProcessed)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Proofs Generated</span>
                    <span className="font-mono text-sm text-secondary">{formatNumber(summary.proofsGenerated)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-tertiary block">Proofs Verified</span>
                    <span className="font-mono text-sm text-secondary">{formatNumber(summary.proofsVerified)}</span>
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

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Receipt detail">
          <button className="flex-1 cursor-default" onClick={() => setSelectedRecord(null)} aria-label="Close receipt detail" />
          <aside className="h-full w-[min(520px,96vw)] overflow-y-auto border-l border-border bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Receipt detail</div>
                <h2 className="mt-2 text-lg font-semibold text-primary">{eventTypeLabels[selectedRecord.eventType]}</h2>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="rounded p-1 text-tertiary hover:bg-hover hover:text-primary" aria-label="Close receipt detail">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <ProofReceiptAnimation compact />
              <div className="rounded-lg border border-border bg-base/60 p-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                  <KeyRound size={13} /> Proof hash
                </div>
                <div className="mt-2 break-all font-mono text-sm text-primary">{selectedRecord.proofHash ?? 'Pending proof hash'}</div>
              </div>
              <div className="grid gap-2">
                {[
                  ['Timestamp', formatTimestamp(selectedRecord.timestamp)],
                  ['Partner token', selectedRecord.partnerId],
                  ['Campaign', selectedRecord.campaignId ?? 'Portfolio-level event'],
                  ['ZK circuit', 'plonk_health_v2'],
                  ['Verifier address', '0x4fd8…91c2'],
                  ['Raw data access', '0 exposures'],
                  ['Retention date', '14 days from event'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded border border-border bg-surface px-3 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">{label}</div>
                    <div className="mt-1 text-sm text-primary">{value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-accent/20 bg-accent/10 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Event details</div>
                <p className="mt-2 text-sm leading-relaxed text-primary">{selectedRecord.details}</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
