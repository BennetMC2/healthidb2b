import { ArrowRightCircle, CircleDashed, ShieldCheck, TrendingUp } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import { FutureHero, FuturePanel } from '../FuturePrimitives';

const decisions = [
  {
    title: 'Expand intervention into adjacent cardiac-risk cohort',
    confidence: 'High',
    detail: 'Verified recovery signals are strong enough to justify broader deployment before the next pricing cycle.',
    tag: 'Verified',
  },
  {
    title: 'Use the same receipt logic for pre-policy screening pilot',
    confidence: 'Medium',
    detail: 'The underwriting-adjacent path is easier to explain and can de-risk adoption while the claims case matures.',
    tag: 'Verified + modeled',
  },
  {
    title: 'Do not scale the sleep-only claims narrative yet',
    confidence: 'Low',
    detail: 'The engagement is healthy but the causal claims story is too weak to lead in a serious buyer discussion.',
    tag: 'Modeled only',
  },
];

export default function FutureDecisions() {
  return (
    <div className="flex flex-col gap-4">
      <FutureHero
        eyebrow="Action Layer"
        title="The product becomes essential when it tells the insurer what to do next."
        description="A strong future product does not stop at programme analytics. It translates verified movement, modeled impact, and evidence strength into next-step insurer decisions."
        badges={['Verified vs inferred', 'Business action', 'Decision confidence']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Recommended Actions" value="6" icon={<ArrowRightCircle size={14} />} />
        <MetricCard label="Verified Decision Inputs" value="4" icon={<ShieldCheck size={14} />} />
        <MetricCard label="Modeled Scenarios" value="9" icon={<CircleDashed size={14} />} />
        <MetricCard label="Business Upside" value="$4.8M" subValue="directional 18-month range" icon={<TrendingUp size={14} />} />
      </div>

      <FuturePanel
        title="What is missing from the current product"
        description="Decisioning is the layer that makes the system feel like business leverage rather than just observation. It is where intervention outcome becomes insurer action."
      >
        <div className="space-y-3">
          {decisions.map((decision) => (
            <div key={decision.title} className="rounded-2xl border border-border bg-surface/75 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-primary">{decision.title}</div>
                  <p className="mt-2 text-xs leading-relaxed text-tertiary max-w-[760px]">{decision.detail}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <Badge variant={decision.confidence === 'High' ? 'success' : decision.confidence === 'Medium' ? 'warning' : 'muted'}>
                    {decision.confidence} confidence
                  </Badge>
                  <span className="text-2xs text-tertiary">{decision.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FuturePanel>
    </div>
  );
}
