import { useMemo, useState } from 'react';
import { BrainCircuit, ExternalLink, Sparkles, Target } from 'lucide-react';
import { actuaryInsights, type ActuaryConfidence, type ActuaryInsight } from '@/data/actuaryInsights';
import CopilotMessage from '@/components/copilot/CopilotMessage';
import { useCopilotStore } from '@/stores/useCopilotStore';
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
          Create campaign
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
  const { messages, isStreaming, sendMessage } = useCopilotStore();
  const [query, setQuery] = useState('');
  const topInsight = actuaryInsights[0];
  const chatPreview = messages.slice(-4);

  const portfolio = useMemo(() => {
    const verifiedOutcomes = 5800;
    const liabilityAvoided = 92100000;
    const avgTrust = 'High';

    return { verifiedOutcomes, liabilityAvoided, avgTrust };
  }, []);

  return (
    <div className="space-y-4">
      <section className="card bg-surface" data-walkthrough="actuary-hero">
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
          <div className="flex items-center justify-between" data-walkthrough="actuary-opportunities">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Today&apos;s opportunities</h2>
              <p className="mt-1 text-xs text-tertiary">{actuaryInsights.length} new signals requiring review.</p>
            </div>
          </div>
          {actuaryInsights.map((insight) => (
            <OpportunityCard key={insight.id} insight={insight} />
          ))}

          <section className="card" data-walkthrough="actuary-log">
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
          <section className="card" data-walkthrough="actuary-portfolio">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Portfolio health</h2>
            <div className="mt-4 grid gap-2">
              <OutputTile label="Verified outcomes" value={formatNumber(portfolio.verifiedOutcomes)} />
              <OutputTile label="Liability avoided" value={formatCurrency(portfolio.liabilityAvoided)} />
              <OutputTile label="Avg trust" value={portfolio.avgTrust} />
            </div>
          </section>

          <section className="card" data-walkthrough="actuary-ask">
            <div className="flex items-center gap-2">
              <BrainCircuit size={16} className="text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Actuary Chat</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-tertiary">
              Ask for portfolio analysis, campaign advice, or underwriting implications.
            </p>

            <div className="mt-4 min-h-[220px] rounded-2xl border border-border bg-base/75 p-3">
              {chatPreview.length > 0 ? (
                <div className="flex max-h-[280px] flex-col gap-3 overflow-y-auto pr-1">
                  {chatPreview.map((message) => (
                    <CopilotMessage key={message.id} message={message} />
                  ))}
                  {isStreaming && chatPreview[chatPreview.length - 1]?.content === '' && (
                    <div className="flex justify-start">
                      <div className="flex gap-1 rounded-lg border border-border bg-elevated px-3 py-2">
                        <span className="h-1.5 w-1.5 animate-flow-pulse rounded-full bg-tertiary" />
                        <span className="h-1.5 w-1.5 animate-flow-pulse rounded-full bg-tertiary" style={{ animationDelay: '200ms' }} />
                        <span className="h-1.5 w-1.5 animate-flow-pulse rounded-full bg-tertiary" style={{ animationDelay: '400ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="rounded-xl border border-border bg-surface/70 px-3 py-3 text-xs leading-relaxed text-secondary">
                    Start a conversation with the AI Actuary. It uses the current partner context from this platform, not a generic chatbot prompt.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Which cohort is underpriced?',
                      'What is my verification success rate?',
                      'Where is the weakest campaign in the portfolio?',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery('');
                          void sendMessage(suggestion);
                        }}
                        disabled={isStreaming}
                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-secondary transition-colors hover:border-accent/30 hover:text-primary disabled:opacity-40"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-surface/70 p-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const text = query.trim();
                    if (!text || isStreaming) return;
                    setQuery('');
                    void sendMessage(text);
                  }
                }}
                placeholder="Ask about your portfolio..."
                className="h-24 w-full resize-none bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-2xs text-tertiary">
                  Press Enter to send. Shift+Enter for a new line.
                </div>
                <button
                  onClick={() => {
                    const text = query.trim();
                    if (!text || isStreaming) return;
                    setQuery('');
                    void sendMessage(text);
                  }}
                  disabled={isStreaming || query.trim().length === 0}
                  className="btn-primary text-xs disabled:opacity-40"
                >
                  {isStreaming ? 'Thinking...' : 'Send'}
                </button>
              </div>
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
