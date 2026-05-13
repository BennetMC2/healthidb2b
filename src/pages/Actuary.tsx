import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, ExternalLink, Sparkles, Target, X } from 'lucide-react';
import { actuaryInsights, type ActuaryConfidence, type ActuaryInsight } from '@/data/actuaryInsights';
import CopilotMessage from '@/components/copilot/CopilotMessage';
import { useCopilotStore } from '@/stores/useCopilotStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { formatCurrencyCompact, formatNumber, formatPercent } from '@/utils/format';
import { liabilityAvoidedFromReceipts } from '@/utils/businessMetrics';
import { getPartnerPortfolio } from '@/data/partnerPortfolios';
import { ActuaryBrainMark, FDECard, PartnerPortfolioBand, ProofReceiptAnimation, ResearchFeed } from '@/components/enterprise/EnterpriseWidgets';
import { useScanClock } from '@/hooks/useScanClock';
import type { CampaignTemplate, DataSource, HealthMetric } from '@/types';

function confidenceLabel(confidence: ActuaryConfidence) {
  if (confidence === 'high') return 'HIGH CONFIDENCE';
  if (confidence === 'medium') return 'MEDIUM CONFIDENCE';
  return 'EMERGING SIGNAL';
}

function confidenceShortLabel(confidence: ActuaryConfidence) {
  if (confidence === 'high') return 'HIGH';
  if (confidence === 'medium') return 'MEDIUM';
  return 'EMERGING';
}

function confidenceClass(confidence: ActuaryConfidence) {
  if (confidence === 'high') return 'bg-accent-muted text-accent border-accent/20';
  if (confidence === 'medium') return 'bg-warning-muted text-warning border-warning/20';
  return 'bg-elevated text-secondary border-border';
}

function formatHktTime(date: string) {
  return new Date(date).toLocaleTimeString('en-HK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Hong_Kong',
  });
}

function OutputTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}

function metricForInsight(insight: ActuaryInsight): HealthMetric {
  if (insight.signal === 'VO2 Max') return 'vo2_max';
  if (insight.signal === 'HRV') return 'hrv';
  if (insight.signal === 'Sleep') return 'sleep_hours';
  return 'heart_rate_resting';
}

function targetForInsight(insight: ActuaryInsight): number {
  if (insight.signal === 'VO2 Max') return 2;
  if (insight.signal === 'HRV') return 8;
  if (insight.signal === 'Sleep') return 6.5;
  return 3;
}

function unitForInsight(insight: ActuaryInsight): string {
  if (insight.signal === 'VO2 Max') return 'mL/kg/min uplift';
  if (insight.signal === 'HRV') return 'ms recovery';
  if (insight.signal === 'Sleep') return 'hrs';
  return 'bpm improvement';
}

function templateForInsight(insight: ActuaryInsight): CampaignTemplate {
  return {
    id: insight.id,
    name: insight.campaignName,
    description: insight.body,
    type: 'stream',
    useCase: 'claims_reduction',
    icon: insight.signal === 'Sleep' ? 'moon' : insight.signal === 'VO2 Max' ? 'activity' : 'heart',
    challenge: {
      metric: metricForInsight(insight),
      operator: 'gte',
      target: targetForInsight(insight),
      unit: unitForInsight(insight),
    },
    targeting: {
      reputationTiers: ['medium', 'high'],
      dataSources: insight.sourceBreakdown
        .map((source): DataSource | null => {
          if (source.source === 'Apple Health') return 'apple_health';
          if (source.source === 'Garmin') return 'garmin';
          if (source.source === 'Oura') return 'oura';
          if (source.source === 'WHOOP') return 'whoop';
          if (source.source === 'Fitbit') return 'fitbit';
          return null;
        })
        .filter((source): source is DataSource => Boolean(source)),
      ageRanges: ['35-44', '45-54'],
      regions: ['Hong Kong', 'Japan'],
    },
    suggestedBudget: insight.healthPointsPricing.maxBudgetUsd,
    suggestedPoints: insight.healthPointsPricing.suggestedHpPerMember,
    suggestedMaxParticipants: insight.cohortSize,
  };
}

