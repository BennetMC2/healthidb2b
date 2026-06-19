import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, HelpCircle, Sun, Moon, Menu, Building2 } from 'lucide-react';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { useThemeStore } from '@/stores/useThemeStore';
import CommandPalette from '@/components/ui/CommandPalette';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import ModelSwitcher, { ModelBadge } from '@/components/layout/ModelSwitcher';

interface HeaderProps {
  onTourStart?: () => void;
  onMobileMenuOpen?: () => void;
}

export default function Header({ onTourStart, onMobileMenuOpen }: HeaderProps) {
  const { currentPartner, allPartners, setCurrentPartner } = usePartnerStore();
  const { theme, toggleTheme } = useThemeStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const sectionLabel = (() => {
    if (location.pathname.startsWith('/app/actuary')) return 'AI Actuary';
    if (location.pathname.startsWith('/app/simulator')) return 'Incentive Simulator';
    if (location.pathname.startsWith('/app/campaigns')) return 'Campaign Studio';
    if (location.pathname.startsWith('/app/cohorts')) return 'Cohorts';
    if (location.pathname.startsWith('/app/explorer')) return 'Cohorts';
    if (location.pathname.startsWith('/app/treasury')) return 'Treasury';
    if (location.pathname.startsWith('/app/models')) return 'Model Studio';
    if (location.pathname.startsWith('/app/compliance')) return 'Verification Trail';
    if (location.pathname.startsWith('/app/settings')) return 'Settings';
    return 'HealthID';
  })();

  // Global Cmd/Ctrl+K shortcut to open command palette.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const commandK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (commandK && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="flex items-center h-[54px] px-4 bg-surface border-b border-border">
        {/* Mobile hamburger */}
        {onMobileMenuOpen && (
          <button
            onClick={onMobileMenuOpen}
            className="flex md:hidden w-[30px] h-[30px] items-center justify-center rounded-sm text-tertiary hover:text-secondary hover:bg-hover transition-colors mr-2"
          >
            <Menu size={16} />
          </button>
        )}

        {/* Breadcrumb area */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xs text-tertiary font-medium uppercase tracking-wider hidden sm:inline">
            HealthID
          </span>
          <span className="text-tertiary hidden sm:inline">/</span>
          <span className="text-2xs text-tertiary font-medium uppercase tracking-wider hidden sm:inline">
            {sectionLabel}
          </span>
          <span className="text-tertiary hidden sm:inline">/</span>
          <span className="text-2xs text-secondary font-medium">
            {currentPartner.label}
          </span>
          {/* Persistent active-model badge — present on every screen (brief §3). */}
          <ModelBadge className="ml-2 hidden md:inline-flex" />
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-[320px] mx-4 hidden sm:block">
          <button
            onClick={() => setPaletteOpen(true)}
            className="relative w-full"
          >
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <div
              className="w-full h-[32px] pl-7 pr-3 bg-base border border-border rounded-sm text-xs text-tertiary flex items-center cursor-pointer hover:border-accent/60 transition-colors"
            >
              Search campaigns, cohorts, receipts...
            </div>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-tertiary bg-surface px-1 rounded-sm border border-border">
              Cmd K
            </kbd>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search icon */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="sm:hidden w-[30px] h-[30px] flex items-center justify-center rounded-sm text-tertiary hover:text-secondary hover:bg-hover transition-colors"
            title="Search"
          >
            <Search size={14} />
          </button>
          {/* Partner Selector */}
          <button
            className="flex h-[30px] w-[30px] items-center justify-center rounded-sm border border-border bg-base text-tertiary hover:bg-hover sm:hidden"
            title={currentPartner.label}
          >
            <Building2 size={14} />
          </button>
          <select
            value={currentPartner.id}
            onChange={(e) => setCurrentPartner(e.target.value)}
            className="hidden h-[32px] max-w-[180px] cursor-pointer rounded-sm border border-border bg-base px-2 text-xs text-secondary focus:border-accent/60 focus:outline-none sm:block"
          >
            {allPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="hidden h-[32px] items-center rounded-sm border border-accent/60 bg-accent/20 px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-secondary lg:flex">
            Demo partner
          </span>

          {/* Global model switcher — switching re-renders every number app-wide. */}
          <ModelSwitcher />

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-[30px] h-[30px] flex items-center justify-center rounded-sm text-tertiary hover:text-secondary hover:bg-hover transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Tour trigger */}
          {onTourStart && (
            <button
              onClick={onTourStart}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-sm text-tertiary hover:text-secondary hover:bg-hover transition-colors opacity-80"
              title="Start guided tour"
            >
              <HelpCircle size={14} />
            </button>
          )}

          {/* Notifications */}
          <NotificationDropdown />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
