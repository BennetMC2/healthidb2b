import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/future/strategy': {
    title: 'Outcome Design',
    description: 'Define the insurer objective, intervention logic, and commercial decision boundary.',
  },
  '/future/population': {
    title: 'Reachable Population',
    description: 'Understand who can be reached, who is worth reaching, and who is verification-ready.',
  },
  '/future/execution': {
    title: 'Programme Execution',
    description: 'Operate live interventions, monitor friction, and track verified movement as it happens.',
  },
  '/future/decisions': {
    title: 'Decision Layer',
    description: 'Translate verified outcomes and modeled impact into insurer action.',
  },
  '/future/trust': {
    title: 'Trust Boundary',
    description: 'Make the data boundary, receipt model, and target architecture explicit and auditable.',
  },
};

export default function FutureHeader() {
  const location = useLocation();
  const page = pageTitles[location.pathname] ?? pageTitles['/future/strategy'];

  return (
    <header className="border-b border-border bg-surface/92 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.2em] text-accent/80">
            <Sparkles size={11} />
            Future Product Concept
          </div>
          <h1 className="mt-2 text-xl font-semibold text-primary font-display">{page.title}</h1>
          <p className="mt-1 max-w-[760px] text-sm leading-relaxed text-tertiary">{page.description}</p>
        </div>
        <Link to="/campaigns" className="btn-ghost text-xs shrink-0">
          <ArrowLeft size={13} />
          Back To Current Demo
        </Link>
      </div>
    </header>
  );
}
