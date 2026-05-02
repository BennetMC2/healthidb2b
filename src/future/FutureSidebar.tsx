import { NavLink } from 'react-router-dom';
import { BrainCircuit, Radar, PlaySquare, Waypoints, ShieldCheck } from 'lucide-react';

const items = [
  { path: '/future/strategy', label: 'Strategy', icon: BrainCircuit },
  { path: '/future/population', label: 'Population', icon: Radar },
  { path: '/future/execution', label: 'Execution', icon: PlaySquare },
  { path: '/future/decisions', label: 'Decisions', icon: Waypoints },
  { path: '/future/trust', label: 'Trust', icon: ShieldCheck },
];

export default function FutureSidebar() {
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border bg-surface/92 backdrop-blur-sm">
      <div className="flex h-[56px] items-center border-b border-border px-4">
        <div>
          <div className="text-sm font-semibold text-primary font-display">HealthID Future OS</div>
          <div className="text-2xs text-accent/80 font-mono">First-Principles Concept</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex h-[38px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                isActive ? 'bg-accent/12 text-accent' : 'text-tertiary hover:bg-hover hover:text-secondary'
              }`
            }
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-accent/15 bg-accent/5 px-3 py-3">
          <div className="text-2xs uppercase tracking-[0.18em] text-accent/80">Working Thesis</div>
          <p className="mt-2 text-xs leading-relaxed text-secondary">
            An insurer operating system for verified health interventions, not a dashboard and not a wellness app.
          </p>
        </div>
      </div>
    </aside>
  );
}
