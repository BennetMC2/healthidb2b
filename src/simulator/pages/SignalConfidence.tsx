import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSignalsBySourceType } from '../data/signals';
import SignalCard from '../components/SignalCard';
import SourceConfidenceMatrix from '../components/SourceConfidenceMatrix';
import ConfidenceGauge from '../components/ConfidenceGauge';
import AdvancedToggle from '../components/AdvancedToggle';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { scoreDataConfidence, scoreEvidenceConfidence } from '../engine/confidenceModel';
import { INTERVENTIONS } from '../data/interventions';
import { CONFIDENCE_MODULATING_FACTORS } from '../data/sourceConfidence';

export default function SignalConfidence() {
  const navigate = useNavigate();
  const { scenarios, activeScenarioId } = useSimulatorStore();
  const scenario = scenarios.find((s) => s.id === activeScenarioId);
  const [activeTab, setActiveTab] = useState<'wearable' | 'clinical' | 'user_reported'>('wearable');
  const [modFactors, setModFactors] = useState<Record<string, number>>(
    Object.fromEntries(CONFIDENCE_MODULATING_FACTORS.map((f) => [f.id, f.defaultWeight])),
  );

  const activeInterventions = scenario
    ? INTERVENTIONS.filter((i) => scenario.interventions.includes(i.id))
    : [];
  const allSignals = [...new Set(activeInterventions.flatMap((i) => i.primarySignals))];
  const allSources = ['apple_health', 'garmin', 'whoop', 'oura', 'fitbit'] as never[];

  const dataConf = scoreDataConfidence(allSignals, allSources, modFactors);
  const evidenceConf = scoreEvidenceConfidence(scenario?.interventions ?? []);

  const tabs = [
    { id: 'wearable' as const, label: 'Wearable', count: getSignalsBySourceType('wearable').length },
    { id: 'clinical' as const, label: 'Clinical', count: getSignalsBySourceType('clinical').length },
    { id: 'user_reported' as const, label: 'User-Reported', count: getSignalsBySourceType('user_reported').length },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Confidence gauges */}
      <div className="card flex items-center justify-around">
        <ConfidenceGauge value={dataConf} label="Data Confidence" size={120} />
        <ConfidenceGauge value={evidenceConf} label="Evidence Confidence" size={120} />
        <ConfidenceGauge value={(dataConf + evidenceConf) / 2} label="Composite" size={120} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-accent border-accent'
                : 'text-tertiary border-transparent hover:text-secondary'
            }`}
          >
            {tab.label} <span className="text-2xs font-mono ml-1">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Signal cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {getSignalsBySourceType(activeTab).map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Source confidence matrix */}
      <div className="card">
        <h3 className="text-sm font-semibold text-primary font-display mb-3">Source × Signal Confidence Matrix</h3>
        <SourceConfidenceMatrix />
      </div>

      {/* Advanced: modulating factors */}
      <AdvancedToggle label="Modulating Factor Sliders">
        <div className="space-y-4">
          {CONFIDENCE_MODULATING_FACTORS.map((factor) => (
            <div key={factor.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-primary">{factor.label}</span>
                <span className="text-xs text-accent font-mono">{modFactors[factor.id]?.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={Math.round(factor.min * 100)}
                max={Math.round(factor.max * 100)}
                value={Math.round((modFactors[factor.id] ?? factor.defaultWeight) * 100)}
                onChange={(e) => setModFactors({ ...modFactors, [factor.id]: Number(e.target.value) / 100 })}
                className="w-full"
              />
              <p className="text-2xs text-tertiary mt-0.5">{factor.description}</p>
            </div>
          ))}
        </div>
      </AdvancedToggle>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/simulator/evidence')} className="btn-primary text-sm">Next: Evidence Library →</button>
        <button onClick={() => navigate('/simulator/cohort')} className="btn-ghost text-sm">← Back</button>
      </div>
    </div>
  );
}
