import { useMemo, useState } from 'react';
import { BrainCircuit, ExternalLink, Sparkles, Target } from 'lucide-react';
import { actuaryInsights, type ActuaryConfidence, type ActuaryInsight } from '@/data/actuaryInsights';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';

function confidenceLabel(confidence: ActuaryConfidence) {
  if (confidence === 'high') return 'HIGH CONFIDENCE';
  if (confidence === 'medium') return 'MEDIUM CONFIDENCE';
  return 'EMERGING SIGNAL';
}

function confidenceClass(confidence: ActuaryConfidence) {
  if (confidence === 'high') return 'bg-accent-muted text-accent border-accent/20';
  if (confidence === 'medium') return 'bg-warning-muted text-warning border-warning/20';
  return 'bg-elevated text-secondary border-border';
}

function OutputTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}

function OpportunityCard({ insight }: { insight: ActuaryInsight }) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30">
      <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${confidenceClass(insight.confidence)}`}>
          <span className="h-2 w-2 rounded-full bg-accent animate-[pulseDot_2s_ease-in-out_infinite]" />
          {confidenceLabel(insight.confidence)}
        </div>
        <div className="font-mono text-xs text-tertiary">
          {new Date(insight.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <h2 className="mt-4 text-[1.35rem] font-semibold text-primary">{insight.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-secondary">{insight.subtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-tertiary">{insight.body}</p>

      <div className="mt-5 grid gap-2 lg:grid-cols-3">
        <OutputTile label="Projected savings" value={formatCurrency(insight.outputs.projectedSavingsUsd)} />
        <OutputTile label="Payback" value={`${insight.outputs.paybackMonths} months`} />
        <OutputTile label="Confidence" value={confidenceLabel(insight.confidence).replace(' CONFIDENCE', '')} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-primary text-xs">
          <Target size={13} />
          Design campaign
        </button>
        <button className="btn-ghost text-xs">
          <ExternalLink size={13} />
          See evidence
        </button>
        <button className="btn-ghost text-xs">
          Dismiss
        </button>
      </div>
    </article>
  );
}

export default function Actuary() {
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const [query, setQuery] = useState('');
  const topInsight = actuaryInsights[0];

  const portfolio = useMemo(() => {
    const verifiedOutcomes = 5800;
    const liabilityAvoided = 92100000;
    const avgTrust = 'High';

    return { verifiedOutcomes, liabilityAvoided, avgTrust };
  }, []);

  return (
    <div className="space-y-4">
      <section className="card bg-surface">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-[pulseDot_2s_ease-in-out_infinite]" />
              Live · Last scan 09:14 HKT · Next scan in 46 min
            </div>
            <h1 className="mt-3 text-[2rem] font-semibold text-primary">{currentPartner.label} · AI Actuary</h1>
            <p className="mt-2 text-sm text-secondary">
              Monitoring 36,000 lives · 108,402 data sources · 4,217 indexed papers.
            </p>
          </div>
          <button className="btn-primary text-xs">
            <Sparkles size={14} />
            Show today&apos;s opportunities
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Today&apos;s opportunities</h2>
              <p className="mt-1 text-xs text-tertiary">{actuaryInsights.length} new signals requiring review.</p>
            </div>
          </div>
          {actuaryInsights.map((insight) => (
            <OpportunityCard key={insight.id} insight={insight} />
          ))}

          <section className="card">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">What the Actuary has been doing</h2>
            <div className="mt-4 space-y-2">
              {[
                '09:14 · Refreshed cohort scoring across 36,000 lives',
                '09:08 · Indexed 3 new papers from The Lancet and JAMA',
                '08:51 · Re-scored Sleep Resilience cohort, drift detected',
                '08:30 · Generated 2 campaign drafts awaiting review',
                '08:00 · Daily portfolio sweep complete',
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 font-mono text-xs text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {line}
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="card">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Portfolio health</h2>
            <div className="mt-4 grid gap-2">
              <OutputTile label="Verified outcomes" value={formatNumber(portfolio.verifiedOutcomes)} />
              <OutputTile label="Liability avoided" value={formatCurrency(portfolio.liabilityAvoided)} />
              <OutputTile label="Avg trust" value={portfolio.avgTrust} />
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-2">
              <BrainCircuit size={16} className="text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Ask the Actuary</h2>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your portfolio..."
              className="mt-4 h-28 w-full resize-none rounded border border-border bg-base p-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent/40"
            />
            <button className="btn-primary mt-3 w-full text-xs">Ask</button>
            <div className="mt-4 rounded border border-border bg-elevated p-3 text-xs leading-relaxed text-secondary">
              Try: Which cohort is underpriced?
            </div>
          </section>

          <section className="card">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Six-output model</h2>
            <div className="mt-4 grid gap-2">
              <OutputTile label="Claims reduction" value={formatPercent(topInsight.outputs.claimsReductionPct / 100)} />
              <OutputTile label="Budget ROI" value={`${topInsight.outputs.budgetRoiMultiple.toFixed(1)}x`} />
              <OutputTile label="Suggested HP" value={`${topInsight.outputs.suggestedHpYield} HP`} />
              <OutputTile label="Morbidity shift" value={`${topInsight.outputs.morbidityShiftBps} bps`} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
