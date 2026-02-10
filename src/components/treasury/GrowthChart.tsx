import { useMemo, useRef, useEffect } from 'react';
import type { TreasurySnapshot } from '@/types';
import { formatCurrency } from '@/utils/format';

interface GrowthChartProps {
  data: TreasurySnapshot[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { minVal, maxVal } = useMemo(() => {
    const values = data.map((d) => d.totalBudget + d.cumulativeYield);
    return {
      minVal: Math.min(...values) * 0.95,
      maxVal: Math.max(...values) * 1.02,
    };
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 8, right: 8, bottom: 20, left: 8 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // Helper to map data to canvas coords
    const xScale = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
    const yScale = (v: number) => padding.top + (1 - (v - minVal) / (maxVal - minVal)) * chartH;

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, 'rgba(76, 165, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(76, 165, 255, 0.0)');

    ctx.beginPath();
    ctx.moveTo(xScale(0), h - padding.bottom);
    data.forEach((d, i) => {
      ctx.lineTo(xScale(i), yScale(d.totalBudget + d.cumulativeYield));
    });
    ctx.lineTo(xScale(data.length - 1), h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.totalBudget + d.cumulativeYield);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#4ca5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw base budget line (dashed)
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.totalBudget);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(139, 143, 163, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis labels (first, middle, last)
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5c6070';
    ctx.textAlign = 'center';

    const labelIndices = [0, Math.floor(data.length / 2), data.length - 1];
    labelIndices.forEach((i) => {
      const d = new Date(data[i].date);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(label, xScale(i), h - 4);
    });
  }, [data, minVal, maxVal]);

  const latestValue = data.length > 0
    ? data[data.length - 1].totalBudget + data[data.length - 1].cumulativeYield
    : 0;

  return (
    <div className="relative h-[180px]">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 text-right">
        <div className="font-mono text-xs text-accent">{formatCurrency(latestValue)}</div>
        <div className="text-2xs text-tertiary">current value</div>
      </div>
    </div>
  );
}
