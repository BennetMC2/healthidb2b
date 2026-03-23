import { Globe, Users, Activity, Database } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: Globe,
    title: 'Browse the Pool',
    description: 'Every row is a pseudonymous health identity — real aggregated data from wearables, labs, and clinical sources. Zero PII.',
  },
  {
    icon: Users,
    title: 'Segment Cohorts',
    description: 'Filter by health score, trust tier, data sources, age, and gender to define the exact audience for your campaign.',
  },
  {
    icon: Activity,
    title: 'Assess Quality',
    description: "Health scores, verification counts, and trust tiers tell you how reliable each identity's data is — without seeing the data itself.",
  },
  {
    icon: Database,
    title: 'Export & Target',
    description: 'Export filtered cohorts for actuarial analysis, or pipe them directly into a campaign as your target audience.',
  },
];

interface ExplorerOnboardingProps {
  onDismiss: () => void;
}

export default function ExplorerOnboarding({ onDismiss }: ExplorerOnboardingProps) {
  return (
    <OnboardingModal
      storageKey="healthid_explorer_onboarded"
      headerTitle="How the Network Explorer Works"
      headerDescription="Full cohort intelligence without personal data exposure. Here's how:"
      steps={steps}
      punchline="Full cohort intelligence. Zero personal data exposure."
      primaryAction={{ label: 'Create a Campaign', action: '/campaigns/new' }}
      ghostLabel="Explore the Pool"
      onDismiss={onDismiss}
    />
  );
}
