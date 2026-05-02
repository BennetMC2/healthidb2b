import { EyeOff, FileCheck2, LockKeyhole, ServerCog } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import { FutureHero, FuturePanel } from '../FuturePrimitives';

const trustRows = [
  ['What the insurer sees', 'Objectives, cohorts, receipt-level outcomes, decision recommendations, audit trail'],
  ['What HealthID handles', 'Orchestration, consent flow, verification workflow, reporting, strategic agent layer'],
  ['What raw data should do', 'Stay out of insurer-facing surfaces and stay confined to the intended pilot architecture boundary'],
  ['What is simulated today', 'Members, receipt activity, financial scenarios, and target-state architectural posture'],
];

export default function FutureTrust() {
  return (
    <div className="flex flex-col gap-4">
      <FutureHero
        eyebrow="Explicit Boundary"
        title="Trust should be a visible system boundary, not a vibe."
        description="The future product needs a dedicated trust workspace that makes the data boundary, receipt model, simulation labels, and target architecture obvious before diligence forces the conversation."
        badges={['Explicit simulation labels', 'Receipt model', 'Target-state architecture']}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Insurer Raw Data Views" value="0" icon={<EyeOff size={14} />} />
        <MetricCard label="Receipt-Level Surfaces" value="5" icon={<FileCheck2 size={14} />} />
        <MetricCard label="Simulation Markers" value="Visible" icon={<LockKeyhole size={14} />} />
        <MetricCard label="Deployment Posture" value="Target-state" subValue="managed enterprise boundary" icon={<ServerCog size={14} />} />
      </div>

      <FuturePanel
        title="Trust boundary table"
        description="This should be one of the strongest parts of the future product because it answers the diligence questions before they become objections."
      >
        <div className="rounded-2xl border border-border bg-hover/35 px-4 py-4">
          <div className="divide-y divide-border/80">
            {trustRows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[170px_minmax(0,1fr)] gap-4 py-3">
                <div className="text-xs text-tertiary">{label}</div>
                <div className="text-sm text-secondary leading-relaxed">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </FuturePanel>
    </div>
  );
}
