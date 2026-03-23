import { Target, Users, Gift, ShieldCheck } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: Target,
    title: 'Define Challenge',
    description: 'Pick a health metric and set the threshold. e.g., 8,000 steps/day for 30 days.',
  },
  {
    icon: Users,
    title: 'Target a Cohort',
    description: 'Filter by health score, reputation tier, data sources, demographics — all without accessing personal data.',
  },
  {
    icon: Gift,
    title: 'Set Rewards',
    description: 'Allocate Health Points per verified proof. Budget earns yield while waiting.',
  },
  {
    icon: ShieldCheck,
    title: 'Collect Proofs',
    description: 'Users verify on-device via ZK proofs. You receive cryptographic receipts — never raw data.',
  },
];

interface CampaignOnboardingModalProps {
  onDismiss: () => void;
}

export default function CampaignOnboardingModal({ onDismiss }: CampaignOnboardingModalProps) {
  return (
    <OnboardingModal
      storageKey="healthid_campaigns_onboarded"
      headerTitle="How Campaigns Work"
      headerDescription="Campaigns are privacy-preserving verification challenges. Here's the lifecycle:"
      steps={steps}
      punchline="Zero data liability. Full verification certainty."
      primaryAction={{ label: 'Create a Campaign', action: '/campaigns/new' }}
      ghostLabel="Explore Campaigns"
      onDismiss={onDismiss}
    />
  );
}
