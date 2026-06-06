import { Check, Loader2 } from 'lucide-react';
import type { RunStep } from '../store/useSimulationResultStore';

interface SimulationProgressStepsProps {
  currentStep: RunStep | null;
  stepProgress: Record<RunStep, boolean>;
  isRunning: boolean;
}

const STEPS: { id: RunStep; label: string; layer: string }[] = [
  { id: 'signals', label: 'Loading signals', layer: 'L1' },
  { id: 'confidence', label: 'Scoring confidence', layer: 'L2' },
  { id: 'cohort', label: 'Building cohort', layer: 'L3' },
  { id: 'rules', label: 'Applying rules', layer: 'L4' },
  { id: 'rewards', label: 'Computing rewards', layer: 'L5' },
  { id: 'roi', label: 'Projecting ROI', layer: 'L6' },
  { id: 'audit', label: 'Generating audit', layer: 'Audit' },
];

export default function SimulationProgressSteps({ currentStep, stepProgress, isRunning }: SimulationProgressStepsProps) {
  return (
    <div className="space-y-2">
      {STEPS.map((step) => {
        const isComplete = stepProgress[step.id];
        const isCurrent = currentStep === step.id;

        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ${
              isCurrent ? 'bg-accent/10 border border-accent/20' :
              isComplete ? 'bg-green-500/5 border border-green-500/15' :
              'bg-surface/40 border border-border/40'
            }`}
          >
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              isComplete ? 'bg-green-500 text-white' :
              isCurrent ? 'bg-accent text-white' :
              'bg-border text-tertiary'
            }`}>
              {isComplete ? (
                <Check size={12} />
              ) : isCurrent && isRunning ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <span className="text-2xs font-mono">{STEPS.indexOf(step) + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isCurrent ? 'text-accent font-medium' : isComplete ? 'text-green-500' : 'text-tertiary'}`}>
                  {step.label}
                </span>
                <span className="text-2xs text-tertiary font-mono">{step.layer}</span>
              </div>
            </div>
            {isComplete && (
              <span className="text-2xs text-green-500">Done</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
