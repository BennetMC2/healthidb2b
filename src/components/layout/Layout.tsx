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
  const [copilotMobileOpen, setCopilotMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen bg-base overflow-hidden">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0">
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
            className={`flex-1 overflow-auto scrollbar-thin p-4 ${demoActive ? 'pb-[148px]' : ''}`}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <Footer />
      </div>
      {/* Desktop copilot — always visible on md+ */}
      <div className="hidden md:flex w-[320px] shrink-0 border-l border-border">
        <CopilotPanel />
      </div>

      {/* Mobile copilot — overlay triggered by FAB */}
      {copilotMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-primary/30 backdrop-blur-sm"
            onClick={() => setCopilotMobileOpen(false)}
          />
          <div className="w-[min(320px,92vw)] h-full border-l border-border flex flex-col shadow-xl">
            <CopilotPanel onClose={() => setCopilotMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile copilot FAB */}
      {!copilotMobileOpen && (
        <button
          onClick={() => setCopilotMobileOpen(true)}
          className="md:hidden fixed bottom-5 right-4 z-30 w-11 h-11 rounded-full bg-accent text-base shadow-lg flex items-center justify-center"
          aria-label="Open Copilot"
        >
          <MessageSquare size={18} />
        </button>
      )}
    </div>
  );
}
