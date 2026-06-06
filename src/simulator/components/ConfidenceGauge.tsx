interface ConfidenceGaugeProps {
  value: number; // 0-1
  label: string;
  size?: number;
}

export default function ConfidenceGauge({ value, label, size = 100 }: ConfidenceGaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)));

  const color = value >= 0.62 ? '#1D7A5E' : value >= 0.40 ? '#B8860B' : '#8896AB';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        {/* Background arc */}
        <path
          d={`M 6 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-border"
        />
        {/* Value arc */}
        <path
          d={`M 6 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 2}`}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
        {/* Value text */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          className="fill-primary font-display text-lg font-semibold"
          fontSize={size * 0.2}
        >
          {Math.round(value * 100)}%
        </text>
      </svg>
      <span className="text-2xs text-tertiary">{label}</span>
    </div>
  );
}
