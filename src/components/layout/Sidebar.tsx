import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Globe,
  Target,
  Vault,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

const navItems = [
  { path: '/overview', label: 'Overview', icon: BookOpen, tourId: 'overview-nav' },
  { path: '/explorer', label: 'Network Explorer', icon: Globe, tourId: 'explorer-nav' },
  { path: '/campaigns', label: 'Campaigns', icon: Target, tourId: 'campaigns-nav' },
  { path: '/treasury', label: 'Treasury', icon: Vault, tourId: 'treasury-nav' },
  { path: '/compliance', label: 'Compliance', icon: ShieldCheck, tourId: 'compliance-nav' },
  { path: '/settings', label: 'Settings', icon: Settings, tourId: undefined },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`flex flex-col h-full bg-surface border-r border-border transition-all duration-150 ${
        expanded ? 'w-[200px]' : 'w-[48px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-[40px] px-3 border-b border-border">
        <div className="w-[22px] h-[22px] rounded-sm bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-2xs font-bold font-mono">H</span>
        </div>
        {expanded && (
          <span className="ml-2 text-sm font-semibold text-primary truncate">
            HealthID
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon, tourId }) => {
          const isActive =
            location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));

          return (
            <NavLink
              key={path}
              to={path}
              data-tour={tourId}
              className={`flex items-center h-[32px] mx-1 px-2.5 rounded transition-colors duration-100 group ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-tertiary hover:text-secondary hover:bg-hover'
              }`}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.5}
                className="flex-shrink-0"
              />
              {expanded && (
                <span className="ml-2.5 text-sm truncate">{label}</span>
              )}
              {!expanded && isActive && (
                <div className="absolute left-0 w-[2px] h-4 bg-accent rounded-r" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ZK Mode Badge */}
      <div className="px-2 pb-2" data-tour="zk-badge">
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded bg-accent-dim border border-accent/10 ${
            expanded ? '' : 'justify-center'
          }`}
        >
          <Lock size={12} className="text-accent flex-shrink-0" />
          {expanded && (
            <span className="text-2xs text-accent font-medium">
              Zero-Knowledge Mode
            </span>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center h-[32px] border-t border-border text-tertiary hover:text-secondary transition-colors"
      >
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
}
