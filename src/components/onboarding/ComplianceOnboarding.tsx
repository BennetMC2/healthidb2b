import { ShieldCheck, FileText, Clock, ShieldOff } from 'lucide-react';
import OnboardingModal from '@/components/ui/OnboardingModal';
import type { OnboardingStep } from '@/components/ui/OnboardingModal';

const steps: OnboardingStep[] = [
  {
    icon: ShieldCheck,
    title: 'Zero PII Verified',
    description: 'Every verification processed through zero-knowledge proofs. The audit trail cryptographically proves no personal data was accessed.',
  },
  {
    icon: FileText,
    title: 'Full Audit Trail',
    description: 'Every event — proof request, generation, verification, failure — is logged with timestamps, proof hashes, and partner IDs.',
  },
  {
    icon: Clock,
    title: 'Real-Time Monitoring',
    description: 'Filter by event type, date range, and partner. Export audit logs for your compliance team on demand.',
  },
  {
    icon: ShieldOff,
    title: 'Liability Eliminated',
    description: 'Traditional verification creates $9.77M average breach liability per incident. ZK proofs bypass this entirely.',
  },
];

interface ComplianceOnboardingProps {
  onDismiss: () => void;
}

export default function ComplianceOnboarding({ onDismiss }: ComplianceOnboardingProps) {
  return (
    <OnboardingModal
      storageKey="healthid_compliance_onboarded"
      headerTitle="How Compliance Works"
      headerDescription="Zero-knowledge architecture eliminates data liability by design. Here's the proof:"
      steps={steps}
      punchline="Nothing to breach. Nothing to report. Full audit trail."
      primaryAction={{ label: 'View Audit Trail', action: () => {} }}
      ghostLabel="View Dashboard"
      onDismiss={onDismiss}
    />
  );
}
