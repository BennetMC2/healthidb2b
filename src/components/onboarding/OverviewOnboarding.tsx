import { AlertTriangle, Shield, Vault, Plug } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: AlertTriangle,
    title: 'The Trust Chasm',
    description: 'Health data is trapped in silos. Sharing it creates catastrophic liability for every party in the chain.',
  },
  {
    icon: Shield,
    title: 'The ZK Bridge',
    description: 'On-device zero-knowledge proofs verify health claims without exposing raw data. Only cryptographic receipts cross the wire.',
  },
  {
    icon: Vault,
    title: 'The Yield Engine',
    description: 'Partner budgets earn T-Bill yield while awaiting distribution. Wholesale buying power amplifies every dollar.',
  },
  {
    icon: Plug,
    title: 'The Integration',
    description: 'Insurers, pharma, and employers plug in via API. Acquire pre-verified, health-conscious users from the open pool.',
  },
];

interface OverviewOnboardingProps {
  onDismiss: () => void;
}

export default function OverviewOnboarding({ onDismiss }: OverviewOnboardingProps) {
  return (
    <OnboardingModal
      storageKey="healthid_overview_onboarded"
      headerTitle="Welcome to HealthID"
      headerDescription="The universal infrastructure for the new health economy. Here's how it works:"
      steps={steps}
      punchline="Raw data never leaves the device. Verified trust reaches everyone."
      primaryAction={{ label: 'Explore the Network', action: '/explorer' }}
      ghostLabel="Stay on Overview"
      onDismiss={onDismiss}
    />
  );
}
