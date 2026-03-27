import { useState, useEffect } from 'react';
import { Search, HelpCircle, CheckCircle, Sun, Moon, Menu } from 'lucide-react';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { useThemeStore } from '@/stores/useThemeStore';
import CommandPalette from '@/components/ui/CommandPalette';
import NotificationDropdown from '@/components/layout/NotificationDropdown';

interface HeaderProps {
  onTourStart?: () => void;
  onMobileMenuOpen?: () => void;
}

export default function Header({ onTourStart, onMobileMenuOpen }: HeaderProps) {
  const { currentPartner, allPartners, setCurrentPartner } = usePartnerStore();
  const { theme, toggleTheme } = useThemeStore();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global "/" shortcut to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
      <header className="flex items-center h-[44px] px-4 bg-surface border-b border-border">
        {/* Mobile hamburger */}
        {onMobileMenuOpen && (
          <button
            onClick={onMobileMenuOpen}
            className="flex md:hidden w-[30px] h-[30px] items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors mr-2"
          >
            <Menu size={16} />
          </button>
        )}

        {/* Breadcrumb area */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xs text-tertiary font-medium uppercase tracking-wider hidden sm:inline">
            Universal Infrastructure
          </span>
          <span className="text-tertiary hidden sm:inline">/</span>
          <span className="text-2xs text-secondary font-medium">
            {currentPartner.label}
          </span>
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
              className="w-full h-[30px] pl-7 pr-3 bg-base border border-border rounded text-xs text-tertiary flex items-center cursor-pointer hover:border-accent/30 transition-colors"
            >
              Search identities, campaigns, proofs...
            </div>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-tertiary bg-elevated px-1 rounded-sm border border-border">
              /
            </kbd>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Uptime/Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 h-[30px] rounded border border-border bg-base mr-1 group relative">
            <CheckCircle size={10} className="text-success" />
            <span className="text-2xs text-tertiary font-mono">99.97%</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-elevated border border-border text-2xs text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              All Systems Operational
            </span>
          </div>

          {/* Partner Selector */}
          <select
            value={currentPartner.id}
            onChange={(e) => setCurrentPartner(e.target.value)}
            className="h-[30px] px-2 bg-base border border-border rounded text-xs text-secondary focus:outline-none focus:border-accent/30 cursor-pointer"
          >
            {allPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-[30px] h-[30px] flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Tour trigger */}
          {onTourStart && (
            <button
              onClick={onTourStart}
              className="w-[30px] h-[30px] flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors"
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
