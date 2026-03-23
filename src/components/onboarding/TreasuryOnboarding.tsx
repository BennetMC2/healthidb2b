import { Vault, TrendingUp, Coins, DollarSign } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: Vault,
    title: 'Deploy Budget',
    description: 'Deposit funds into the protocol treasury. Principal is protected in tokenized T-Bills.',
  },
  {
    icon: TrendingUp,
    title: 'Earn Yield',
    description: 'Idle funds generate 4-5% APY from US Treasury Bills while waiting for distribution.',
  },
  {
    icon: Coins,
    title: 'Amplify Value',
    description: 'Wholesale procurement and yield combine to create a 1.50x+ value multiplier on every dollar.',
  },
  {
    icon: DollarSign,
    title: 'Reduce Claims',
    description: 'Verified, incentivized health behavior drives measurable claims reduction — the real ROI.',
  },
];

interface TreasuryOnboardingProps {
  onDismiss: () => void;
}

export default function TreasuryOnboarding({ onDismiss }: TreasuryOnboardingProps) {
  return (
    <OnboardingModal
      storageKey="healthid_treasury_onboarded"
      headerTitle="How the Treasury Works"
      headerDescription="Your budget works while it waits. Here's the economic engine:"
      steps={steps}
      punchline="Your budget works while it waits. Your users get more than you spend."
      primaryAction={{ label: 'View ROI Calculator', action: '/treasury#roi-calculator' }}
      ghostLabel="Explore Treasury"
      onDismiss={onDismiss}
    />
  );
}
