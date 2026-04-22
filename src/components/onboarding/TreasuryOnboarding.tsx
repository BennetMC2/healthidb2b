import { Activity, TrendingUp, Layers, BookOpen } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: Activity,
    title: 'Select a Metric',
    description: 'Pick a health metric — HbA1c, VO₂ max, cholesterol — and HealthID matches policyholders who share verified proof.',
  },
  {
    icon: TrendingUp,
    title: 'Model Morbidity Shift',
    description: 'Evidence-graded projections show claims reduction rate and basis-point morbidity improvement in actuarial pricing language.',
  },
  {
    icon: Layers,
    title: 'Stack Metrics',
    description: 'Combine up to 3 metrics. A 0.75× correlation dampener keeps the combined estimate conservative and credible.',
  },
  {
    icon: BookOpen,
    title: 'Scale to Your Book',
    description: 'Enter your book size and average premium to see total VNB impact and projected annual savings across your portfolio.',
  },
];

interface TreasuryOnboardingProps {
  onDismiss: () => void;
}

export default function TreasuryOnboarding({ onDismiss }: TreasuryOnboardingProps) {
  return (
    <OnboardingModal
      storageKey="healthid_treasury_onboarded"
      headerTitle="The Actuarial Impact Engine"
      headerDescription="From metric selection to morbidity shift — model claims reduction at any scale."
      steps={steps}
      punchline="Real actuarial language. Real claims reduction. Modeled by metric, use case, and book size."
      primaryAction={{ label: 'View Actuarial Model', action: '/treasury#actuarial-roi' }}
      ghostLabel="How Rewards Are Funded"
      onDismiss={onDismiss}
    />
  );
}
