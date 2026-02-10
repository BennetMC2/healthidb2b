import { Search, Bell, HelpCircle } from 'lucide-react';
import { usePartnerStore } from '@/stores/usePartnerStore';

interface HeaderProps {
  onTourStart?: () => void;
}

export default function Header({ onTourStart }: HeaderProps) {
  const { currentPartner, allPartners, setCurrentPartner } = usePartnerStore();

  return (
    <header className="flex items-center h-[40px] px-4 bg-surface border-b border-border">
      {/* Breadcrumb area */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xs text-tertiary font-medium uppercase tracking-wider">
          Infrastructure
        </span>
        <span className="text-tertiary">/</span>
        <span className="text-2xs text-secondary font-medium">
          {currentPartner.label}
        </span>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-[320px] mx-4">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-tertiary"
          />
          <input
            type="text"
            placeholder="Search identities, campaigns, proofs..."
            className="w-full h-[28px] pl-7 pr-3 bg-base border border-border rounded text-xs text-secondary placeholder:text-tertiary focus:outline-none focus:border-accent/30 transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-tertiary bg-elevated px-1 rounded-sm border border-border">
            /
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Partner Selector */}
        <select
          value={currentPartner.id}
          onChange={(e) => setCurrentPartner(e.target.value)}
          className="h-[28px] px-2 bg-base border border-border rounded text-xs text-secondary focus:outline-none focus:border-accent/30 cursor-pointer"
        >
          {allPartners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Tour trigger */}
        {onTourStart && (
          <button
            onClick={onTourStart}
            className="w-[28px] h-[28px] flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors"
            title="Start guided tour"
          >
            <HelpCircle size={14} />
          </button>
        )}

        {/* Notifications */}
        <button className="relative w-[28px] h-[28px] flex items-center justify-center rounded text-tertiary hover:text-secondary hover:bg-hover transition-colors">
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent rounded-full" />
        </button>
      </div>
    </header>
  );
}
