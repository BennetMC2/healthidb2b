import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AuditEntry } from '../types';
import { formatTimestamp } from '@/utils/format';

interface AuditLogTableProps {
  entries: AuditEntry[];
  filterAction?: string;
}

export default function AuditLogTable({ entries, filterAction }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filterAction
    ? entries.filter((e) => e.action === filterAction)
    : entries;

  return (
    <div className="space-y-1">
      {filtered.map((entry) => {
        const isExpanded = expandedId === entry.id;

        return (
          <div key={entry.id} className="rounded-lg border border-border/60 bg-surface/40">
            <button
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
            >
              {isExpanded ? <ChevronDown size={14} className="text-tertiary" /> : <ChevronRight size={14} className="text-tertiary" />}
              <span className="text-2xs text-tertiary font-mono shrink-0">{formatTimestamp(entry.timestamp)}</span>
              <span className="inline-flex items-center rounded-sm border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-2xs text-accent shrink-0">
                {entry.layer}
              </span>
              <span className="text-sm text-primary truncate flex-1">{entry.detail}</span>
              <span className="text-2xs text-tertiary font-mono shrink-0">{entry.modelVersion}</span>
            </button>

            {isExpanded && (
              <div className="border-t border-border/40 px-3 py-3 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-2xs text-tertiary mb-1">Action</div>
                    <div className="text-secondary font-mono">{entry.action}</div>
                  </div>
                  <div>
                    <div className="text-2xs text-tertiary mb-1">Layer</div>
                    <div className="text-secondary">{entry.layer}</div>
                  </div>
                </div>

                {entry.signalsUsed.length > 0 && (
                  <div>
                    <div className="text-2xs text-tertiary mb-1">Signals Used</div>
                    <div className="flex flex-wrap gap-1">
                      {entry.signalsUsed.map((s) => (
                        <span key={s} className="text-2xs text-accent bg-accent/5 border border-accent/15 rounded px-1 py-0.5">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.rulesFired.length > 0 && (
                  <div>
                    <div className="text-2xs text-tertiary mb-1">Rules Fired</div>
                    <div className="flex flex-wrap gap-1">
                      {entry.rulesFired.map((r) => (
                        <span key={r} className="text-2xs text-secondary bg-surface border border-border rounded px-1 py-0.5">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.evidenceCited.length > 0 && (
                  <div>
                    <div className="text-2xs text-tertiary mb-1">Evidence Cited</div>
                    <div className="flex flex-wrap gap-1">
                      {entry.evidenceCited.map((e) => (
                        <span key={e} className="text-2xs text-secondary bg-surface border border-border rounded px-1 py-0.5">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(entry.assumptions).length > 0 && (
                  <div>
                    <div className="text-2xs text-tertiary mb-1">Assumptions</div>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(entry.assumptions).map(([key, val]) => (
                        <div key={key} className="text-2xs">
                          <span className="text-tertiary">{key}: </span>
                          <span className="text-secondary font-mono">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
