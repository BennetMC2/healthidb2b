import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Rocket } from 'lucide-react';
import type { ConsumerCampaignDispatchResponse } from '@/lib/consumerCampaigns';

interface LaunchSuccessProps {
  state: 'deploying' | 'success' | 'error';
  summary?: ConsumerCampaignDispatchResponse;
  errorMessage?: string;
  onComplete: () => void;
}

const phases = [
  { text: 'Deploying verification circuit...', duration: 600 },
  { text: 'Configuring proof parameters...', duration: 500 },
  { text: 'Dispatching member challenges...', duration: 500 },
];

export default function LaunchSuccess({ state, summary, errorMessage, onComplete }: LaunchSuccessProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (state !== 'deploying') {
      setPhase(phases.length);
      const redirectTimer = setTimeout(() => onComplete(), 2200);
      return () => clearTimeout(redirectTimer);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;

    phases.forEach((p, i) => {
      delay += p.duration;
      timers.push(setTimeout(() => setPhase(i + 1), delay));
    });

    return () => timers.forEach(clearTimeout);
  }, [state, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" />
      <div className="relative card w-[min(400px,92vw)] text-center animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 ${
            state === 'success'
              ? 'bg-success/10 border-2 border-success/30'
              : state === 'error'
                ? 'bg-warning-muted border-2 border-warning/20'
                : 'bg-accent/10 border-2 border-accent/20'
          }`}>
            {state === 'success' ? (
              <CheckCircle size={32} className="text-success animate-fade-in" />
            ) : state === 'error' ? (
              <AlertTriangle size={30} className="text-warning animate-fade-in" />
            ) : (
              <Rocket size={28} className="text-accent animate-pulse" />
            )}
          </div>
        </div>

        {/* Phase text */}
        <div className="min-h-[88px] flex flex-col items-center justify-center">
          {state === 'success' ? (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-primary">Campaign Live In Both Apps</h3>
              <p className="text-xs text-tertiary mt-1">
                {summary?.inviteCount
                  ? `${summary.inviteCount} member challenges dispatched`
                  : 'Campaign launched successfully'}
              </p>
              {summary && (
                <p className="text-2xs text-tertiary mt-2">
                  {summary.acceptedCount} accepted · {summary.verifiedCount} verified · {summary.rewardedCount} rewarded
                </p>
              )}
            </div>
          ) : state === 'error' ? (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-primary">Campaign Launched, Dispatch Needs Attention</h3>
              <p className="text-xs text-tertiary mt-1">
                {errorMessage || summary?.error || 'The consumer app did not confirm member delivery.'}
              </p>
              <p className="text-2xs text-warning mt-2">Redirecting to the campaign detail view...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {phases.slice(0, phase).map((p, i) => (
                <div key={i} className="flex items-center gap-2 justify-center animate-slide-in">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    i < phase - 1 ? 'bg-success' : 'bg-accent animate-pulse'
                  }`} />
                  <span className={`text-xs ${
                    i < phase - 1 ? 'text-tertiary' : 'text-secondary'
                  }`}>
                    {p.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
