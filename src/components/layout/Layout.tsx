import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import CopilotPanel from '@/components/copilot/CopilotPanel';
import { useDemoStore } from '@/stores/useDemoStore';
import { useExperienceStore } from '@/stores/useExperienceStore';
import { actuaryInsights } from '@/data/actuaryInsights';

interface LayoutProps {
  onTourStart?: () => void;
}

export default function Layout({ onTourStart }: LayoutProps) {
  const demoActive = useDemoStore((s) => s.isActive);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [widgetDismissed, setWidgetDismissed] = useState(false);
  const executiveMode = useExperienceStore((s) => s.executiveMode);
  const location = useLocation();
  const navigate = useNavigate();
  const hideActuaryWidget = location.pathname === '/app/actuary' || location.pathname === '/app/campaigns/new';

  return (
    <div className="relative flex h-screen w-screen bg-base overflow-hidden" data-executive-mode={executiveMode}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <Header
          onTourStart={onTourStart}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`flex-1 overflow-auto scrollbar-thin px-4 py-5 sm:px-7 sm:py-6 ${demoActive ? 'pb-[148px]' : ''}`}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <Footer />
      </div>

      {copilotOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-primary/30 backdrop-blur-sm"
            onClick={() => setCopilotOpen(false)}
          />
          <div className="relative h-full w-[min(360px,92vw)] border-l border-border bg-surface shadow-2xl">
            <CopilotPanel onClose={() => setCopilotOpen(false)} />
          </div>
        </div>
      )}

      {/* Synthetic demo disclosure — persistent */}
      <div className="fixed bottom-3 left-16 z-30 hidden sm:flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-[0.6rem] text-tertiary shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
        Synthetic demo — modelled examples
      </div>

      {!copilotOpen && !widgetDismissed && !hideActuaryWidget && (
        <div className="group fixed bottom-4 right-3 z-30 w-[min(420px,calc(100vw-24px))] rounded-sm border border-border bg-surface px-3 py-2 shadow-none sm:bottom-5 sm:right-4 sm:w-[min(420px,calc(100vw-32px))] sm:px-4 sm:py-3">
          <button
            onClick={() => setWidgetDismissed(true)}
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-tertiary hover:bg-hover hover:text-primary"
            aria-label="Dismiss AI Actuary widget"
          >
            <X size={12} />
          </button>
          <button
            onClick={() => navigate('/app/actuary')}
            className="block w-full pr-4 text-left"
            aria-label="Open campaign intelligence cockpit"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-[pulseDot_2s_ease-in-out_infinite]" />
              AI Actuary · {actuaryInsights.length} signal plays
            </div>
            <div className="mt-1 hidden text-sm leading-snug text-secondary sm:block">
              {actuaryInsights.map(i => i.signal).join(', ')} campaigns modelled against est. book value.
              <span className="ml-1 font-medium text-accent">View {'->'}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
