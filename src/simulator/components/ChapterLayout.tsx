import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ChapterId } from '../types';
import { CHAPTERS } from '../constants';
import { useSimulatorStore } from '../store/useSimulatorStore';

interface ChapterLayoutProps {
  chapter: ChapterId;
  children: React.ReactNode;
  sources?: string[];
  /** Whether this chapter's requirements are met to proceed */
  canProceed?: boolean;
  onProceed?: () => void;
}

export default function ChapterLayout({ chapter, children, sources, canProceed = true, onProceed }: ChapterLayoutProps) {
  const navigate = useNavigate();
  const completeChapter = useSimulatorStore((s) => s.completeChapter);
  const def = CHAPTERS.find((c) => c.id === chapter)!;
  const prevChapter = CHAPTERS.find((c) => c.id === (chapter - 1) as ChapterId);
  const nextChapter = CHAPTERS.find((c) => c.id === (chapter + 1) as ChapterId);

  const handleNext = () => {
    completeChapter(chapter);
    onProceed?.();
    if (nextChapter) {
      navigate(nextChapter.path);
    } else {
      navigate('/simulator/results');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Chapter header */}
      <div>
        <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.2em] text-accent/80">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
            {chapter}
          </span>
          Chapter {chapter} of 7
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-primary font-display">{def.title}</h2>
        <p className="mt-1 text-sm text-tertiary">{def.subtitle}</p>
      </div>

      {/* Content */}
      <div className="space-y-5">
        {children}
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-3">
          <div className="text-2xs font-semibold uppercase tracking-[0.15em] text-tertiary">Sources</div>
          <ul className="mt-2 space-y-1">
            {sources.map((s, i) => (
              <li key={i} className="text-xs text-secondary leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {prevChapter ? (
          <button
            onClick={() => navigate(prevChapter.path)}
            className="btn-ghost text-sm"
          >
            <ChevronLeft size={14} />
            {prevChapter.title}
          </button>
        ) : (
          <button
            onClick={() => navigate('/simulator')}
            className="btn-ghost text-sm"
          >
            <ChevronLeft size={14} />
            Overview
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary text-sm disabled:opacity-40"
        >
          {nextChapter ? nextChapter.title : 'View Results'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
