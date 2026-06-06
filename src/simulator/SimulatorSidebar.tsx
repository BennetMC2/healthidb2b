import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BarChart3, CheckCircle2,
} from 'lucide-react';
import { CHAPTERS } from './constants';
import { useSimulatorStore } from './store/useSimulatorStore';
import type { ChapterId } from './types';

export default function SimulatorSidebar() {
  const location = useLocation();
  const chapterCompletion = useSimulatorStore((s) => s.chapterCompletion);

  // Determine active chapter from URL
  const chapterMatch = location.pathname.match(/\/simulator\/build\/(\d+)/);
  const activeChapter = chapterMatch ? parseInt(chapterMatch[1]) as ChapterId : null;

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border bg-surface/92 backdrop-blur-sm">
      <div className="flex h-[56px] items-center border-b border-border px-4">
        <div>
          <div className="text-sm font-semibold text-primary font-display">ROI Simulator</div>
          <div className="text-2xs text-accent/80 font-mono">Campaign-Centric v3</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-auto scrollbar-thin px-2 py-3">
        {/* Overview */}
        <NavLink
          to="/simulator"
          end
          className={({ isActive }) =>
            `flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
              isActive ? 'bg-accent/12 text-accent' : 'text-tertiary hover:bg-hover hover:text-secondary'
            }`
          }
        >
          <LayoutDashboard size={14} />
          <span>Overview</span>
        </NavLink>

        {/* Chapter divider */}
        <div className="px-3 pt-3 pb-1">
          <div className="text-2xs uppercase tracking-[0.15em] text-tertiary/60">Build Your Case</div>
        </div>

        {/* Chapters */}
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          const isComplete = chapterCompletion[ch.id];

          return (
            <NavLink
              key={ch.id}
              to={ch.path}
              className={`flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                isActive
                  ? 'bg-accent/12 text-accent'
                  : 'text-tertiary hover:bg-hover hover:text-secondary'
              }`}
            >
              <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                isComplete
                  ? 'bg-green-500/15 text-green-500'
                  : isActive
                    ? 'bg-accent/15 text-accent'
                    : 'bg-hover text-tertiary'
              }`}>
                {isComplete ? <CheckCircle2 size={10} /> : ch.id}
              </span>
              <span className="truncate">{ch.title}</span>
            </NavLink>
          );
        })}

        {/* Results + Evidence */}
        <div className="px-3 pt-3 pb-1">
          <div className="text-2xs uppercase tracking-[0.15em] text-tertiary/60">View</div>
        </div>

        <NavLink
          to="/simulator/results"
          className={({ isActive }) =>
            `flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
              isActive ? 'bg-accent/12 text-accent' : 'text-tertiary hover:bg-hover hover:text-secondary'
            }`
          }
        >
          <BarChart3 size={14} />
          <span>Results</span>
        </NavLink>
        <NavLink
          to="/simulator/evidence"
          className={({ isActive }) =>
            `flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
              isActive ? 'bg-accent/12 text-accent' : 'text-tertiary hover:bg-hover hover:text-secondary'
            }`
          }
        >
          <BookOpen size={14} />
          <span>Evidence</span>
        </NavLink>
      </nav>
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-accent/15 bg-accent/5 px-3 py-3">
          <div className="text-2xs uppercase tracking-[0.18em] text-accent/80">Evidence Chain</div>
          <p className="mt-2 text-xs leading-relaxed text-secondary">
            Population → Campaigns → Behaviour → Health → Financial → Sensitivity
          </p>
        </div>
      </div>
    </aside>
  );
}
