import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import CopilotPanel from '@/components/copilot/CopilotPanel';
import { useDemoStore } from '@/stores/useDemoStore';

interface LayoutProps {
  onTourStart?: () => void;
}

export default function Layout({ onTourStart }: LayoutProps) {
  const demoActive = useDemoStore((s) => s.isActive);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative flex h-screen w-screen bg-base overflow-hidden">
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

      {!copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-5 right-4 z-30 flex h-11 items-center gap-2 rounded-full bg-accent px-3 text-base text-base shadow-lg transition-transform hover:scale-[1.02]"
          aria-label="Open strategy agent"
        >
          <MessageSquare size={18} />
          <span className="hidden md:inline text-xs font-medium text-white">Agent</span>
        </button>
      )}
    </div>
  );
}
