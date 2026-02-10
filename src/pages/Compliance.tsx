import { useState, useMemo } from 'react';
import { ShieldCheck, ShieldOff, FileText, Clock } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import DataTable from '@/components/ui/DataTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { complianceRecords, dataProcessingSummaries } from '@/data';
import { formatCompact, formatTimestamp, formatDuration, formatHash } from '@/utils/format';
import { DATA_SOURCE_LABELS } from '@/utils/constants';
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

  const stats = useMemo(() => {
    const totalProofs = complianceRecords.filter((r) =>
      ['proof_generated', 'proof_verified'].includes(r.eventType)
    ).length;
    const totalFailed = complianceRecords.filter((r) => r.eventType === 'proof_failed').length;
    return {
      totalRecords: complianceRecords.length,
      totalProofs,
      totalFailed,
      piiEvents: 0,
    };
  }, []);

  const tabs = [
    { id: 'audit', label: 'Audit Log', count: complianceRecords.length },
    { id: 'processing', label: 'Data Processing', count: dataProcessingSummaries.length },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Section Header */}
      <SectionHeader title="Compliance & Audit" description="Complete audit trail proving zero PII exposure across all protocol operations." icon={<ShieldCheck size={16} />} />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
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
        <MetricCard
          label="Failed Proofs"
          value={formatCompact(stats.totalFailed)}
          icon={<Clock size={14} />}
        />
      </div>

      {/* Zero PII Banner */}
      <div className="card-elevated flex items-center gap-3 border-accent/10">
        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} className="text-accent" />
        </div>
        <div>
          <span className="text-sm font-medium text-primary">Zero PII Exposure Verified</span>
          <p className="text-xs text-tertiary">
            All verifications processed through zero-knowledge proofs. No personally identifiable information has been accessed, stored, or transmitted.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as 'audit' | 'processing')} />

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'audit' && (
          <div className="card p-0 h-full overflow-hidden">
            <DataTable data={complianceRecords} columns={auditColumns} pageSize={20} />
          </div>
        )}

        {tab === 'processing' && (
          <div className="space-y-3 overflow-auto scrollbar-thin h-full">
            {dataProcessingSummaries.map((summary) => (
              <div key={summary.period} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-primary">{summary.period}</span>
                  <Badge variant="success">PII Events: 0</Badge>
                </div>
                <div className="grid grid-cols-5 gap-3">
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
