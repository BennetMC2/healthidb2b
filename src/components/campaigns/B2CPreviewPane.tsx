import { Bell, Moon } from 'lucide-react';

const sparklineData = [
  { x: 0, y: 72 }, { x: 1, y: 68 }, { x: 2, y: 75 },
  { x: 3, y: 65 }, { x: 4, y: 70 }, { x: 5, y: 62 },
  { x: 6, y: 78 }, { x: 7, y: 60 }, { x: 8, y: 73 },
  { x: 9, y: 55 }, { x: 10, y: 68 }, { x: 11, y: 80 },
];

function MiniSparkline() {
  const width = 200;
  const height = 60;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const minY = Math.min(...sparklineData.map((d) => d.y));
  const maxY = Math.max(...sparklineData.map((d) => d.y));

  const points = sparklineData
    .map((d, i) => {
      const x = padding + (i / (sparklineData.length - 1)) * chartW;
      const y = padding + (1 - (d.y - minY) / (maxY - minY)) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E07A5F" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#E07A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#spark-grad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#E07A5F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function B2CPreviewPane() {
  return (
    <div className="card w-[260px] flex-shrink-0">
      <div className="text-2xs text-tertiary uppercase tracking-wider font-medium mb-3">
        B2C User Preview
      </div>

      {/* Phone mockup frame */}
      <div className="rounded-xl border-2 border-border bg-base p-3 mx-auto max-w-[220px]">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xs font-mono text-tertiary">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-tertiary/30 rounded-sm" />
            <div className="w-3 h-1.5 bg-tertiary/30 rounded-sm" />
          </div>
        </div>

        {/* Notification */}
        <div className="rounded-lg border border-accent/20 bg-accent-muted p-2 mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Bell size={10} className="text-accent" />
            <span className="text-2xs font-semibold text-primary">Predictive Guidance</span>
          </div>
          <p className="text-2xs text-secondary leading-relaxed">
            I noticed your sleep quality drops when you have high-intensity workouts after 8 PM.
          </p>
        </div>

        {/* Chart */}
        <div className="rounded-lg border border-border bg-surface p-2">
          <div className="flex items-center gap-1 mb-1">
            <Moon size={10} className="text-accent" />
            <span className="text-2xs font-medium text-primary">Sleep vs. Workout Time</span>
          </div>
          <MiniSparkline />
          <div className="flex justify-between mt-1">
            <span className="text-2xs text-tertiary">6 PM</span>
            <span className="text-2xs text-tertiary">10 PM</span>
          </div>
        </div>

        {/* Home bar */}
        <div className="w-12 h-1 bg-border-light rounded-full mx-auto mt-3" />
      </div>
    </div>
  );
}
