import { useNavigate } from 'react-router-dom';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useSimulationResultStore } from '../store/useSimulationResultStore';
import HealthToValueSankey from '../components/HealthToValueSankey';
import ConfidenceGauge from '../components/ConfidenceGauge';

export default function HealthToValueBridge() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId } = useSimulatorStore();
  const { results } = useSimulationResultStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);
  const output = scenario ? results[scenario.id] : undefined;

  if (!scenario || !output) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-tertiary">No simulation results available.</p>
        <button onClick={() => navigate('/simulator/run')} className="btn-ghost text-sm mt-2">Run Simulation</button>
      </div>
    );
  }

  // Average confidence across bridge steps
  const avgConfidence = output.healthToValueBridge.reduce((sum, s) => sum + s.confidence, 0) / output.healthToValueBridge.length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header card */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary font-display">Signal → Value Pathway</h3>
          <p className="text-xs text-tertiary mt-1">
            From measured health signal movement through to net insurer value, with confidence scores at each stage.
          </p>
        </div>
        <ConfidenceGauge value={avgConfidence} label="Avg. Confidence" size={90} />
      </div>

      {/* Sankey / waterfall */}
      <div className="card">
        <HealthToValueSankey steps={output.healthToValueBridge} />
      </div>

      {/* Evidence citations per stage */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Evidence Citations by Stage</h3>
        <div className="space-y-2">
          {output.healthToValueBridge.filter((s) => s.evidenceIds.length > 0).map((step) => (
            <div key={step.stage} className="flex items-start gap-3 py-1 border-b border-border/30">
              <span className="text-sm font-medium text-primary shrink-0 w-40">{step.label}</span>
              <div className="flex flex-wrap gap-1">
                {step.evidenceIds.map((id) => (
                  <span key={id} className="text-2xs text-accent bg-accent/5 border border-accent/15 rounded px-1.5 py-0.5">
                    {id.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/audit')} className="btn-primary text-sm">View Audit Trail →</button>
        <button onClick={() => navigate('/simulator/output')} className="btn-ghost text-sm">← Back to Output</button>
      </div>
    </div>
  );
}
