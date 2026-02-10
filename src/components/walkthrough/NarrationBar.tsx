import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { WalkthroughStep } from '@/walkthrough/types';

interface NarrationBarProps {
  step: WalkthroughStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onDotClick: (index: number) => void;
}

export default function NarrationBar({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onDotClick,
}: NarrationBarProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const isWaiting =
    step.actionType === 'click-target' ||
    step.actionType === 'click-any-in' ||
    step.actionType === 'interact';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[140px] z-[9500] bg-surface border-t border-border animate-slide-up-bar">
      <div className="h-full max-w-[1200px] mx-auto px-6 flex items-center gap-6">
        {/* Back */}
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex items-center gap-2 text-base text-secondary hover:text-primary disabled:text-tertiary disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => i <= stepIndex && onDotClick(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'bg-accent scale-125'
                  : i < stepIndex
                    ? 'bg-accent/50 cursor-pointer hover:bg-accent/70'
                    : 'bg-border'
              }`}
              disabled={i > stepIndex}
            />
          ))}
        </div>

        {/* Narration Content */}
        <div className="flex-1 min-w-0" key={stepIndex}>
          <div className="animate-fade-in">
            <div className="text-xl font-bold text-primary truncate">
              {step.title}
            </div>
            <p className="text-base text-primary/90 leading-relaxed mt-2 line-clamp-2">
              {step.narration}
            </p>
          </div>
        </div>

        {/* Next / Waiting */}
        <button
          onClick={onNext}
          className={`flex items-center gap-2 text-base font-medium px-6 py-2.5 rounded transition-colors flex-shrink-0 ${
            isWaiting
              ? 'bg-elevated border border-border text-tertiary hover:text-secondary hover:bg-hover'
              : 'bg-accent text-white hover:bg-accent-hover'
          }`}
        >
          {isLast ? 'Finish' : isWaiting ? 'Skip' : 'Next'}
          {!isLast && <ChevronRight size={20} />}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
