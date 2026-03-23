import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import ProofAnimation from '@/components/campaigns/ProofAnimation';
import { seededRandom, generateHash, generateId, randomItem, randomInt } from '@/data/seed';
import type { VerificationReceipt, DataSource, HealthMetric } from '@/types';

const METRICS: HealthMetric[] = ['vo2_max', 'heart_rate_resting', 'hrv', 'spo2', 'sleep_quality'];
const SOURCES: DataSource[] = ['apple_health', 'fitbit', 'garmin', 'oura', 'whoop'];

function synthesizeReceipt(): VerificationReceipt {
  const rng = seededRandom(Date.now());
  return {
    id: generateId(rng, 'vrf'),
    campaignId: 'demo',
    identityId: 'demo',
    proofType: 'zk_snark',
    proofHash: generateHash(rng),
    status: 'verified',
    metric: randomItem(rng, METRICS),
    dataSources: [randomItem(rng, SOURCES)],
    timestamp: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    proofGenerationMs: randomInt(rng, 180, 420),
    metadata: {
      aggregationType: 'mean',
      timeWindowHours: 24,
      dataPointCount: randomInt(rng, 200, 3000),
    },
  };
}

interface LiveProofButtonProps {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

export default function LiveProofButton({
  variant = 'primary',
  size = 'md',
  className = '',
}: LiveProofButtonProps) {
  const [connecting, setConnecting] = useState(false);
  const [receipt, setReceipt] = useState<VerificationReceipt | null>(null);

  const handleClick = () => {
    setConnecting(true);
    // Simulate device connection
    setTimeout(() => {
      setConnecting(false);
      setReceipt(synthesizeReceipt());
    }, 1000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={connecting}
        className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
          variant === 'primary' ? 'btn-primary' : 'btn-ghost'
        } ${size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'} ${className}`}
      >
        {connecting ? (
          <>
            <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
            Connecting to device...
          </>
        ) : (
          <>
            <Shield size={size === 'sm' ? 12 : 14} />
            Watch a Live Proof
          </>
        )}
      </button>

      {receipt && (
        <ProofAnimation
          receipt={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </>
  );
}
