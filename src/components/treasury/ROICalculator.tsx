import { useState, useMemo, useRef, useEffect } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { Calculator } from 'lucide-react';
import { formatCurrency, formatMultiplier } from '@/utils/format';
import { useDemoStore } from '@/stores/useDemoStore';

export default function ROICalculator() {
  const [budget, setBudget] = useState(100000);
  const [months, setMonths] = useState(12);
  const [yieldRate, setYieldRate] = useState(4.5);
  const demoActive = useDemoStore((s) => s.isActive);
  const notifyUserAction = useDemoStore((s) => s.notifyUserAction);

  const results = useMemo(() => {
    const rate = yieldRate / 100;
    const projectedYield = budget * (rate / 12) * months;

    // Buying power bonus scales with budget tier
    let buyingPowerBonus: number;
    if (budget >= 500000) buyingPowerBonus = 0.25;
    else if (budget >= 100000) buyingPowerBonus = 0.20;
    else buyingPowerBonus = 0.15;

    const multiplier = 1 + (projectedYield / budget) + buyingPowerBonus;
    const totalValue = budget * multiplier;

    // Estimated verifications: ~15% of pool converts, ~60% verify
    const estVerifications = Math.round(5000 * 0.15 * 0.6 * (months / 12));
    const costPerVerification = estVerifications > 0 ? budget / estVerifications : 0;

    return {
      projectedYield,
      multiplier,
      totalValue,
      estVerifications,
      costPerVerification,
      buyingPowerBonus,
    };
  }, [budget, months, yieldRate]);

  // Mini growth chart
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 4, right: 4, bottom: 4, left: 4 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const rate = yieldRate / 100;
    const points: number[] = [];
    for (let m = 0; m <= months; m++) {
      const yieldAtMonth = budget * (rate / 12) * m;
      const buyingPower = budget * results.buyingPowerBonus;
      points.push(budget + yieldAtMonth + buyingPower);
    }

    const minV = budget * 0.98;
    const maxV = Math.max(...points) * 1.02;

    const xScale = (i: number) => pad.left + (i / months) * cw;
    const yScale = (v: number) => pad.top + (1 - (v - minV) / (maxV - minV)) * ch;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    gradient.addColorStop(0, 'rgba(76, 165, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(76, 165, 255, 0.0)');

    ctx.beginPath();
    ctx.moveTo(xScale(0), h - pad.bottom);
    points.forEach((v, i) => ctx.lineTo(xScale(i), yScale(v)));
    ctx.lineTo(xScale(months), h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((v, i) => {
      if (i === 0) ctx.moveTo(xScale(i), yScale(v));
      else ctx.lineTo(xScale(i), yScale(v));
    });
    ctx.strokeStyle = '#4ca5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Base budget line
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.moveTo(pad.left, yScale(budget));
    ctx.lineTo(w - pad.right, yScale(budget));
    ctx.strokeStyle = 'rgba(139, 143, 163, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }, [budget, months, yieldRate, results.buyingPowerBonus]);

  return (
    <div className="card" data-walkthrough="roi-calculator">
      <SectionHeader
        title="ROI Projection"
        description="Model the return on your verification budget including T-Bill yield and enterprise buying power."
        icon={<Calculator size={16} />}
      />

      <div className="flex gap-6">
        {/* Inputs */}
        <div className="w-[260px] flex-shrink-0 space-y-4">
          {/* Budget */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-2xs text-tertiary">Budget</label>
              <InfoTooltip content="Total budget to deploy across verification campaigns." />
            </div>
            <input
              type="range"
              min={10000}
              max={1000000}
              step={10000}
              value={budget}
              onChange={(e) => {
                setBudget(+e.target.value);
                if (demoActive) notifyUserAction();
              }}
              className="w-full accent-accent h-1"
            />
            <div className="font-mono text-sm text-primary mt-0.5">
              {formatCurrency(budget)}
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-2xs text-tertiary">Time Horizon</label>
            </div>
            <div className="flex gap-1">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`flex-1 py-1 text-xs font-medium rounded border transition-colors ${
                    months === m
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-base border-border text-tertiary hover:text-secondary'
                  }`}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>

          {/* Yield Rate */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-2xs text-tertiary">Yield Rate (APY)</label>
              <InfoTooltip content="Annual percentage yield from US Treasury Bills. Current short-term T-Bill rates range 4–5%." />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={8}
                step={0.1}
                value={yieldRate}
                onChange={(e) => setYieldRate(+e.target.value)}
                className="flex-1 accent-accent h-1"
              />
              <span className="font-mono text-xs text-primary w-[40px] text-right">
                {yieldRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="card-elevated">
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-tertiary">Projected Yield</span>
                <InfoTooltip content="Estimated yield earned from T-Bills over the selected time horizon." />
              </div>
              <div className="font-mono text-lg font-semibold text-accent mt-0.5">
                {formatCurrency(results.projectedYield)}
              </div>
            </div>
            <div className="card-elevated">
              <span className="text-2xs text-tertiary">Value Multiplier</span>
              <div className="font-mono text-lg font-semibold text-primary mt-0.5">
                {formatMultiplier(results.multiplier)}
              </div>
            </div>
            <div className="card-elevated">
              <span className="text-2xs text-tertiary">Total User Value</span>
              <div className="font-mono text-lg font-semibold text-primary mt-0.5">
                {formatCurrency(results.totalValue)}
              </div>
            </div>
            <div className="card-elevated">
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-tertiary">Est. Cost / Verification</span>
                <InfoTooltip content="Based on estimated pool conversion rate of ~9% and selected budget." />
              </div>
              <div className="font-mono text-lg font-semibold text-primary mt-0.5">
                {formatCurrency(results.costPerVerification)}
              </div>
            </div>
          </div>

          {/* Mini chart */}
          <div className="card-elevated p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xs text-tertiary">Projected Growth</span>
              <span className="text-2xs font-mono text-accent">
                {months}mo →{' '}
                {formatCurrency(results.totalValue)}
              </span>
            </div>
            <canvas ref={canvasRef} className="w-full h-[60px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
