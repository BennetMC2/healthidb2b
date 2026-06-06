import { Outlet } from 'react-router-dom';
import SimulatorSidebar from './SimulatorSidebar';
import SimulatorHeader from './SimulatorHeader';

export default function SimulatorLayout() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-base">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-6%] top-[22%] h-[340px] w-[340px] rounded-full bg-accent-secondary/10 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[30%] h-[280px] w-[280px] rounded-full bg-accent/6 blur-3xl" />
      </div>
      <SimulatorSidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <SimulatorHeader />
        <main className="flex-1 overflow-auto scrollbar-thin px-4 py-4 sm:px-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
