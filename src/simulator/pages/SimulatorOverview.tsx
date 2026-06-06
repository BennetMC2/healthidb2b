import { useNavigate } from 'react-router-dom';
import { FlaskConical, ArrowRight, BookOpen, BarChart3 } from 'lucide-react';
import { CHAPTERS, MODEL_VERSION } from '../constants';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { EVIDENCE_LIBRARY } from '../data/evidence';
import { CAMPAIGN_TEMPLATES } from '../data/campaignTemplates';
import { METRIC_EVIDENCE } from '../data/metricEvidence';

export default function SimulatorOverview() {
  const navigate = useNavigate();
  const chapterCompletion = useSimulatorStore((s) => s.chapterCompletion);
  const completedCount = Object.values(chapterCompletion).filter(Boolean).length;

  const totalSamples = EVIDENCE_LIBRARY.reduce((sum, e) => sum + e.sampleSize, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero */}
      <div className="card border-accent/20 text-center py-10">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
            <FlaskConical size={28} className="text-accent" />
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-primary font-display">
          Build Your Case
        </h1>
        <p className="mt-2 max-w-2xl mx-auto text-sm text-tertiary leading-relaxed">
          Walk through 7 chapters to build an evidence-grounded ROI case for campaign-driven
          health outcomes. Every number is cited. Every assumption is stress-tested.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate('/simulator/build/1')}
            className="btn-primary text-sm"
          >
            {completedCount > 0 ? 'Continue Building' : 'Start Building'}
            <ArrowRight size={14} />
          </button>
          {completedCount === 7 && (
            <button
              onClick={() => navigate('/simulator/results')}
              className="btn-ghost text-sm"
            >
              <BarChart3 size={14} />
              View Results
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Campaigns" value={CAMPAIGN_TEMPLATES.length.toString()} />
        <StatCard label="Health Metrics" value={METRIC_EVIDENCE.length.toString()} />
        <StatCard label="Citations" value={EVIDENCE_LIBRARY.length.toString()} />
        <StatCard label="Total Sample Size" value={totalSamples > 1e6 ? `${(totalSamples / 1e6).toFixed(1)}M` : totalSamples.toLocaleString()} />
      </div>

      {/* Chapter overview */}
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BookOpen size={15} className="text-accent" />
          7-Chapter Narrative Flow
        </div>
        <p className="mt-1 text-xs text-tertiary">
          Each chapter builds on the previous, from population to ROI to stress testing.
        </p>

        <div className="mt-4 space-y-1">
          {CHAPTERS.map((ch) => {
            const isComplete = chapterCompletion[ch.id];
            return (
              <button
                key={ch.id}
                onClick={() => navigate(ch.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-hover"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? 'bg-green-500/15 text-green-500'
                    : 'bg-accent/15 text-accent'
                }`}>
                  {isComplete ? '✓' : ch.id}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-primary">{ch.title}</div>
                  <div className="text-2xs text-tertiary">{ch.subtitle}</div>
                </div>
                <ArrowRight size={14} className="ml-auto shrink-0 text-tertiary" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Evidence library link */}
      <button
        onClick={() => navigate('/simulator/evidence')}
        className="card flex w-full items-center gap-3 text-left hover:border-accent/30 transition-colors"
      >
        <BookOpen size={18} className="text-accent shrink-0" />
        <div>
          <div className="text-sm font-semibold text-primary">Evidence Library</div>
          <div className="text-xs text-tertiary">
            {EVIDENCE_LIBRARY.length} peer-reviewed citations · {totalSamples.toLocaleString()} total sample size
          </div>
        </div>
        <ArrowRight size={14} className="ml-auto text-tertiary" />
      </button>

      <div className="text-center text-2xs text-tertiary">
        {MODEL_VERSION} · Campaign-Centric ROI Model
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="font-mono text-2xl font-semibold text-primary">{value}</div>
      <div className="mt-0.5 text-2xs text-tertiary">{label}</div>
    </div>
  );
}
