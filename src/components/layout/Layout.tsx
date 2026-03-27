import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
      <CopilotPanel />
    </div>
  );
}
