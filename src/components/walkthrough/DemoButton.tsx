import { PlayCircle } from 'lucide-react';
import { useDemoStore } from '@/stores/useDemoStore';

export default function DemoButton() {
  const startDemo = useDemoStore((s) => s.startDemo);

  return (
    <button
      onClick={startDemo}
      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded border border-accent/30 bg-accent-dim text-accent hover:bg-accent/15 hover:border-accent/50 transition-colors"
    >
      <PlayCircle size={16} />
      Start Interactive Demo
    </button>
  );
}
