const STANDARD_COST = 100; // normalized baseline
const ENGAGED_COST = 96; // 4% reduction
const REDUCTION_PCT = 4;

const evidence = [
  { metric: '180% ROI', label: 'High engagement programs (Vitality)' },
  { metric: '34% Activity Lift', label: 'Sustained increase (RAND Europe)' },
  { metric: '$462/member', label: 'Annual savings per engaged participant' },
];

export default function ClaimsImpactChart() {
  return (
    <div className="card h-full flex flex-col">
      <span className="metric-label block mb-3">Claims Impact</span>

      {/* Bar comparison */}
      <div className="flex items-end gap-4 justify-center flex-1 min-h-[140px] pb-2">
        {/* Standard bar */}
        <div className="flex flex-col items-center gap-1.5 w-24">
          <span className="text-2xs font-mono text-tertiary">{STANDARD_COST}%</span>
          <div
            className="w-full bg-secondary/20 rounded-t"
            style={{ height: `${STANDARD_COST * 1.2}px` }}
          />
          <span className="text-2xs text-tertiary text-center leading-tight">Standard Policyholder</span>
        </div>

        {/* Reduction callout */}
        <div className="flex flex-col items-center justify-center self-center -mx-1">
          <div className="text-accent font-mono text-sm font-bold">{REDUCTION_PCT}%</div>
          <div className="text-2xs text-tertiary">Cost Reduction</div>
        </div>

        {/* Engaged bar */}
        <div className="flex flex-col items-center gap-1.5 w-24">
          <span className="text-2xs font-mono text-accent">{ENGAGED_COST}%</span>
          <div
            className="w-full bg-accent/30 rounded-t"
            style={{ height: `${ENGAGED_COST * 1.2}px` }}
          />
          <span className="text-2xs text-accent text-center leading-tight">Engaged User</span>
        </div>
      </div>

      {/* Evidence callouts */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
        {evidence.map((e) => (
          <div key={e.metric} className="text-center">
            <span className="font-mono text-xs font-bold text-accent block">{e.metric}</span>
            <span className="text-2xs text-tertiary leading-tight">{e.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
