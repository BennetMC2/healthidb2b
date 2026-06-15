import { useMemo } from 'react';
import { Skull, ArrowRight } from 'lucide-react';
import { calculateActuarialROI, useEconomics } from '@/lib/economics';
import { formatCurrency, formatNumber } from '@/utils/format';
import { useCampaignStore } from '@/stores/useCampaignStore';
import type { Campaign } from '@/types';

interface KillCampaignModalProps {
  campaign: Campaign;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function KillCampaignModal({ campaign, onConfirm, onCancel }: KillCampaignModalProps) {
  const allCampaigns = useCampaignStore((s) => s.campaigns);
  const eco = useEconomics();

  const remainingBudget = Math.max(campaign.rewards.budgetCeiling - campaign.rewards.budgetSpent, 0);

  // Find top active campaigns by ROI for reallocation
  const reallocationPreview = useMemo(() => {
    const activeCampaigns = allCampaigns
      .filter((c) => c.id !== campaign.id && c.status === 'active')
      .map((c) => {
        const roi = calculateActuarialROI(eco, {
          metric: c.challenge.metric,
          type: c.type,
          useCase: c.useCase,
          maxParticipants: c.funnel.enrolled,
          budgetCeiling: c.rewards.budgetCeiling,
          applyAdjustments: true,
        });
        return { campaign: c, roi: roi.budgetROI };
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 3);

    if (activeCampaigns.length === 0 || remainingBudget === 0) return [];

    const totalROI = activeCampaigns.reduce((s, c) => s + c.roi, 0);
    return activeCampaigns.map((c) => {
      const share = totalROI > 0 ? c.roi / totalROI : 1 / activeCampaigns.length;
      const allocation = Math.round(remainingBudget * share);
      const additionalVerified = Math.round(allocation / Math.max(c.campaign.rewards.budgetCeiling / Math.max(c.campaign.funnel.verified, 1), 50));
      return {
        name: c.campaign.name,
        allocation,
        additionalVerified,
        roi: c.roi,
      };
    });
  }, [allCampaigns, campaign, remainingBudget, eco]);

  return (
    <div className="fixed inset-0 z-[9900] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-base/60 backdrop-blur-sm" />
      <div
        className="relative w-[min(480px,92vw)] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Skull size={16} className="text-error" />
            <h3 className="text-sm font-semibold text-primary">Kill Campaign</h3>
          </div>
          <p className="mt-1 text-xs text-secondary">
            Terminate <span className="font-medium text-primary">"{campaign.name}"</span> and reallocate the remaining budget.
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface/80 px-3 py-2">
            <span className="text-2xs text-tertiary">Remaining Budget</span>
            <span className="font-mono text-sm font-semibold text-primary">{formatCurrency(remainingBudget)}</span>
          </div>

          {reallocationPreview.length > 0 ? (
            <div>
              <div className="text-2xs text-tertiary mb-2 uppercase tracking-wider">Reallocation Preview</div>
              <div className="space-y-2">
                {reallocationPreview.map((r) => (
                  <div key={r.name} className="rounded-xl border border-border bg-surface/80 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary truncate max-w-[220px]">{r.name}</span>
                      <span className="font-mono text-xs text-accent">{formatCurrency(r.allocation)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-2xs text-tertiary">
                      <span>ROI {r.roi.toFixed(1)}x</span>
                      <ArrowRight size={10} />
                      <span className="text-secondary">+{formatNumber(r.additionalVerified)} projected verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-tertiary">
              No active campaigns available for budget reallocation.
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">Cancel</button>
          <button onClick={onConfirm} className="btn-destructive text-xs">
            Kill & Reallocate
          </button>
        </div>
      </div>
    </div>
  );
}
