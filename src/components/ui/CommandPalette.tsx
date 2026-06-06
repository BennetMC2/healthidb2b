import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Target, Globe, ShieldCheck, X, BrainCircuit, Moon, Building2 } from 'lucide-react';
import { campaigns, identities, complianceRecords } from '@/data';
import { useThemeStore } from '@/stores/useThemeStore';
import { usePartnerStore } from '@/stores/usePartnerStore';

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof Target;
  route: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { allPartners, setCurrentPartner } = usePartnerStore();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        // Parent handles open state
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    // Search campaigns
    campaigns
      .filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((c) => {
        out.push({
          id: c.id,
          label: c.name,
          sublabel: `Campaign \u00b7 ${c.status} \u00b7 ${c.type}`,
          icon: Target,
          route: `/app/campaigns/${c.id}`,
        });
      });

    // Search identities by anonymizedId
    identities
      .filter((i) => i.anonymizedId.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((i) => {
        out.push({
          id: i.id,
          label: i.anonymizedId,
          sublabel: `Identity \u00b7 ${i.reputationTier} \u00b7 Score ${i.healthScore}`,
          icon: Globe,
          route: '/app/cohorts',
        });
      });

    // Search compliance events
    complianceRecords
      .filter((r) => r.details.toLowerCase().includes(q) || r.eventType.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((r) => {
        out.push({
          id: r.id,
          label: r.details,
          sublabel: `Compliance \u00b7 ${r.eventType.replace(/_/g, ' ')}`,
          icon: ShieldCheck,
          route: '/app/compliance',
        });
      });

    return out.slice(0, 8);
  }, [query]);

  if (!open) return null;

  const commands = [
    { id: 'ask', label: 'Ask the Actuary Copilot', sublabel: 'Open the AI Actuary command center and focus the input', icon: BrainCircuit, action: () => navigate('/app/actuary?focusCopilot=1') },
    { id: 'plays', label: "Show today's opportunities", sublabel: 'Review wearable signal campaigns', icon: Target, action: () => navigate('/app/actuary') },
    { id: 'campaigns', label: 'Go to Campaign Studio', sublabel: 'Open campaign portfolio and builder', icon: Target, action: () => navigate('/app/campaigns') },
    { id: 'pool', label: 'Go to Cohorts', sublabel: 'Explore risk cohorts and anonymous members', icon: Globe, action: () => navigate('/app/cohorts') },
    { id: 'trail', label: 'Go to Verification Trail', sublabel: 'Audit proof receipts', icon: ShieldCheck, action: () => navigate('/app/compliance') },
    { id: 'theme', label: 'Toggle dark mode', sublabel: 'Switch presentation theme', icon: Moon, action: () => toggleTheme() },
  ];

  return (
    <div className="fixed inset-0 z-[9800] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-base/60 backdrop-blur-sm" />
      <div
        className="relative w-[min(520px,92vw)] bg-surface border border-border rounded-lg shadow-2xl animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns, identities, compliance events..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-tertiary outline-none"
          />
          <button onClick={onClose} className="text-tertiary hover:text-secondary">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[320px] overflow-auto scrollbar-thin py-1">
            {results.length > 0 ? (
              results.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      navigate(r.route);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-hover transition-colors text-left"
                  >
                    <Icon size={14} className="text-accent/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary truncate">{r.label}</div>
                      <div className="text-2xs text-tertiary">{r.sublabel}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-tertiary">
                No results for "{query}"
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="max-h-[420px] overflow-auto py-2">
            <div className="px-4 pb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Commands</div>
            {commands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-hover"
                >
                  <Icon size={14} className="text-accent/70" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-primary">{command.label}</div>
                    <div className="text-2xs text-tertiary">{command.sublabel}</div>
                  </div>
                </button>
              );
            })}
            <div className="mt-2 px-4 pb-2 pt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Switch partner</div>
            {allPartners.map((partner) => (
              <button
                key={partner.id}
                onClick={() => {
                  setCurrentPartner(partner.id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-hover"
              >
                <Building2 size={14} className="text-accent/70" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-primary">{partner.label}</div>
                  <div className="text-2xs text-tertiary">Load partner-specific portfolio</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
