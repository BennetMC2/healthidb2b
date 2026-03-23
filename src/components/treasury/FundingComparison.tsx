const rows = [
  {
    dimension: 'Access',
    traditional: 'Closed Loop (Policyholders only)',
    healthid: 'Open Network (Universal Identity)',
  },
  {
    dimension: 'Data Model',
    traditional: 'Custodial (Risk of Breach)',
    healthid: 'Non-Custodial (ZK Verified)',
  },
  {
    dimension: 'Funding',
    traditional: '100% Budget (Cost Center)',
    healthid: 'Budget + Treasury Yield',
  },
  {
    dimension: 'Rewards',
    traditional: 'Low Value / Discounts',
    healthid: 'Aspirational (Travel / Experiences)',
  },
];

export default function FundingComparison() {
  return (
    <div className="card">
      <span className="metric-label block mb-3">The Shift from Closed Loops to Open Networks</span>
      <div className="grid grid-cols-[120px_1fr_1fr] gap-y-2 gap-x-3 text-2xs">
        {/* Header row */}
        <div />
        <div className="text-tertiary uppercase tracking-wider font-medium pb-1 border-b border-border">
          Traditional (Vitality / Manulife)
        </div>
        <div className="text-accent uppercase tracking-wider font-medium pb-1 border-b border-border">
          HealthID (The New Way)
        </div>

        {/* Data rows */}
        {rows.map((r) => (
          <>
            <div key={r.dimension} className="text-tertiary font-medium py-1.5">{r.dimension}</div>
            <div className="text-secondary py-1.5">{r.traditional}</div>
            <div className="text-accent py-1.5 font-medium">{r.healthid}</div>
          </>
        ))}
      </div>
    </div>
  );
}
