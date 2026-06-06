import { ExternalLink, Users, FlaskConical, BookOpen } from 'lucide-react';
import type { EvidenceCitation } from '../types';
import { STUDY_DESIGN_LABELS } from '../constants';
import { formatNumber } from '@/utils/format';

interface EvidenceCardProps {
  evidence: EvidenceCitation;
}

const designIcons: Record<string, typeof FlaskConical> = {
  rct: FlaskConical,
  meta_analysis: BookOpen,
  cohort_study: Users,
  industry_review: BookOpen,
};

export default function EvidenceCard({ evidence }: EvidenceCardProps) {
  const DesignIcon = designIcons[evidence.studyDesign] ?? BookOpen;
  const levelColor = evidence.evidenceLevel === 'high' ? 'text-green-500 bg-green-500/10 border-green-500/20'
    : evidence.evidenceLevel === 'medium' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    : 'text-secondary bg-secondary/10 border-border';

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary font-display leading-snug">{evidence.title}</h3>
          <p className="mt-1 text-xs text-tertiary">{evidence.authors} ({evidence.year})</p>
          <p className="text-xs text-tertiary italic">{evidence.journal}</p>
        </div>
        {evidence.doi && (
          <a
            href={`https://doi.org/${evidence.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-accent hover:text-accent/80"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-medium ${levelColor}`}>
          {evidence.evidenceLevel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-2xs text-secondary">
          <DesignIcon size={10} />
          {STUDY_DESIGN_LABELS[evidence.studyDesign]}
        </span>
        {evidence.sampleSize > 0 && (
          <span className="text-2xs text-tertiary font-mono">n={formatNumber(evidence.sampleSize)}</span>
        )}
      </div>

      <div className="rounded-lg border border-accent/15 bg-accent/5 px-3 py-2">
        <div className="text-2xs text-accent/70 uppercase tracking-wider mb-1">Effect Size</div>
        <p className="text-xs text-secondary leading-relaxed">{evidence.effectSize}</p>
      </div>

      <div className="text-xs text-tertiary">
        <span className="font-medium text-secondary">Model Usage: </span>
        {evidence.modelUsage}
      </div>
    </div>
  );
}
