import type { LeverBreakdown } from '../types';
import { LEVER_COLORS } from '../constants';
import { formatCurrencyCompact } from '@/utils/format';

interface LeverBreakdownTableProps {
  breakdowns: LeverBreakdown[];
}

export default function LeverBreakdownTable({ breakdowns }: LeverBreakdownTableProps) {
  const total = breakdowns.reduce((sum, b) => sum + b.savingsContribution, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-2xs text-tertiary">
            <th className="py-2 pr-3 font-normal">Lever</th>
            <th className="py-2 px-3 font-normal text-right">Signal Movement</th>
            <th className="py-2 px-3 font-normal text-right">Savings Contribution</th>
            <th className="py-2 px-3 font-normal text-right">% of Total</th>
            <th className="py-2 px-3 font-normal">Evidence</th>
            <th className="py-2 pl-3 font-normal text-right">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {breakdowns.map((b) => {
            const pct = total > 0 ? (b.savingsContribution / total) * 100 : 0;
            const color = LEVER_COLORS[b.lever];
            const evidenceColor = b.evidenceLevel === 'high' ? 'text-green-500' : b.evidenceLevel === 'medium' ? 'text-amber-400' : 'text-secondary';

            return (
              <tr key={b.lever} className="border-b border-border/40">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-primary font-medium">{b.label}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs">
                  {b.signalMovement > 0 ? '+' : ''}{Math.round(b.signalMovement * 100)}pp
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-primary">
                  {formatCurrencyCompact(b.savingsContribution)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs text-secondary font-mono w-8 text-right">{Math.round(pct)}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-2xs font-medium ${evidenceColor}`}>{b.evidenceLevel}</span>
                </td>
                <td className="py-2.5 pl-3 text-right font-mono text-xs text-secondary">
                  {Math.round(b.confidenceScore * 100)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td className="py-2.5 pr-3 text-sm font-semibold text-primary">Total</td>
            <td className="py-2.5 px-3" />
            <td className="py-2.5 px-3 text-right font-mono text-sm font-semibold text-primary">
              {formatCurrencyCompact(total)}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-xs text-secondary">100%</td>
            <td className="py-2.5 px-3" />
            <td className="py-2.5 pl-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
