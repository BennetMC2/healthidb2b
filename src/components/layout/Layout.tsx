import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDemoStore } from '@/stores/useDemoStore';

interface LayoutProps {
  onTourStart?: () => void;
}

export default function Layout({ onTourStart }: LayoutProps) {
  const demoActive = useDemoStore((s) => s.isActive);

  return (
    <div className="flex h-screen w-screen bg-base overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onTourStart={onTourStart} />
        <main className={`flex-1 overflow-auto scrollbar-thin p-4 ${demoActive ? 'pb-[96px]' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
