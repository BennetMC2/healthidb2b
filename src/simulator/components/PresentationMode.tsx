import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import type { SimulationOutput, Scenario } from '../types';
import { SIGNALS } from '../data/signals';
import { EVIDENCE_LIBRARY } from '../data/evidence';
import { COHORT_PRESETS } from '../data/cohortPresets';
import { INTERVENTIONS } from '../data/interventions';
import { formatCurrencyCompact, formatPercent } from '@/utils/format';
import OutputSummaryPanel from './OutputSummaryPanel';

interface PresentationModeProps {
  scenario: Scenario;
  output: SimulationOutput;
  onExit: () => void;
}

const STEPS = [
  { title: 'Signal Landscape', subtitle: 'What we measure and how confident we are' },
  { title: 'Evidence Basis', subtitle: 'What the published literature says' },
  { title: 'Cohort Profile', subtitle: 'Who we are targeting' },
  { title: 'Intervention Design', subtitle: 'What we are doing' },
  { title: 'Reward Strategy', subtitle: 'How we incentivise behaviour change' },
  { title: 'ROI Output', subtitle: 'What the model projects' },
];

export default function PresentationMode({ scenario, output, onExit }: PresentationModeProps) {
  const [step, setStep] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const canPrev = step > 0;
  const canNext = step < STEPS.length - 1;

  const preset = COHORT_PRESETS.find((p) => p.id === scenario.cohortPresetId);
  const activeInterventions = INTERVENTIONS.filter((i) => scenario.interventions.includes(i.id));

  function toggleFullscreen() {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <div className="text-2xs uppercase tracking-[0.2em] text-accent/80">Presentation Mode</div>
          <h2 className="text-lg font-semibold text-primary font-display">{scenario.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-tertiary">{step + 1} / {STEPS.length}</span>
          <button onClick={toggleFullscreen} className="btn-ghost p-2"><Maximize2 size={16} /></button>
          <button onClick={onExit} className="btn-ghost p-2"><X size={16} /></button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1 px-6 py-2">
        {STEPS.map((_s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-primary font-display">{STEPS[step].title}</h3>
            <p className="mt-1 text-sm text-tertiary">{STEPS[step].subtitle}</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary leading-relaxed">
                This simulation ingests {SIGNALS.length} health signals across wearable, clinical, and user-reported data sources.
                Each signal is scored for data confidence based on the connected device, measurement consistency, and data recency.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {['wearable', 'clinical', 'user_reported'].map((type) => {
                  const count = SIGNALS.filter((s) => s.sourceType === type).length;
                  return (
                    <div key={type} className="card">
                      <div className="text-2xs text-tertiary uppercase">{type.replace('_', '-')}</div>
                      <div className="text-2xl font-semibold text-primary font-display mt-1">{count}</div>
                      <div className="text-xs text-tertiary">signals</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary leading-relaxed">
                The model is calibrated against {EVIDENCE_LIBRARY.length} peer-reviewed citations and industry reviews,
                covering {EVIDENCE_LIBRARY.reduce((sum, e) => sum + e.sampleSize, 0).toLocaleString()} participants in total.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {EVIDENCE_LIBRARY.slice(0, 4).map((e) => (
                  <div key={e.id} className="card">
                    <h4 className="text-sm font-semibold text-primary font-display">{e.authors.split(',')[0]} et al. ({e.year})</h4>
                    <p className="mt-1 text-xs text-accent">{e.effectSize}</p>
                    <p className="mt-1 text-2xs text-tertiary">{e.journal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary leading-relaxed">
                {preset ? `Targeting the "${preset.name}" cohort: ${preset.description}` : `Custom cohort definition for ${scenario.name}.`}
              </p>
              {preset && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="card">
                    <div className="text-2xs text-tertiary">Estimated Cohort Size</div>
                    <div className="text-2xl font-semibold text-primary font-display mt-1">{preset.estimatedSize.toLocaleString()}</div>
                  </div>
                  <div className="card">
                    <div className="text-2xs text-tertiary">Baseline Risk</div>
                    <div className="text-2xl font-semibold text-primary font-display mt-1 capitalize">{preset.definition.baselineRisk}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary leading-relaxed">
                {activeInterventions.length} intervention{activeInterventions.length > 1 ? 's' : ''} configured:
                {' '}{activeInterventions.map((i) => i.name).join(', ')}.
              </p>
              {activeInterventions.map((intervention) => (
                <div key={intervention.id} className="card">
                  <h4 className="text-sm font-semibold text-primary font-display">{intervention.name}</h4>
                  <p className="mt-1 text-xs text-tertiary">{intervention.description}</p>
                  <div className="mt-2 text-xs text-accent">
                    Expected change: {Math.round(intervention.expectedChangeRange[0] * 100)}-{Math.round(intervention.expectedChangeRange[1] * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary leading-relaxed">
                Reward strategy: "{scenario.rewardConfig.name}" — {scenario.rewardConfig.description}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="card">
                  <div className="text-2xs text-tertiary">Budget / Member</div>
                  <div className="text-2xl font-semibold text-primary font-display mt-1">${scenario.rewardConfig.budgetPerMember}</div>
                </div>
                <div className="card">
                  <div className="text-2xs text-tertiary">Expected Participation</div>
                  <div className="text-2xl font-semibold text-primary font-display mt-1">{formatPercent(scenario.rewardConfig.expectedParticipation)}</div>
                </div>
                <div className="card">
                  <div className="text-2xs text-tertiary">Expected Persistence</div>
                  <div className="text-2xl font-semibold text-primary font-display mt-1">{formatPercent(scenario.rewardConfig.expectedPersistence)}</div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary leading-relaxed">{output.plainEnglishSummary}</p>
              <OutputSummaryPanel output={output} horizon="1y" />
              <div className="rounded-lg border border-accent/15 bg-accent/5 px-4 py-3">
                <div className="text-sm font-semibold text-primary font-display mb-1">Confidence: {output.confidenceLabel}</div>
                <div className="text-xs text-tertiary">
                  Scenario range: {formatCurrencyCompact(output.horizons['1y'].scenarioRangeLow)} to {formatCurrencyCompact(output.horizons['1y'].scenarioRangeHigh)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        <button
          onClick={() => setStep(step - 1)}
          disabled={!canPrev}
          className="btn-ghost gap-1 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="text-sm text-tertiary">{STEPS[step].title}</div>
        <button
          onClick={() => setStep(step + 1)}
          disabled={!canNext}
          className="btn-ghost gap-1 disabled:opacity-30"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
