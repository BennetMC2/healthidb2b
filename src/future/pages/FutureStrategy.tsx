import { BrainCircuit, Briefcase, HeartPulse, ShieldCheck, Waypoints } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { FutureHero, FuturePanel } from '../FuturePrimitives';

const strategyRows = [
  ['Primary objective', 'Reduce avoidable cardiometabolic claims cost in a defined book over 12-18 months'],
  ['Secondary motion', 'Support underwriting and pre-policy screening from the same intervention engine'],
  ['Core loop', 'Outcome -> cohort -> intervention -> verification -> decision'],
  ['System posture', 'Receipt-level insurer visibility, explicit simulation labels, target-state raw-data minimization'],
];

export default function FutureStrategy() {
  return (
    <div className="flex flex-col gap-4">
      <FutureHero
        eyebrow="Outcome-First Workspace"
        title="Start with the insurer objective, not with a campaign form."
        description="The future product should begin by defining the commercial outcome to drive, the intervention logic to test, and the insurer decision that will follow if the signal is verified."
        badges={['Claims reduction first', 'Underwriting support second', 'Decision-oriented system']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Primary Story" value="Claims Reduction" icon={<HeartPulse size={14} />} />
        <MetricCard label="Secondary Path" value="Underwriting" subValue="pre-policy and screening support" icon={<ShieldCheck size={14} />} />
        <MetricCard label="Decision Horizon" value="12-18 mo" icon={<Waypoints size={14} />} />
        <MetricCard label="Product Category" value="Intervention OS" icon={<Briefcase size={14} />} />
      </div>

      <FuturePanel
        title="What the product is actually for"
        description="A world-class insurer product cannot lead with wellness, wearables, or proofs. Those are components. The product exists to help the insurer define and drive a measurable business outcome."
        aside={<Badge variant="accent">Zero-Based Definition</Badge>}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
          <div className="rounded-2xl border border-border bg-hover/40 px-4 py-4">
            <div className="text-2xs uppercase tracking-[0.18em] text-tertiary">Canonical strategy brief</div>
            <div className="mt-3 divide-y divide-border/80">
              {strategyRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 py-3">
                  <div className="text-xs text-tertiary">{label}</div>
                  <div className="text-sm text-secondary leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="card bg-surface/70">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <BrainCircuit size={13} className="text-accent" />
                Strategy Agent should live here
              </div>
              <p className="mt-2 text-xs leading-relaxed text-tertiary">
                Before any intervention is configured, the agent should challenge the objective, propose the best cohort, compare a claims-oriented path with an underwriting-adjacent path, and flag weak assumptions.
              </p>
            </div>
            <div className="card bg-surface/70">
              <div className="text-xs font-medium text-primary">The wrong start point</div>
              <p className="mt-2 text-xs leading-relaxed text-tertiary">
                If the insurer starts by selecting a metric or reward before defining the decision they want to enable, the product is upside down.
              </p>
            </div>
          </div>
        </div>
      </FuturePanel>

      <FuturePanel
        title="Future information architecture"
        description="A first-principles product should be organized around insurer jobs, not around generic SaaS sections."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            ['Strategy', 'Define the objective, line of business, intervention logic, and action threshold.'],
            ['Population', 'See who is reachable, who is worth reaching, and who is verification-ready.'],
            ['Execution', 'Operate live interventions, track friction, and manage verified movement.'],
            ['Decisions', 'Translate verified outcomes and modeled impact into insurer action.'],
            ['Trust', 'Make the data boundary, receipt model, and target architecture explicit.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-border bg-hover/35 px-4 py-4">
              <div className="text-sm font-semibold text-primary">{title}</div>
              <p className="mt-2 text-xs leading-relaxed text-tertiary">{description}</p>
            </div>
          ))}
        </div>
      </FuturePanel>

      <SectionHeader
        title="Design Rule"
        description="If a future feature does not help define an outcome, shape a cohort, execute an intervention, verify what happened, or drive a decision, it is probably not core."
      />
    </div>
  );
}
