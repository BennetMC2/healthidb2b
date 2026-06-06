const LAYERS = [
  { id: 'L1', label: 'Signal Matrix', description: 'Wearable + clinical + user-reported signals', color: '#22c55e' },
  { id: 'L2', label: 'Confidence Scoring', description: 'Per signal × data source confidence', color: '#3b82f6' },
  { id: 'L3', label: 'Cohort & Risk Levers', description: '6 behaviour levers × cohort definitions', color: '#8b5cf6' },
  { id: 'L4', label: 'Behaviour Change Rules', description: 'Clinical + behavioural-econ overlay', color: '#f59e0b' },
  { id: 'L5', label: 'Reward Function', description: 'Per-client configurable incentives', color: '#ef4444' },
  { id: 'L6', label: 'ROI Output', description: 'Insurer cockpit + actuarial view', color: '#1D7A5E' },
];

export default function FlowDiagram() {
  return (
    <div className="space-y-0">
      {LAYERS.map((layer, i) => (
        <div key={layer.id}>
          <div className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white"
              style={{ backgroundColor: layer.color }}
            >
              {layer.id}
            </div>
            <div className="flex-1 rounded-lg border border-border/60 bg-surface/40 px-4 py-2.5">
              <div className="text-sm font-semibold text-primary font-display">{layer.label}</div>
              <div className="text-2xs text-tertiary">{layer.description}</div>
            </div>
          </div>
          {i < LAYERS.length - 1 && (
            <div className="ml-[18px] h-4 w-0.5 rounded-full" style={{ backgroundColor: LAYERS[i + 1].color, opacity: 0.3 }} />
          )}
        </div>
      ))}
    </div>
  );
}
