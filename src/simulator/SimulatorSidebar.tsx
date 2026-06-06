import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wand2, Users, Radio, BookOpen,
  Crosshair, Gift, Play, BarChart3, GitBranch,
  FileCheck, Settings, GitCompareArrows, Workflow, Search,
} from 'lucide-react';

const items = [
  { path: '/simulator/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/simulator/architecture', label: 'Architecture', icon: Workflow },
  { path: '/simulator/inspector', label: 'Model Inspector', icon: Search },
  { path: '/simulator/scenario', label: 'Scenario', icon: Wand2 },
  { path: '/simulator/cohort', label: 'Cohort', icon: Users },
  { path: '/simulator/signals', label: 'Signals', icon: Radio },
  { path: '/simulator/evidence', label: 'Evidence', icon: BookOpen },
  { path: '/simulator/interventions', label: 'Interventions', icon: Crosshair },
  { path: '/simulator/rewards', label: 'Rewards', icon: Gift },
  { path: '/simulator/run', label: 'Run', icon: Play },
  { path: '/simulator/output', label: 'Output', icon: BarChart3 },
  { path: '/simulator/bridge', label: 'Bridge', icon: GitBranch },
  { path: '/simulator/audit', label: 'Audit', icon: FileCheck },
  { path: '/simulator/settings', label: 'Settings', icon: Settings },
  { path: '/simulator/compare', label: 'Compare', icon: GitCompareArrows },
];

export default function SimulatorSidebar() {
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border bg-surface/92 backdrop-blur-sm">
      <div className="flex h-[56px] items-center border-b border-border px-4">
        <div>
          <div className="text-sm font-semibold text-primary font-display">Behaviour Simulator</div>
          <div className="text-2xs text-accent/80 font-mono">Actuarial Model v1</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-auto scrollbar-thin px-2 py-3">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                isActive ? 'bg-accent/12 text-accent' : 'text-tertiary hover:bg-hover hover:text-secondary'
              }`
            }
          >
            <Icon size={14} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-accent/15 bg-accent/5 px-3 py-3">
          <div className="text-2xs uppercase tracking-[0.18em] text-accent/80">Model Basis</div>
          <p className="mt-2 text-xs leading-relaxed text-secondary">
            6-layer actuarial model: signals, confidence, cohorts, rules, rewards, ROI output.
          </p>
        </div>
      </div>
    </aside>
  );
}
