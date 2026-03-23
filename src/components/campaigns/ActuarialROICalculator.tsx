import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ActuarialROICalculatorProps {
  audienceSize: number;
}

const COST_PER_MEMBER_YEAR = 462;
const CLAIMS_REDUCTION = 0.04;
const ROI_MULTIPLE = 1.80;

export default function ActuarialROICalculator({ audienceSize }: ActuarialROICalculatorProps) {
  const metrics = useMemo(() => {
    const size = Math.max(audienceSize, 0);
    const projectedSavings = size * COST_PER_MEMBER_YEAR * CLAIMS_REDUCTION;
    const totalMemberValue = size * COST_PER_MEMBER_YEAR;
    return {
      projectedSavings,
      totalMemberValue,
      roi: ROI_MULTIPLE,
      claimsReduction: CLAIMS_REDUCTION,
    };
  }, [audienceSize]);

  return (
    <div className="card border-accent/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
          <TrendingUp size={14} className="text-accent" />
        </div>
        <div>
          <span className="text-xs font-semibold text-primary">Actuarial ROI Projection</span>
          <span className="text-2xs text-tertiary ml-2">Vitality Programme Data</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <span className="text-2xs text-tertiary block">Member Value / Year</span>
          <span className="font-mono text-sm font-semibold text-primary">${COST_PER_MEMBER_YEAR}</span>
        </div>
        <div>
          <span className="text-2xs text-tertiary block">Projected Claims Reduction</span>
          <span className="font-mono text-sm font-semibold text-accent">
            {(metrics.claimsReduction * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-2xs text-tertiary block">Projected Savings</span>
          <span className="font-mono text-sm font-semibold text-success">
            {formatCurrency(metrics.projectedSavings)}
          </span>
        </div>
        <div>
          <span className="text-2xs text-tertiary block">Estimated ROI</span>
          <span className="font-mono text-sm font-semibold text-accent">
            {(metrics.roi * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-2xs text-tertiary mt-2">
        Based on {audienceSize.toLocaleString()} participants at ${COST_PER_MEMBER_YEAR}/member/year with {(CLAIMS_REDUCTION * 100).toFixed(0)}% claims reduction (Vitality programme data).
      </p>
    </div>
  );
}
