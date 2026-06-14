interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export default function Sparkline({ data, width = 80, height = 24, color = 'var(--a-accent)', className }: SparklineProps) {
  if (!data.length || data.length < 2) return null;

  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + (1 - (v - min) / range) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
