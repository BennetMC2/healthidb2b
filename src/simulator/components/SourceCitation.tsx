import { STUDY_DESIGN_LABELS } from '../constants';
import type { StudyDesign } from '../types';

interface SourceCitationProps {
  source: string;
  studyDesign?: StudyDesign;
  sampleSize?: number;
  className?: string;
}

const DESIGN_COLORS: Record<StudyDesign, string> = {
  rct: 'bg-green-500/10 text-green-600 dark:text-green-400',
  meta_analysis: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  cohort_study: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  industry_review: 'bg-slate-500/10 text-slate-500',
};

export default function SourceCitation({ source, studyDesign, sampleSize, className = '' }: SourceCitationProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-2xs ${className}`}>
      {studyDesign && (
        <span className={`rounded-full px-2 py-0.5 font-medium ${DESIGN_COLORS[studyDesign]}`}>
          {STUDY_DESIGN_LABELS[studyDesign]}
        </span>
      )}
      {sampleSize != null && sampleSize > 0 && (
        <span className="rounded-full bg-hover px-2 py-0.5 text-tertiary">
          n={sampleSize.toLocaleString()}
        </span>
      )}
      <span className="text-tertiary">{source}</span>
    </div>
  );
}
