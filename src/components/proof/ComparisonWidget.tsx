import { useEffect, useState } from 'react';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { industryContexts } from '@/data/partnerContext';

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 1200 }: {
  target: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(prefix + '0' + suffix);

  useEffect(() => {
    // Extract numeric part
    const numericMatch = target.match(/[\d.]+/);
    if (!numericMatch) {
      setDisplay(target);
      return;
    }
    const targetNum = parseFloat(numericMatch[0]);
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * eased;

      if (target.includes('.')) {
        setDisplay(prefix + current.toFixed(1) + suffix);
      } else {
        setDisplay(prefix + Math.round(current) + suffix);
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    }

    requestAnimationFrame(step);
  }, [target, prefix, suffix, duration]);

  return <span>{display}</span>;
}

export default function ComparisonWidget() {
  const { currentPartner } = usePartnerStore();
  const ctx = industryContexts[currentPartner.industry];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const rows = [
    {
      label: 'Cost per verification',
      traditional: ctx.costPerVerification.traditional,
      healthid: ctx.costPerVerification.healthid,
    },
    {
      label: 'Time to verify',
      traditional: ctx.timeToVerify.traditional,
      healthid: ctx.timeToVerify.healthid,
    },
    {
      label: 'PII exposure / month',
      traditional: ctx.piiExposure.traditional,
      healthid: ctx.piiExposure.healthid,
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Traditional */}
      <div className="rounded-xl border border-error/15 bg-error-muted/20 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <ShieldOff size={14} className="text-error/60" />
          <span className="text-xs font-semibold text-error/70 uppercase tracking-wider">Traditional Verification</span>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="text-2xs text-error/50 mb-0.5">{row.label}</div>
              <div className="text-sm font-mono font-semibold text-error/80">
                <AnimatedCounter target={row.traditional} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HealthID */}
      <div className="rounded-xl border border-accent/15 bg-accent-dim/20 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <ShieldCheck size={14} className="text-accent/60" />
          <span className="text-xs font-semibold text-accent/70 uppercase tracking-wider">HealthID ZK Proof</span>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="text-2xs text-accent/50 mb-0.5">{row.label}</div>
              <div className="text-sm font-mono font-semibold text-accent">
                <AnimatedCounter target={row.healthid} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
