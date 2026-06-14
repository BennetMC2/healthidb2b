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
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-15%] h-[340px] w-[340px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[280px] w-[280px] rounded-full bg-accent-secondary/10 blur-3xl" />
      </div>
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
            className={`flex-1 overflow-auto scrollbar-thin px-3 py-4 sm:p-4 ${demoActive ? 'pb-[148px]' : ''}`}
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
      <div className="fixed bottom-3 left-16 z-30 hidden sm:flex items-center gap-2 rounded-full border border-border bg-elevated/90 backdrop-blur-sm px-3 py-1.5 font-mono text-[0.6rem] text-tertiary shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
        Synthetic demo — modelled examples
      </div>

      {!copilotOpen && !widgetDismissed && !hideActuaryWidget && (
        <div className="group fixed bottom-4 right-3 z-30 w-[min(420px,calc(100vw-24px))] rounded-xl border border-border bg-elevated px-3 py-2 shadow-none sm:bottom-5 sm:right-4 sm:w-[min(420px,calc(100vw-32px))] sm:px-4 sm:py-3">
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
              AI Actuary · 4 signal plays
            </div>
            <div className="mt-1 hidden text-sm leading-snug text-secondary sm:block">
              VO2 Max, HRV, sleep, and resting HR campaigns are priced against book value.
              <span className="ml-1 font-medium text-accent">View {'->'}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
