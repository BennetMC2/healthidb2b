import { useState } from 'react';
import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface AdvancedToggleProps {
  children: React.ReactNode;
  label?: string;
  defaultOpen?: boolean;
}

export default function AdvancedToggle({ children, label = 'Advanced Parameters', defaultOpen = false }: AdvancedToggleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
      >
        <SlidersHorizontal size={14} />
        <span>{label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-border/60 bg-surface/40 p-4">
          {children}
        </div>
      )}
    </div>
  );
}
