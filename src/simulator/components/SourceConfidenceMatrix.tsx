import { SOURCE_CONFIDENCE_BANDS } from '../data/sourceConfidence';
import { DATA_SOURCE_LABELS } from '@/utils/constants';
import { SIGNALS } from '../data/signals';

export default function SourceConfidenceMatrix() {
  const sources = SOURCE_CONFIDENCE_BANDS.map((b) => b.source);

  function getCellColor(confidence: number): string {
    if (confidence >= 0.75) return 'bg-green-500/30 text-green-400';
    if (confidence >= 0.55) return 'bg-accent/20 text-accent';
    if (confidence >= 0.35) return 'bg-amber-500/20 text-amber-400';
    return 'bg-secondary/10 text-tertiary';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-tertiary font-normal">Signal</th>
            {sources.map((source) => (
              <th key={source} className="py-2 px-1 text-tertiary font-normal text-center whitespace-nowrap">
                {DATA_SOURCE_LABELS[source]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SIGNALS.slice(0, 12).map((signal) => (
            <tr key={signal.id} className="border-t border-border/40">
              <td className="py-1.5 px-2 text-secondary font-medium">{signal.label}</td>
              {sources.map((source) => {
                const isAvailable = signal.sources.includes(source);
                const band = SOURCE_CONFIDENCE_BANDS.find((b) => b.source === source);
                const confidence = isAvailable && band ? band.baseConfidence : 0;

                return (
                  <td key={source} className="py-1.5 px-1 text-center">
                    {isAvailable ? (
                      <span className={`inline-block rounded px-1.5 py-0.5 text-2xs font-mono ${getCellColor(confidence)}`}>
                        {Math.round(confidence * 100)}
                      </span>
                    ) : (
                      <span className="text-2xs text-border">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
