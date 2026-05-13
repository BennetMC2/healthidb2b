import { Target, Users, Gift, ShieldCheck } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: Target,
    title: 'Define Outcome',
    description: 'Choose the insurer business outcome, then translate it into a measurable health programme.',
  },
  {
    icon: Users,
    title: 'Target the Cohort',
    description: 'Shape the reachable member cohort by market, trust tier, data sources, and eligibility profile.',
  },
  {
    icon: Gift,
    title: 'Set Incentives',
    description: 'Keep incentives visible but secondary to the underlying business case and actuarial value.',
  },
  {
    icon: ShieldCheck,
    title: 'Review Receipts',
    description: 'The insurer reviews receipt-level outcomes and campaign performance without taking custody of raw health data.',
  },
];

interface CampaignOnboardingModalProps {
  onDismiss: () => void;
}

export default function CampaignOnboardingModal({ onDismiss }: CampaignOnboardingModalProps) {
  return (
    <OnboardingModal
      storageKey="healthid_campaigns_onboarded"
      headerTitle="How Campaign Studio Works"
      headerDescription="Configure one Health Points campaign and reuse the same engine across signal improvement, acquisition, retention, and engagement."
      steps={steps}
      punchline="One campaign workflow. Multiple downstream commercial outcomes."
      primaryAction={{ label: 'Create a Campaign', action: '/app/campaigns/new' }}
      ghostLabel="Explore Campaigns"
      onDismiss={onDismiss}
    />
  );
}
