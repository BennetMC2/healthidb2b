import { TrendingUp } from 'lucide-react';
import ChapterLayout from '../../components/ChapterLayout';
import EvidenceCallout from '../../components/EvidenceCallout';
import SourceCitation from '../../components/SourceCitation';
import { METRIC_EVIDENCE } from '../../data/metricEvidence';
import { METRIC_CATEGORY_COLORS, METRIC_CATEGORY_LABELS } from '../../constants';

export default function OpportunityChapter() {
  // Sort by evidence level, then by population at risk
  const sorted = [...METRIC_EVIDENCE].sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 };
    const levelDiff = levelOrder[a.evidenceLevel] - levelOrder[b.evidenceLevel];
    if (levelDiff !== 0) return levelDiff;
    return (b.populationAtRiskPct.high + b.populationAtRiskPct.low) / 2 -
      (a.populationAtRiskPct.high + a.populationAtRiskPct.low) / 2;
  });

  const sources = [...new Set(sorted.map((e) => e.doseResponseSource))];

  return (
    <ChapterLayout chapter={2} sources={sources}>
      <EvidenceCallout title="The health opportunity" type="info">
        Your policyholders have measurable health risks — documented in peer-reviewed studies
        with sample sizes in the hundreds of thousands. Each metric below shows the at-risk
        population, the intervention evidence, and the dose-response relationship.
      </EvidenceCallout>

      <div className="space-y-3">
        {sorted.map((evidence) => {
          const avgRisk = (evidence.populationAtRiskPct.low + evidence.populationAtRiskPct.high) / 2;
          const categoryColor = METRIC_CATEGORY_COLORS[evidence.category];

          return (
            <div key={evidence.metric} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                  >
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary">{evidence.label}</div>
                    <div className="text-xs text-tertiary">{evidence.riskDefinition}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-2xs font-medium"
                    style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                  >
                    {METRIC_CATEGORY_LABELS[evidence.category]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${
                    evidence.evidenceLevel === 'high'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : evidence.evidenceLevel === 'medium'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {evidence.evidenceLevel} evidence
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-2xs text-tertiary">Population at risk</div>
                  <div className="mt-0.5 font-mono text-lg font-semibold text-primary">
                    {(avgRisk * 100).toFixed(0)}%
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-hover">
                    <div className="h-full rounded-full bg-red-400/60" style={{ width: `${avgRisk * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="text-2xs text-tertiary">Behaviour shift</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-primary">
                    {evidence.behaviourShift.value.low.toFixed(1)}–{evidence.behaviourShift.value.high.toFixed(1)}
                  </div>
                  <div className="text-2xs text-secondary">{evidence.behaviourShift.unit}</div>
                </div>
                <div>
                  <div className="text-2xs text-tertiary">Mortality reduction</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-green-500">
                    {(evidence.mortalityRiskReduction.low * 100).toFixed(0)}–{(evidence.mortalityRiskReduction.high * 100).toFixed(0)}%
                  </div>
                  <div className="text-2xs text-secondary">for improvers</div>
                </div>
                <div>
                  <div className="text-2xs text-tertiary">Claims baseline</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-primary">
                    ${evidence.baselineClaimCost.toLocaleString()}
                  </div>
                  <div className="text-2xs text-secondary">per at-risk member/yr</div>
                </div>
              </div>

              <div className="mt-3">
                <SourceCitation
                  source={evidence.doseResponseSource}
                  sampleSize={evidence.doseResponseSampleSize}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChapterLayout>
  );
}
