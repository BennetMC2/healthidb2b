import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface OnboardingStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface OnboardingModalProps {
  storageKey: string;
  headerTitle: string;
  headerDescription: string;
  steps: OnboardingStep[];
  punchline: string;
  primaryAction: { label: string; action: string | (() => void) };
  ghostLabel: string;
  onDismiss: () => void;
}

export default function OnboardingModal({
  storageKey,
  headerTitle,
  headerDescription,
  steps,
  punchline,
  primaryAction,
  ghostLabel,
  onDismiss,
}: OnboardingModalProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(-1);
  const [showPunchline, setShowPunchline] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  // Track whether user has manually clicked a step (pauses auto-advance)
  const userClicked = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const advance = (step: number, delay: number) =>
      timers.push(setTimeout(() => {
        if (!userClicked.current) setActiveStep(step);
      }, delay));
    advance(0, 400);
    advance(1, 2400);
    advance(2, 4400);
    advance(3, 6400);
    timers.push(setTimeout(() => setShowPunchline(true), 8200));
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStepClick = (i: number) => {
    userClicked.current = true;
    setActiveStep(i);
  };

  const persistIfChecked = () => {
    if (dontShow) localStorage.setItem(storageKey, '1');
  };

  const dismiss = () => {
    persistIfChecked();
    onDismiss();
  };

  const handlePrimary = () => {
    persistIfChecked();
    if (typeof primaryAction.action === 'string') {
      navigate(primaryAction.action);
    } else {
      primaryAction.action();
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={dismiss}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative card w-[95vw] max-w-[680px] border-border bg-surface animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary mb-1">{headerTitle}</h2>
          <p className="text-xs text-tertiary">{headerDescription}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-start justify-between gap-2 mb-6">
          {steps.map((step, i) => {
            const isActive = activeStep >= i;
            const isCurrent = activeStep === i;
            const Icon = step.icon;

            return (
              <div key={i} className="flex items-center flex-1">
                {/* Step Node — clickable */}
                <button
                  type="button"
                  onClick={() => handleStepClick(i)}
                  className="flex flex-col items-center flex-1 cursor-pointer group"
                >
                  <div
                    className={`w-10 h-10 rounded-md border flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                      isActive
                        ? 'border-accent/30 bg-accent-dim text-accent'
                        : 'border-border bg-elevated text-tertiary group-hover:border-accent/20 group-hover:text-accent/60'
                    } ${isCurrent ? 'scale-110' : ''}`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-2xs mt-1.5 font-medium transition-colors duration-300 ${
                      isActive ? 'text-secondary' : 'text-tertiary'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Connector */}
                {i < steps.length - 1 && (
                  <div className="flex-shrink-0 w-8 h-px relative mt-[-12px]">
                    <div className="absolute inset-0 bg-border" />
                    <div
                      className={`absolute inset-0 bg-accent transition-all duration-500 ${
                        activeStep > i ? 'opacity-60' : 'opacity-0'
                      }`}
                    />
                    {activeStep === i && (
                      <div className="absolute inset-0 bg-accent/60 animate-flow-pulse" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Step Description */}
        <div className="card-elevated min-h-[52px] flex flex-col justify-center mb-4">
          {activeStep >= 0 ? (
            <div key={activeStep} className="animate-slide-in">
              <p className="text-sm font-medium text-primary mb-0.5">
                {steps[activeStep].title}
              </p>
              <p className="text-xs text-secondary">
                {steps[activeStep].description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-tertiary animate-flow-pulse">
              Loading...
            </p>
          )}
        </div>

        {/* Punchline Card */}
        <div
          className={`rounded border border-accent/20 bg-accent-muted px-4 py-3 mb-6 transition-all duration-500 ${
            showPunchline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-sm font-semibold text-accent text-center">
            {punchline}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border accent-accent"
            />
            <span className="text-2xs text-tertiary">Don't show again</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="px-3 py-1.5 text-xs text-secondary hover:text-primary border border-border rounded hover:bg-hover transition-colors"
            >
              {ghostLabel}
            </button>
            <button onClick={handlePrimary} className="btn-primary text-xs">
              {primaryAction.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
