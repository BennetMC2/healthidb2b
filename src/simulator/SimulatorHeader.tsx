import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/simulator/overview': {
    title: 'Executive Overview',
    description: 'Actuarial behaviour model overview with demo scenarios and flow diagram.',
  },
  '/simulator/architecture': {
    title: 'Architecture Diagram',
    description: '6-layer model architecture with data flows, engine components, formulas, and source file references.',
  },
  '/simulator/inspector': {
    title: 'Model Inspector',
    description: 'Interrogate every calculation, data input, formula, and intermediate value in the simulation engine.',
  },
  '/simulator/scenario': {
    title: 'Scenario Builder',
    description: 'Configure market, cohort, interventions, rewards, and time horizons.',
  },
  '/simulator/cohort': {
    title: 'Cohort Builder',
    description: 'Define target population using presets or advanced dimension filters.',
  },
  '/simulator/signals': {
    title: 'Signal Confidence',
    description: 'Signal-by-source confidence matrix with modulating factor controls.',
  },
  '/simulator/evidence': {
    title: 'Evidence Library',
    description: 'Real clinical citations with effect sizes, DOIs, and study designs.',
  },
  '/simulator/interventions': {
    title: 'Intervention Builder',
    description: 'Configure interventions with clinical rules and behaviour lever targets.',
  },
  '/simulator/rewards': {
    title: 'Reward Function',
    description: 'Per-client reward strategy with behavioural economics overlay.',
  },
  '/simulator/run': {
    title: 'Simulation Runner',
    description: 'Review assumptions, run simulation, and watch layer-by-layer progress.',
  },
  '/simulator/output': {
    title: 'Output Dashboard',
    description: 'Multi-horizon ROI output with claims impact, morbidity shift, and confidence bands.',
  },
  '/simulator/bridge': {
    title: 'Health-to-Value Bridge',
    description: 'Signal movement through to net insurer value with confidence at each stage.',
  },
  '/simulator/audit': {
    title: 'Audit Trail',
    description: 'Full provenance: every output traceable to signals, rules, literature, and model version.',
  },
  '/simulator/settings': {
    title: 'Simulator Settings',
    description: 'Default assumptions, baseline costs, confidence weighting, and model version.',
  },
  '/simulator/compare': {
    title: 'Scenario Comparison',
    description: 'Side-by-side comparison of 2-3 scenarios with aligned metrics and recommendations.',
  },
};

export default function SimulatorHeader() {
  const location = useLocation();
  const page = pageTitles[location.pathname] ?? pageTitles['/simulator/overview'];

  return (
    <header className="border-b border-border bg-surface/92 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.2em] text-accent/80">
            <FlaskConical size={11} />
            Actuarial Behaviour Simulator
          </div>
          <h1 className="mt-2 text-xl font-semibold text-primary font-display">{page.title}</h1>
          <p className="mt-1 max-w-[760px] text-sm leading-relaxed text-tertiary">{page.description}</p>
        </div>
        <Link to="/app/actuary" className="btn-ghost text-xs shrink-0">
          <ArrowLeft size={13} />
          Back To Platform
        </Link>
      </div>
    </header>
  );
}
