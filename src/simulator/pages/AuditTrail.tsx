import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useSimulationResultStore } from '../store/useSimulationResultStore';
import AuditLogTable from '../components/AuditLogTable';
import { MODEL_VERSION } from '../constants';

export default function AuditTrail() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId } = useSimulatorStore();
  const { results } = useSimulationResultStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);
  const output = scenario ? results[scenario.id] : undefined;

  const [filterAction, setFilterAction] = useState<string>('');

  if (!scenario || !output) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No audit trail available.</p>
        <button onClick={() => navigate('/simulator/run')} className="btn-ghost text-sm mt-2">Run Simulation</button>
      </div>
    );
  }

  const actionTypes = [...new Set(output.auditTrail.map((e) => e.action))];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Info bar */}
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-2xs text-tertiary">Audit Entries</div>
          <div className="text-2xl font-semibold text-primary font-display">{output.auditTrail.length}</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-tertiary">Model: </span>
            <span className="text-primary font-mono">{MODEL_VERSION}</span>
          </div>
          <div>
            <span className="text-tertiary">Scenario: </span>
            <span className="text-primary">{scenario.name}</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-2xs text-tertiary">Filter by action:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary"
        >
          <option value="">All</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Audit log */}
      <AuditLogTable entries={output.auditTrail} filterAction={filterAction || undefined} />

      {/* Lineage summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-2">Full Lineage</h3>
        <p className="text-xs text-tertiary leading-relaxed">
          Every output in this simulation is traceable to: the input signals loaded, the clinical rules applied,
          the evidence literature cited, the assumptions used, the reward configuration, and the model version ({MODEL_VERSION}).
          This audit trail provides full provenance for actuarial review.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/settings')} className="btn-ghost text-sm">Simulator Settings →</button>
        <button onClick={() => navigate('/simulator/bridge')} className="btn-ghost text-sm">← Back</button>
      </div>
    </div>
  );
}
