import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { CHAPTERS } from './constants';
import type { ChapterId } from './types';
import { useSimulatorStore } from './store/useSimulatorStore';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/simulator': {
    title: 'Overview',
    description: 'Build an evidence-grounded ROI case for campaign-driven health outcomes.',
  },
  '/simulator/evidence': {
    title: 'Evidence Library',
    description: 'Peer-reviewed citations with effect sizes, DOIs, and study designs.',
  },
  '/simulator/results': {
    title: 'Results',
    description: 'Full presentation of all 7 chapters with cited numbers.',
  },
};

export default function SimulatorHeader() {
  const location = useLocation();
  const chapterCompletion = useSimulatorStore((s) => s.chapterCompletion);

  // Check if on a chapter page
  const chapterMatch = location.pathname.match(/\/simulator\/build\/(\d+)/);
  const activeChapter = chapterMatch ? parseInt(chapterMatch[1]) as ChapterId : null;
  const chapterDef = activeChapter ? CHAPTERS.find((c) => c.id === activeChapter) : null;

  const page = chapterDef
    ? { title: `Ch ${activeChapter}: ${chapterDef.title}`, description: chapterDef.subtitle }
    : pageTitles[location.pathname] ?? pageTitles['/simulator'];

  // Progress indicator
  const completedCount = Object.values(chapterCompletion).filter(Boolean).length;
  const progressPct = (completedCount / 7) * 100;

  return (
    <header className="border-b border-border bg-surface/92 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.2em] text-accent/80">
            <FlaskConical size={11} />
            Campaign-Centric ROI Simulator
          </div>
          <h1 className="mt-2 text-xl font-semibold text-primary font-display">{page.title}</h1>
          <p className="mt-1 max-w-[760px] text-sm leading-relaxed text-tertiary">{page.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress indicator */}
          {completedCount > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-1.5 w-20 rounded-full bg-hover">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-2xs text-tertiary">{completedCount}/7</span>
            </div>
          )}
          <Link to="/app/actuary" className="btn-ghost text-xs">
            <ArrowLeft size={13} />
            Back To Platform
          </Link>
        </div>
      </div>
    </header>
  );
}
