import { useEffect, useState } from 'react';
import { CheckCircle, Rocket } from 'lucide-react';

interface LaunchSuccessProps {
  onComplete: () => void;
}

const phases = [
  { text: 'Deploying verification circuit...', duration: 600 },
  { text: 'Configuring proof parameters...', duration: 500 },
  { text: 'Campaign live!', duration: 400 },
];

export default function LaunchSuccess({ onComplete }: LaunchSuccessProps) {
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;

    phases.forEach((p, i) => {
      delay += p.duration;
      timers.push(setTimeout(() => setPhase(i + 1), delay));
    });

    // Show success state
    delay += 400;
    timers.push(setTimeout(() => setDone(true), delay));

    // Auto-redirect
    delay += 2000;
    timers.push(setTimeout(() => onComplete(), delay));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" />
      <div className="relative card w-[400px] text-center animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 ${
            done
              ? 'bg-success/10 border-2 border-success/30'
              : 'bg-accent/10 border-2 border-accent/20'
          }`}>
            {done ? (
              <CheckCircle size={32} className="text-success animate-fade-in" />
            ) : (
              <Rocket size={28} className="text-accent animate-pulse" />
            )}
          </div>
        </div>

        {/* Phase text */}
        <div className="min-h-[48px] flex flex-col items-center justify-center">
          {done ? (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-primary">Campaign Launched</h3>
              <p className="text-xs text-tertiary mt-1">Redirecting to campaigns...</p>
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
