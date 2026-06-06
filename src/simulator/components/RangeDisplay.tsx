import type { Range } from '../types';

interface RangeDisplayProps {
  range: Range;
  format?: 'number' | 'currency' | 'percent' | 'multiple' | 'decimal';
  /** Show all three values or just central */
  compact?: boolean;
  className?: string;
  labelLow?: string;
  labelHigh?: string;
}

function formatValue(value: number, format: RangeDisplayProps['format']): string {
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'multiple':
      return `${value.toFixed(1)}×`;
    case 'decimal':
      return value.toFixed(2);
    default:
      return value >= 1000 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(1);
  }
}

export default function RangeDisplay({
  range,
  format = 'number',
  compact = false,
  className = '',
  labelLow = 'Conservative',
  labelHigh = 'Optimistic',
}: RangeDisplayProps) {
  if (compact) {
    return (
      <span className={`font-mono font-semibold ${className}`}>
        {formatValue(range.central, format)}
      </span>
    );
  }

  return (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="text-xs text-tertiary" title={labelLow}>
        {formatValue(range.low, format)}
      </span>
      <span className="text-tertiary">–</span>
      <span className="font-mono text-lg font-semibold text-primary">
        {formatValue(range.central, format)}
      </span>
      <span className="text-tertiary">–</span>
      <span className="text-xs text-tertiary" title={labelHigh}>
        {formatValue(range.high, format)}
      </span>
    </div>
  );
}

/** Horizontal bar showing range with central marker */
export function RangeBar({ range, max, className = '' }: { range: Range; max: number; className?: string }) {
  const leftPct = (range.low / max) * 100;
  const widthPct = ((range.high - range.low) / max) * 100;
  const centralPct = (range.central / max) * 100;

  return (
    <div className={`relative h-3 w-full rounded-full bg-hover ${className}`}>
      <div
        className="absolute top-0 h-full rounded-full bg-accent/30"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
      <div
        className="absolute top-0 h-full w-0.5 rounded-full bg-accent"
        style={{ left: `${centralPct}%` }}
      />
    </div>
  );
}
