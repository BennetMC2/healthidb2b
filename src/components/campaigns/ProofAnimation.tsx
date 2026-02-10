import { useEffect, useState } from 'react';
import {
  X,
  Smartphone,
  Cpu,
  Lock,
  CheckCircle,
} from 'lucide-react';
import { ProofBadge } from '@/components/ui/Badge';
import { formatDuration, formatHash } from '@/utils/format';
import { DATA_SOURCE_LABELS, HEALTH_METRIC_LABELS } from '@/utils/constants';
import type { VerificationReceipt } from '@/types';

interface ProofAnimationProps {
  receipt: VerificationReceipt;
  onClose: () => void;
}

const steps = [
  { icon: Smartphone, label: 'Data Accessed', color: 'text-accent' },
  { icon: Cpu, label: 'Circuit Compiled', color: 'text-accent' },
  { icon: Lock, label: 'Proof Generated', color: 'text-accent' },
  { icon: CheckCircle, label: 'Verified', color: 'text-success' },
];

export default function ProofAnimation({ receipt, onClose }: ProofAnimationProps) {
  const [activeStep, setActiveStep] = useState(-1);
  const [hashRevealed, setHashRevealed] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Step 0: Data accessed (300ms delay)
    timers.push(setTimeout(() => setActiveStep(0), 300));
    // Step 1: Circuit compiled (900ms)
    timers.push(setTimeout(() => setActiveStep(1), 900));
    // Step 2: Proof generated (1700ms)
    timers.push(setTimeout(() => setActiveStep(2), 1700));
    // Start hash reveal at step 2
    timers.push(setTimeout(() => {
      let chars = 0;
      const interval = setInterval(() => {
        chars += 2;
        setHashRevealed(chars);
        if (chars >= 20) clearInterval(interval);
      }, 30);
      timers.push(setTimeout(() => clearInterval(interval), 700));
    }, 1800));
    // Step 3: Verified (2500ms)
    timers.push(setTimeout(() => setActiveStep(3), 2500));

    return () => timers.forEach(clearTimeout);
  }, []);

  const primarySource = receipt.dataSources[0];
  const sourceName = primarySource ? DATA_SOURCE_LABELS[primarySource] : 'Connected Source';
  const metricName = HEALTH_METRIC_LABELS[receipt.metric];

  const stepDescriptions = [
    `Health data queried from ${sourceName} on user device`,
    `Zero-knowledge circuit compiled for ${metricName}`,
    `Cryptographic proof generated in ${formatDuration(receipt.proofGenerationMs)}`,
    'Proof validated. Verified receipt issued.',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative card w-[680px] border-border bg-surface animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-accent" />
            <span className="text-sm font-semibold text-primary">
              Proof Verification
            </span>
            <ProofBadge type={receipt.proofType} />
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-start justify-between gap-2 mb-6">
          {steps.map((step, i) => {
            const isActive = activeStep >= i;
            const isCurrent = activeStep === i;
            const Icon = step.icon;

            return (
              <div key={i} className="flex items-center flex-1">
                {/* Step Node */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-md border flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? `border-accent/30 bg-accent-dim ${step.color}`
                        : 'border-border bg-elevated text-tertiary'
                    } ${isCurrent ? 'scale-110' : ''}`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-2xs mt-1.5 font-medium transition-colors duration-300 ${
                      isActive ? 'text-secondary' : 'text-tertiary'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

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

        {/* Status Description */}
        <div className="card-elevated min-h-[60px] flex flex-col justify-center">
          {activeStep >= 0 ? (
            <div className="animate-slide-in">
              <p className="text-xs text-secondary">
                {stepDescriptions[activeStep]}
              </p>
              {activeStep === 2 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-2xs text-tertiary">Hash:</span>
                  <code className="font-mono text-2xs text-accent/70">
                    {formatHash(receipt.proofHash).slice(0, hashRevealed)}
                    {hashRevealed < 20 && (
                      <span className="animate-flow-pulse">|</span>
                    )}
                  </code>
                </div>
              )}
              {activeStep === 3 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded-sm border bg-success-muted border-success/20 text-success">
                    <CheckCircle size={10} /> Verified
                  </span>
                  <code className="font-mono text-2xs text-accent/50">
                    {formatHash(receipt.proofHash)}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-tertiary animate-flow-pulse">
              Initiating proof verification...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
