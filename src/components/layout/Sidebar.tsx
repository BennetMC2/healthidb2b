import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Globe,
  Target,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  X,
} from 'lucide-react';

const SIDEBAR_KEY = 'healthid_sidebar_expanded';

// HealthID Logomark SVG Component
function HealthIDLogomark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.5 L17.5 5.5 L17.5 13.5 L10 17.5 L2.5 13.5 L2.5 5.5 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeDasharray="0 0 30 3"
      />
      <path
        d="M10 4.5 L14.5 6.5 L14.5 10.5 C14.5 13 10 15.5 10 15.5 C10 15.5 5.5 13 5.5 10.5 L5.5 6.5 Z"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 10 L9.2 12 L12.5 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems = [
  { path: '/campaigns', label: 'Campaign Engine', icon: Target, tourId: 'campaigns-nav' },
  { path: '/explorer', label: 'Member Pool', icon: Globe, tourId: 'explorer-nav' },
  { path: '/compliance', label: 'Verification Trail', icon: ShieldCheck, tourId: 'compliance-nav' },
  { path: '/settings', label: 'Settings', icon: Settings, tourId: undefined },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(expanded));
  }, [expanded]);

  // Close mobile drawer on navigation
  useEffect(() => {
    onMobileClose?.();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarContent = (isMobile: boolean) => (
    <aside
      className={`flex flex-col h-full bg-surface border-r border-border transition-all duration-150 ${
        isMobile ? 'w-[200px]' : expanded ? 'w-[200px]' : 'w-[48px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-[44px] px-3 border-b border-border">
        <div className="text-accent flex-shrink-0">
          <HealthIDLogomark size={24} />
        </div>
        {(isMobile || expanded) && (
          <div className="ml-2 flex flex-col leading-tight">
            <span className="text-sm font-semibold font-display text-primary">HealthID</span>
            <span className="text-2xs font-mono text-accent/70">Campaign Engine</span>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto w-[24px] h-[24px] flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors"
          >
            <X size={14} />
          </button>
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
              {(isMobile || expanded) && (
                <span className="ml-2.5 text-sm truncate">{label}</span>
              )}
              {!isMobile && !expanded && isActive && (
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
            (isMobile || expanded) ? '' : 'justify-center'
          }`}
        >
          <Lock size={12} className="text-accent flex-shrink-0" />
          {(isMobile || expanded) && (
            <span className="text-2xs text-accent font-medium">
              Verified Outcomes Mode
            </span>
          )}
        </div>
      </div>

      {/* Collapse Toggle — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center h-[32px] border-t border-border text-tertiary hover:text-secondary transition-colors"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        {sidebarContent(false)}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-primary/40"
            onClick={onMobileClose}
          />
          <div className="relative z-10 h-full w-fit shadow-lg animate-slide-in-right">
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
