import { type ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  children?: ReactNode;
}

export default function MetricCard({
  label,
  value,
  subValue,
  icon,
  trend,
  className = '',
  children,
}: MetricCardProps) {
  return (
    <div className={`card flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="metric-label">{label}</span>
          {children}
        </div>
        {icon && <span className="text-tertiary">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="metric-value">{value}</span>
        {subValue && (
          <span className="text-xs text-tertiary">{subValue}</span>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={`text-2xs font-mono font-medium ${
              trend.value >= 0 ? 'text-success' : 'text-error'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-2xs text-tertiary">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
