import { Activity, AlertTriangle, CheckCircle2, TimerReset } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import { FutureHero, FuturePanel } from '../FuturePrimitives';

const executionRows = [
  ['Programme objective', 'Reduce cardiac-related claims risk in a defined 45+ life cohort'],
  ['Intervention format', '90-day recovery and monitoring programme with ambient wearable checkpoints'],
  ['Main execution risk', 'Drop-off after week three if the member proposition is too thin'],
  ['Fallback motion', 'Reuse the same receipt logic in underwriting or renewal journeys'],
];

const issues = [
  { title: 'Participation softness in week 3', severity: 'warning', detail: 'Observed across sleep-heavy cohorts with weak immediate value.' },
  { title: 'Strong verification consistency in RHR stream', severity: 'success', detail: 'Signal quality remains high enough to support intervention decisions.' },
  { title: 'Lab-source dependency too high for one underwriting variant', severity: 'error', detail: 'Would slow rollout unless insurer accepts a narrower cohort.' },
];

export default function FutureExecution() {
  return (
    <div className="flex flex-col gap-4">
      <FutureHero
        eyebrow="Operational Layer"
        title="Execution should feel alive, operational, and intervention-native."
        description="The future product needs an execution console that shows programme health, friction, verified movement, and the operational issues that threaten business outcomes."
        badges={['Programme health', 'Friction visibility', 'Operational leverage']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Live Programmes" value="12" icon={<Activity size={14} />} />
        <MetricCard label="Verified Milestones" value="7.6k" icon={<CheckCircle2 size={14} />} />
        <MetricCard label="Main Friction Point" value="Week 3" subValue="behavioral drop-off window" icon={<TimerReset size={14} />} />
        <MetricCard label="Open Risks" value="3" icon={<AlertTriangle size={14} />} />
      </div>

      <FuturePanel
        title="Execution is where the product proves it is an operating system"
        description="This is not reporting after the fact. This is where insurer teams run the intervention, catch friction early, and decide whether the programme is on track to create the intended business outcome."
      >
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className="rounded-2xl border border-border bg-hover/35 px-4 py-4">
            <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Live operating brief</div>
            <div className="mt-3 divide-y divide-border/80">
              {executionRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 py-3">
                  <div className="text-xs text-tertiary">{label}</div>
                  <div className="text-sm text-secondary leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue.title} className="rounded-2xl border border-border bg-surface/75 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-primary">{issue.title}</div>
                  <Badge variant={issue.severity as 'success' | 'warning' | 'error'}>
                    {issue.severity === 'success' ? 'Contained' : issue.severity === 'warning' ? 'Watch' : 'Action'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-tertiary">{issue.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </FuturePanel>
    </div>
  );
}
