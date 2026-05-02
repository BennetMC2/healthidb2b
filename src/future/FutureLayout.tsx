import { Outlet } from 'react-router-dom';
import FutureSidebar from './FutureSidebar';
import FutureHeader from './FutureHeader';

export default function FutureLayout() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-base">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[18%] h-[360px] w-[360px] rounded-full bg-accent-secondary/10 blur-3xl" />
      </div>
      <FutureSidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <FutureHeader />
        <main className="flex-1 overflow-auto scrollbar-thin px-4 py-4 sm:px-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
