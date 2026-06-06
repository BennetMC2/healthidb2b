import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { calculateActuarialROI } from '@/utils/actuarial';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { Campaign } from '@/types';

interface ScaleCampaignModalProps {
  campaign: Campaign;
  onConfirm: (newBudget: number) => void;
  onCancel: () => void;
}

export default function ScaleCampaignModal({ campaign, onConfirm, onCancel }: ScaleCampaignModalProps) {
  const currentBudget = campaign.rewards.budgetCeiling;
  const [scalePct, setScalePct] = useState(150);

  const newBudget = Math.round(currentBudget * scalePct / 100);

  const projections = useMemo(() => {
    const currentROI = calculateActuarialROI({
      metric: campaign.challenge.metric,
      type: campaign.type,
      useCase: campaign.useCase,
      maxParticipants: campaign.funnel.enrolled,
      budgetCeiling: currentBudget,
      applyAdjustments: true,
    });

    // Apply sqrt scaling above 150% for diminishing returns
    const scaleFactor = scalePct / 100;
    const effectiveScale = scaleFactor <= 1.5 ? scaleFactor : 1.5 + Math.sqrt(scaleFactor - 1.5) * 0.6;

    const projectedEnrolled = Math.round(campaign.funnel.enrolled * effectiveScale);
    const projectedVerified = Math.round(campaign.funnel.verified * effectiveScale);
    const projectedRewarded = Math.round(campaign.funnel.rewarded * effectiveScale);
    const projectedROI = calculateActuarialROI({
      metric: campaign.challenge.metric,
      type: campaign.type,
      useCase: campaign.useCase,
      maxParticipants: projectedEnrolled,
      budgetCeiling: newBudget,
      applyAdjustments: true,
    });

    return {
      current: {
        enrolled: campaign.funnel.enrolled,
        verified: campaign.funnel.verified,
        rewarded: campaign.funnel.rewarded,
        roi: currentROI.budgetROI,
        payback: currentROI.paybackMonths,
      },
      projected: {
        enrolled: projectedEnrolled,
        verified: projectedVerified,
        rewarded: projectedRewarded,
        roi: projectedROI.budgetROI,
        payback: projectedROI.paybackMonths,
      },
    };
  }, [campaign, currentBudget, newBudget, scalePct]);

  return (
    <div className="fixed inset-0 z-[9900] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-base/60 backdrop-blur-sm" />
      <div
        className="relative w-[min(520px,92vw)] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-primary">Scale Campaign</h3>
          </div>
          <p className="mt-1 text-xs text-secondary">
            Adjust the budget for <span className="font-medium text-primary">"{campaign.name}"</span>
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Budget Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs text-tertiary">Budget Scale</span>
              <span className="font-mono text-sm font-semibold text-accent">{scalePct}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={scalePct}
              onChange={(e) => setScalePct(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex items-center justify-between text-2xs text-tertiary mt-1">
              <span>50%</span>
              <span>Current</span>
              <span>300%</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface/80 px-3 py-2">
            <span className="text-2xs text-tertiary">New Budget</span>
            <span className="font-mono text-sm font-semibold text-primary">{formatCurrency(newBudget)}</span>
          </div>

          {/* Impact Preview Table */}
          <div>
            <div className="text-2xs text-tertiary mb-2 uppercase tracking-wider">Impact Preview</div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-hover/50">
                    <th className="text-left px-3 py-1.5 text-tertiary font-medium">Metric</th>
                    <th className="text-right px-3 py-1.5 text-tertiary font-medium">Current</th>
                    <th className="text-right px-3 py-1.5 text-tertiary font-medium">Projected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-1.5 text-secondary">Enrolled</td>
                    <td className="px-3 py-1.5 text-right font-mono text-secondary">{formatNumber(projections.current.enrolled)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-primary font-medium">{formatNumber(projections.projected.enrolled)}</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-1.5 text-secondary">Verified</td>
                    <td className="px-3 py-1.5 text-right font-mono text-secondary">{formatNumber(projections.current.verified)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-primary font-medium">{formatNumber(projections.projected.verified)}</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-1.5 text-secondary">Rewarded</td>
                    <td className="px-3 py-1.5 text-right font-mono text-secondary">{formatNumber(projections.current.rewarded)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-primary font-medium">{formatNumber(projections.projected.rewarded)}</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-1.5 text-secondary">Budget ROI</td>
                    <td className="px-3 py-1.5 text-right font-mono text-secondary">{projections.current.roi.toFixed(1)}x</td>
                    <td className="px-3 py-1.5 text-right font-mono text-primary font-medium">{projections.projected.roi.toFixed(1)}x</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-1.5 text-secondary">Payback</td>
                    <td className="px-3 py-1.5 text-right font-mono text-secondary">{projections.current.payback}mo</td>
                    <td className="px-3 py-1.5 text-right font-mono text-primary font-medium">{projections.projected.payback}mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {scalePct > 150 && (
            <div className="rounded-xl bg-warning-muted border border-warning/20 px-3 py-2 text-2xs text-warning">
              Scaling above 150% applies diminishing returns. Impact growth is sub-linear beyond this threshold.
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">Cancel</button>
          <button onClick={() => onConfirm(newBudget)} className="btn-primary text-xs">
            Apply New Budget
          </button>
        </div>
      </div>
    </div>
  );
}
