import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoStore } from '@/stores/useDemoStore';
import SpotlightOverlay from './SpotlightOverlay';
import NarrationBar from './NarrationBar';
import ActionHint from './ActionHint';

export default function DemoWalkthrough() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = useDemoStore((s) => s.isActive);
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex);
  const steps = useDemoStore((s) => s.steps);
  const nextStep = useDemoStore((s) => s.nextStep);
  const prevStep = useDemoStore((s) => s.prevStep);
  const endDemo = useDemoStore((s) => s.endDemo);
  const goToStep = useDemoStore((s) => s.goToStep);

  const currentStep = isActive ? steps[currentStepIndex] ?? null : null;

  const [showSpotlight, setShowSpotlight] = useState(false);

  // Auto-navigate when step requires a different route
  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (!currentStep.route) return;

    if (location.pathname !== currentStep.route) {
      const timer = setTimeout(() => {
        navigate(currentStep.route!);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStepIndex, currentStep, location.pathname, navigate]);

  // Detect user navigation for steps with route: null (campaign detail)
  useEffect(() => {
    if (!isActive) return;
    const step = steps[currentStepIndex];
    if (!step) return;

    // Step 3 (view-campaigns) → user clicked a campaign card → navigated to /campaigns/:id
    if (
      step.id === 'view-campaigns' &&
      /^\/campaigns\/[^/]+$/.test(location.pathname) &&
      location.pathname !== '/campaigns/new'
    ) {
      const timer = setTimeout(() => nextStep(), 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isActive, currentStepIndex, steps, nextStep]);

  // Spotlight delay after navigation
  useEffect(() => {
    if (!isActive || !currentStep) {
      setShowSpotlight(false);
      return;
    }

    setShowSpotlight(false);
    const delay = currentStep.delayMs ?? 250;
    const timer = setTimeout(() => setShowSpotlight(true), delay);
    return () => clearTimeout(timer);
  }, [isActive, currentStepIndex, currentStep]);

  // Auto-scroll to target
  useEffect(() => {
    if (!isActive || !currentStep?.autoScrollTo) return;

    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.autoScrollTo!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, (currentStep.delayMs ?? 250) + 100);

    return () => clearTimeout(timer);
  }, [isActive, currentStepIndex, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endDemo();
      } else if (e.key === 'ArrowRight') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, endDemo, nextStep, prevStep]);

  if (!isActive || !currentStep) return null;

  return (
    <>
      {showSpotlight && (
        <SpotlightOverlay targetSelector={currentStep.targetSelector} />
      )}
      {showSpotlight && currentStep.actionHint && (
        <ActionHint
          targetSelector={currentStep.targetSelector}
          text={currentStep.actionHint}
        />
      )}
      <NarrationBar
        step={currentStep}
        stepIndex={currentStepIndex}
        totalSteps={steps.length}
        onNext={nextStep}
        onPrev={prevStep}
        onClose={endDemo}
        onDotClick={goToStep}
      />
    </>
  );
}