function EvidenceModal({ insight, onClose }: { insight: ActuaryInsight; onClose: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${insight.campaignName} evidence trail`}>
      <button className="flex-1 cursor-default" onClick={onClose} aria-label="Close evidence trail" />
      <aside className="h-full w-[min(760px,96vw)] overflow-y-auto border-l border-border bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Evidence trail</div>
            <h2 className="mt-2 text-xl font-semibold text-primary">{insight.campaignName}</h2>
            <p className="mt-1 text-sm text-secondary">{insight.title}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-tertiary hover:bg-hover hover:text-primary" aria-label="Close evidence trail">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <section className="rounded-lg border border-border bg-base/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Cohort math</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <OutputTile label="Cohort size" value={formatNumber(insight.cohortSize)} />
              <OutputTile label="Signal" value={insight.signal} />
              <OutputTile label="Confidence" value={confidenceShortLabel(insight.confidence)} />
            </div>
            <div className="mt-3 rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-secondary">
              {insight.cohortFilter}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-base/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Source breakdown</h3>
            <div className="mt-3 space-y-2">
              {insight.sourceBreakdown.map((source) => (
                <div key={source.source} className="grid grid-cols-[120px_minmax(0,1fr)_48px] items-center gap-3 text-xs">
                  <span className="text-secondary">{source.source}</span>
                  <span className="h-2 rounded-full bg-elevated">
                    <span className="block h-2 rounded-full bg-accent" style={{ width: `${source.pct}%` }} />
                  </span>
                  <span className="font-mono text-tertiary">{source.pct}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-base/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Literature</h3>
            <div className="mt-3 space-y-3">
              {insight.evidence.literature.map((paper) => (
                <a
                  key={paper.doi}
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded border border-border bg-surface px-3 py-3 text-sm transition-colors hover:border-accent/30"
                >
                  <div className="font-medium text-primary">{paper.title}</div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-tertiary">
                    {paper.journal} · {paper.year} · DOI {paper.doi}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-secondary">{paper.effectSize}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-base/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Actuarial confidence</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{insight.evidence.portfolioContext}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(insight.evidence.confidenceBreakdown).map(([label, score]) => (
                <div key={label} className="rounded border border-border bg-surface px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">{label}</span>
                    <span className="font-mono text-sm font-semibold text-primary">{score}/100</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-elevated">
                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-base/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Receipt samples</h3>
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              Sample proof receipts available for diligence. Each receipt is a binary outcome against the campaign rule, with raw wearable history retained on the member side.
            </p>
            <div className="mt-3 grid gap-2">
              {['0xba95b0…f07ab18c', '0x51d8b5…cea485ca', '0x7e34c2…912ad4bf'].map((hash, index) => (
                <div key={hash} className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2">
                  <span className="font-mono text-xs text-primary">receipt_{index + 1} · {hash}</span>
                  <span className="badge bg-success-muted border-success/20 text-success">verified</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-accent/20 bg-accent/10 p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Counterfactual</div>
            <p className="mt-2 text-sm leading-relaxed text-primary">
              If no campaign is launched, the model estimates {formatCurrencyCompact(insight.evidence.counterfactualUsd)} of unrealised book-value improvement over the next 12 months.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-base/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Methodology</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                'Actuarial credibility: cohort volume x source quality',
                'Causal adjustment: behaviour-change response discount',
                'Evidence grading: peer-reviewed support only',
                'Conservative anchoring: bottom-quartile response case',
              ].map((item) => (
                <div key={item} className="rounded border border-border bg-surface px-3 py-2 text-xs text-secondary">{item}</div>
              ))}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-surface/95 px-6 py-4 backdrop-blur">
          <button
            onClick={() => navigate('/app/campaigns/new', { state: { template: templateForInsight(insight) } })}
            className="btn-primary text-xs"
          >
            Create campaign from this insight
          </button>
          <button className="btn-ghost text-xs">Save to watchlist</button>
          <button className="btn-ghost text-xs">Export signed evidence pack</button>
          <button className="btn-ghost text-xs">Dismiss with reason</button>
        </div>
      </aside>
    </div>
  );
}

function OpportunityCard({ insight, onEvidence }: { insight: ActuaryInsight; onEvidence: (insight: ActuaryInsight) => void }) {
  const navigate = useNavigate();

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30">
      <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${confidenceClass(insight.confidence)}`}>
          <span className="h-2 w-2 rounded-full bg-accent animate-[pulseDot_2s_ease-in-out_infinite]" />
          {confidenceLabel(insight.confidence)}
        </div>
        <div className="font-mono text-xs text-tertiary">
          {formatHktTime(insight.generatedAt)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-elevated px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
          {insight.signal}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">
          {insight.cohortSize.toLocaleString('en-US')} addressable members
        </span>
      </div>

      <h2 className="mt-3 text-[1.35rem] font-semibold text-primary">{insight.campaignName}</h2>
      <p className="mt-1 text-sm font-medium leading-relaxed text-primary">{insight.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-secondary">{insight.subtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-tertiary">{insight.body}</p>

      <div className="mt-5 rounded border border-border bg-base/60 p-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Campaign action</div>
        <p className="mt-1 text-sm leading-relaxed text-secondary">{insight.behaviourToReward}</p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <OutputTile label="HP price" value={`${insight.healthPointsPricing.suggestedHpPerMember} HP`} />
        <OutputTile label="Reward budget" value={formatCurrencyCompact(insight.healthPointsPricing.maxBudgetUsd)} />
        <OutputTile label="Book value" value={formatCurrencyCompact(insight.outputs.projectedSavingsUsd)} />
        <OutputTile label="ROI" value={`${insight.outputs.budgetRoiMultiple.toFixed(1)}x`} />
        <OutputTile label="Payback" value={`${insight.outputs.paybackMonths} mo`} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <OutputTile label="Claims reduction" value={formatPercent(insight.outputs.claimsReductionPct / 100)} />
        <OutputTile label="Morbidity shift" value={`${insight.outputs.morbidityShiftBps} bps`} />
        <OutputTile label="Confidence" value={confidenceShortLabel(insight.confidence)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => navigate('/app/campaigns/new', { state: { template: templateForInsight(insight) } })}
          className="btn-primary text-xs"
        >
          <Target size={13} />
          Create Campaign
        </button>
        <button onClick={() => onEvidence(insight)} className="btn-ghost text-xs">
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
  const location = useLocation();
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const { messages, isStreaming, sendMessage } = useCopilotStore();
  const [query, setQuery] = useState('');
  const copilotInputRef = useRef<HTMLTextAreaElement>(null);
  const [evidenceInsight, setEvidenceInsight] = useState<ActuaryInsight | null>(null);
  const playsRef = useRef<HTMLDivElement>(null);
  const partnerPortfolio = getPartnerPortfolio(currentPartner.id);
  const scanClock = useScanClock();
  const chatPreview = messages.slice(-4);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focusCopilot') === '1') {
      window.setTimeout(() => copilotInputRef.current?.focus(), 120);
    }
  }, [location.search]);

  const portfolio = useMemo(() => {
    const verifiedOutcomes = partnerPortfolio.verifiedReceipts;
    const liabilityAvoided = liabilityAvoidedFromReceipts(verifiedOutcomes);
    const avgTrust = partnerPortfolio.avgTrust;

    return { verifiedOutcomes, liabilityAvoided, avgTrust };
  }, [partnerPortfolio]);

  return (
    <div className="space-y-4">
      <section className="command-surface p-5" data-walkthrough="actuary-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-[pulseDot_2s_ease-in-out_infinite]" />
              Live · Last scan {scanClock.lastScanLabel} · Next scan in {scanClock.nextScanLabel}
            </div>
            <h1 className="mt-3 text-[2rem] font-semibold text-primary">{currentPartner.label} · AI Actuary</h1>
            <p className="mt-2 text-sm text-secondary">
              Campaign intelligence cockpit monitoring verified wearable signals across {formatNumber(partnerPortfolio.lives)} lives. Lead signal: {partnerPortfolio.leadSignal}.
            </p>
            <div className="mt-4 rounded-xl border border-accent/15 bg-accent/10 px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Today's brief</div>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed text-primary">{partnerPortfolio.morningBrief}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ActuaryBrainMark />
            <button
              onClick={() => playsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn-primary text-xs"
            >
              <Sparkles size={14} />
              Show campaign plays
            </button>
          </div>
        </div>
        <div className="mt-5">
          <PartnerPortfolioBand portfolio={partnerPortfolio} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <div ref={playsRef} className="flex items-center justify-between scroll-mt-4" data-walkthrough="actuary-opportunities">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Wearable signal campaigns</h2>
              <p className="mt-1 text-xs text-tertiary">
                {actuaryInsights.length} priced campaign plays ranked by addressable behaviour change and expected book impact.
              </p>
            </div>
          </div>
          {actuaryInsights.map((insight) => (
            <OpportunityCard key={insight.id} insight={insight} onEvidence={setEvidenceInsight} />
          ))}

          <section className="card" data-walkthrough="actuary-log">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">What the Actuary has been doing</h2>
            <div className="mt-4 space-y-2">
              {[
                '09:14 · Priced VO2 Max activation cohort across 3,847 addressable members',
                '09:02 · Re-scored HRV recovery drift and Health Points yield',
                '08:51 · Rebuilt Sleep Regularity cohort from 45-day device history',
                '08:30 · Flagged resting heart rate campaign with emerging confidence',
                '08:00 · Daily wearable signal sweep complete',
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
          <ProofReceiptAnimation compact />
          <section className="card" data-walkthrough="actuary-portfolio">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Portfolio health</h2>
            <div className="mt-4 grid gap-2">
              <OutputTile label="Verified outcomes" value={formatNumber(portfolio.verifiedOutcomes)} />
              <OutputTile label="Liability avoided" value={formatCurrencyCompact(portfolio.liabilityAvoided)} />
              <OutputTile label="Avg trust" value={portfolio.avgTrust} />
            </div>
          </section>

          <ResearchFeed portfolio={partnerPortfolio} />
          <FDECard portfolio={partnerPortfolio} />

          <section className="card overflow-hidden p-0" data-walkthrough="actuary-ask">
            <div className="border-b border-border px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={16} className="text-accent" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Actuary Copilot</h2>
                </div>
                <div className="rounded-full border border-accent/20 bg-accent/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                  Live
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-tertiary">
                Portfolio analysis, campaign advice, and underwriting implications in one thread.
              </p>
            </div>

            <div className="bg-base/70 px-4 py-4">
              <div className="flex min-h-[280px] flex-col rounded-2xl border border-border bg-surface/70">
                <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                  {chatPreview.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-border bg-elevated px-3 py-3 text-xs leading-relaxed text-secondary">
                        Start a conversation with Actuary Copilot. It uses the current partner context from this platform rather than a generic chatbot prompt.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Which wearable campaign should we launch next?',
                          'Where is the biggest modifiable risk?',
                          'What is my verification success rate?',
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
                    </>
                  )}
                </div>

                <div className="border-t border-border bg-surface px-3 py-3">
                  <textarea
                    ref={copilotInputRef}
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
                    className="h-20 w-full resize-none bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-2xs text-tertiary">
                      Enter sends. Shift+Enter adds a new line.
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
              </div>
            </div>
          </section>
        </aside>
      </div>
      {evidenceInsight && (
        <EvidenceModal insight={evidenceInsight} onClose={() => setEvidenceInsight(null)} />
      )}
    </div>
  );
}
