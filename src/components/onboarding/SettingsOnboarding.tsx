import { Shield, Webhook, Globe, Save } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: Shield,
    title: 'API Credentials',
    description: 'Your API key authenticates all protocol requests. Rotate it anytime from this dashboard.',
  },
  {
    icon: Webhook,
    title: 'Webhooks & Events',
    description: 'Configure real-time notifications for verification completions, campaign milestones, and proof failures.',
  },
  {
    icon: Globe,
    title: 'Regions & Retention',
    description: 'Control which geographic regions your campaigns can target and how long proof receipts are retained.',
  },
  {
    icon: Save,
    title: 'Profile & Preferences',
    description: 'Manage partner label, industry vertical, concurrent campaign limits, and notification preferences.',
  },
];

interface SettingsOnboardingProps {
  onDismiss: () => void;
}

export default function SettingsOnboarding({ onDismiss }: SettingsOnboardingProps) {
  return (
    <OnboardingModal
      storageKey="healthid_settings_onboarded"
      headerTitle="Settings Overview"
      headerDescription="Everything you need to configure your protocol integration:"
      steps={steps}
      punchline="One configuration. Full protocol access. Zero data custody."
      primaryAction={{ label: 'Get Started', action: () => {} }}
      ghostLabel="Browse Settings"
      onDismiss={onDismiss}
    />
  );
}
