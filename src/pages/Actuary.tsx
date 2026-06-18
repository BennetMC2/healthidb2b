import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, BrainCircuit, ChevronDown, ChevronRight, ExternalLink, FlaskConical, Sparkles, Target, X, Zap } from 'lucide-react';
import { buildActuaryInsights, engineAssumptionSetMeta, type ActuaryConfidence, type ActuaryInsight } from '@/data/actuaryInsights';
import { useEconomics } from '@/lib/economics';
import { ENGINE_ECONOMICS } from '@shared/engineConstants';
import type { SeededRunResult } from '@shared/campaigns';
import { SEEDED_RESULTS } from '@shared/seeded-results';
import CopilotMessage from '@/components/copilot/CopilotMessage';
import { useCopilotStore } from '@/stores/useCopilotStore';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { useModelStore } from '@/stores/useModelStore';
import { playEconomicsFromSnapshot } from '@/lib/playEconomics';
import { formatCurrencyCompact, formatNumber, formatPercent } from '@/utils/format';
import { liabilityAvoidedFromReceipts } from '@/utils/businessMetrics';
import { getPartnerPortfolio } from '@/data/partnerPortfolios';
import { AILiveMark, FDECard, PartnerPortfolioBand, ProofReceiptAnimation, ResearchFeed } from '@/components/enterprise/EnterpriseWidgets';
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

/** Build a natural-language scenario goal that pre-fills the simulator. */
function simulatorGoalForInsight(insight: ActuaryInsight): string {
  const signalMap: Record<string, string> = {
    'VO2 Max': 'VO2 max and cardiorespiratory fitness',
    'HRV': 'HRV recovery and autonomic resilience',
    'Sleep': 'sleep regularity and sleep consistency',
    'Resting HR': 'resting heart rate improvement through sustained activity',
  };
  const signalDesc = signalMap[insight.signal] ?? insight.signal;
  return `${insight.campaignName}: reward verified improvement in ${signalDesc} across ${insight.cohortSize.toLocaleString('en-US')} addressable members over ${insight.healthPointsPricing.targetWindow}. Target: ${insight.behaviourToReward}`;
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Engine assumptions</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge bg-accent-muted border-accent/20 text-accent">
                {engineAssumptionSetMeta.version}
              </span>
              <span className="text-2xs text-tertiary">{engineAssumptionSetMeta.label}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded border border-border bg-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Claims bridge delta</div>
                <div className="mt-1 font-mono text-xs text-primary">
                  ${insight.engineBridge.annualClaimsDeltaUSD}/member/yr
                  <span className="text-tertiary"> (CI ${insight.engineBridge.annualClaimsDeltaCI[0]}–${insight.engineBridge.annualClaimsDeltaCI[1]})</span>
                </div>
              </div>
              <div className="rounded border border-border bg-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Attribution factor</div>
                <div className="mt-1 font-mono text-xs text-primary">
                  {(insight.engineBridge.attributionFactor * 100).toFixed(0)}%
                  <span className="text-tertiary"> causal haircut</span>
                </div>
              </div>
              <div className="rounded border border-border bg-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Applicable prevalence</div>
                <div className="mt-1 font-mono text-xs text-primary">
                  {(insight.engineBridge.applicablePrevalence * 100).toFixed(0)}%
                  <span className="text-tertiary"> of cohort</span>
                </div>
              </div>
              <div className="rounded border border-border bg-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Valuation horizon</div>
                <div className="mt-1 font-mono text-xs text-primary">
                  {ENGINE_ECONOMICS.valuationHorizonYears}yr
                  <span className="text-tertiary"> @ {(ENGINE_ECONOMICS.discountRatePct * 100).toFixed(0)}% discount</span>
                </div>
              </div>
              <div className="rounded border border-border bg-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Evidence tier</div>
                <div className="mt-1 font-mono text-xs text-primary">{insight.engineSignal.evidenceTier}</div>
              </div>
              <div className="rounded border border-border bg-surface px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Trust ceiling</div>
                <div className="mt-1 font-mono text-xs text-primary">{insight.engineSignal.trustCeiling}</div>
              </div>
            </div>
            <div className="mt-3 rounded border border-border bg-surface px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Claims pathway</div>
              <div className="mt-1 text-xs text-secondary">{insight.engineSignal.claimsPathway}</div>
            </div>
            <div className="mt-2 rounded border border-border bg-surface px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">Bridge source</div>
              <div className="mt-1 text-2xs leading-relaxed text-tertiary">{insight.engineBridge.source}</div>
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
          <button
            onClick={() => { onClose(); navigate('/app/simulator', { state: { prefillGoal: simulatorGoalForInsight(insight), prefillInsight: insight } }); }}
            className="btn-ghost text-xs border-accent/20 hover:border-accent/40"
          >
            <Activity size={13} />
            Simulate this
          </button>
        </div>
      </aside>
    </div>
  );
}

function formatSimulatedAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString('en-HK', { month: 'short', day: 'numeric' });
}

function OpportunityCard({ insight, onEvidence, seededResult }: { insight: ActuaryInsight; onEvidence: (insight: ActuaryInsight) => void; seededResult?: SeededRunResult }) {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  // The seeded Monte-Carlo numbers are a Model-1 (floor) run; scale them by the
  // active model's realization scalar so they also move when the model switches.
  const modelScalar = useModelStore((s) => s.modelScalar);

  // Canonical per-play economics (single source of truth shared with Campaigns
  // and the Simulator). Falls back to engine estimates for plays with no snapshot.
  const econ = seededResult ? playEconomicsFromSnapshot(seededResult, modelScalar) : null;
  const bookValue = econ ? econ.bookValue : insight.outputs.projectedSavingsUsd;
  const roi = econ ? econ.roi : insight.outputs.budgetRoiMultiple; // already a displayed multiple
  const payback = econ ? econ.payback : insight.outputs.paybackMonths;
  const isSimulated = !!seededResult;

  const confTag = insight.confidence === 'high' ? 'high' : 'med';
  const behaviourPct = isSimulated ? Math.round(seededResult.behavior.behaviorChangeRate * 100) : null;
  const downsidePct = isSimulated ? Math.round(seededResult.finance.downsideProbability * 100) : null;

  return (
    <div className="play">
      <div className="play-top">
        <span className={`tag ${confTag}`}>{confidenceLabel(insight.confidence)}</span>
        <span className="tag sig">{insight.signal}</span>
        <span className="members">{insight.cohortSize.toLocaleString('en-US')} addressable members</span>
        <span className="time">{formatHktTime(insight.generatedAt)}</span>
      </div>

      <div className="play-body">
        <div>
          <h4>{insight.campaignName}</h4>
          <p className="desc">{insight.subtitle}</p>
        </div>
        <div className="hero-metric">
          <div className="big">{roi.toFixed(1)}×</div>
          <div className="cap">Modelled ROI</div>
        </div>
      </div>

      <div className="disclose" onClick={() => setShowDetail((v) => !v)}>
        {showDetail ? '▾ Hide pricing detail' : '▸ Show pricing detail'}
      </div>
      <div className={`detail-grid ${showDetail ? 'open' : ''}`}>
        <div className="dstat"><div className="label">HP Price</div><div className="v">{insight.healthPointsPricing.suggestedHpPerMember} HP</div></div>
        <div className="dstat"><div className="label">Reward budget</div><div className="v">{formatCurrencyCompact(insight.healthPointsPricing.maxBudgetUsd)}</div></div>
        <div className="dstat"><div className="label">Book-value opp.</div><div className="v">{formatCurrencyCompact(bookValue)}</div></div>
        <div className="dstat"><div className="label">Payback</div><div className="v">{payback != null ? `${payback} mo` : '—'}</div></div>
        {econ && (
          <>
            <div className="dstat"><div className="label">Net value</div><div className="v">{formatCurrencyCompact(econ.netValue)}</div></div>
            <div className="dstat"><div className="label">ROI band</div><div className="v">{econ.roiLow.toFixed(1)}–{econ.roiHigh.toFixed(1)}×</div></div>
            <div className="dstat"><div className="label">Enrollment</div><div className="v">{Math.round(econ.enrollmentRate * 100)}%</div></div>
            <div className="dstat"><div className="label">Persistence</div><div className="v">{Math.round(econ.persistenceRate * 100)}%</div></div>
          </>
        )}
      </div>

      <div className="play-foot">
        <span className="mini">
          {isSimulated ? (
            <>Simulated · <b>{behaviourPct}%</b> behaviour change · <b>{downsidePct}%</b> downside</>
          ) : (
            <>Engine estimate — run a simulation for agent-tested numbers</>
          )}
        </span>
        <div className="spacer">
          <button className="btn btn-sm btn-ghost" onClick={() => onEvidence(insight)}>Evidence</button>
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/app/simulator', { state: { prefillGoal: simulatorGoalForInsight(insight), prefillInsight: insight } })}>{isSimulated ? 'Re-simulate' : 'Simulate this'}</button>
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/app/campaigns/new', { state: { template: templateForInsight(insight) } })}>Create campaign →</button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-tertiary">{label}</div>
      <div className={`mt-2.5 text-[1.55rem] font-semibold leading-none tracking-tight ${accent ? 'text-accent' : 'text-primary'}`}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-tertiary">{sub}</div>}
    </div>
  );
}

export default function Actuary() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPartner = usePartnerStore((s) => s.currentPartner);
  const eco = useEconomics();
  // Re-priced when the active Model changes (brief §3).
  const actuaryInsights = useMemo(() => buildActuaryInsights(eco), [eco]);
  const { messages, isStreaming, sendMessage } = useCopilotStore();
  const [query, setQuery] = useState('');
  const copilotInputRef = useRef<HTMLTextAreaElement>(null);
  const [evidenceInsight, setEvidenceInsight] = useState<ActuaryInsight | null>(null);
  const playsRef = useRef<HTMLDivElement>(null);
  const partnerPortfolio = getPartnerPortfolio(currentPartner.id);
  const scanClock = useScanClock();
  const chatPreview = messages.slice(-4);

  // Pre-computed simulation results (from real agent-based Monte Carlo runs)
  const seededResults = SEEDED_RESULTS;

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
    <>
    <div className="rd">
      <div className="live-line"><span className="dot" />Live · Engine {engineAssumptionSetMeta.version} · Last scan {scanClock.lastScanLabel} · Next scan in {scanClock.nextScanLabel}</div>

      <div className="page-head">
        <div className="actions"><button className="btn btn-primary" onClick={() => navigate('/app/campaigns/new')}>+ Create campaign</button></div>
        <div className="label">Signals · AI Actuary</div>
        <h2>{actuaryInsights.length} plays worth your attention today</h2>
        <p>Ranked by modelled return. Each play is a verified wearable signal you can turn into a campaign. Open one to see the full pricing breakdown.</p>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Lives monitored</div><div className="num">{Math.round(partnerPortfolio.lives / 1000)}K</div><div className="sub">{(partnerPortfolio.lives * 3.01 / 1000).toFixed(1)}K connected devices</div></div>
        <div className="kpi"><div className="label">Verified receipts</div><div className="num">{formatNumber(portfolio.verifiedOutcomes)}</div><div className="sub">scan {scanClock.lastScanLabel}</div></div>
        <div className="kpi"><div className="label">Liability opportunity</div><div className="num accent">{formatCurrencyCompact(portfolio.liabilityAvoided)}</div><div className="sub">modelled, across plays</div></div>
        <div className="kpi"><div className="label">Lead signal</div><div className="num" style={{ fontSize: '20px' }}>{partnerPortfolio.leadSignal}</div><div className="sub">tightened overnight</div></div>
      </div>

      <div className="split">
        <div ref={playsRef}>
          <div className="section-title"><h3>Signal plays</h3><span className="label">Ranked by modelled ROI</span></div>
          {actuaryInsights.map((insight) => (
            <OpportunityCard key={insight.id} insight={insight} onEvidence={setEvidenceInsight} seededResult={seededResults.find((r) => r.campaignId === insight.id)} />
          ))}
          <p className="mono" style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '8px', lineHeight: 1.6 }}>
            Planning estimates, not actuarial certification or proven claims reduction. Human review required.
          </p>
        </div>

        <aside className="rail">
          <div className="rail-card">
            <div className="label">Proof verified</div>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>rcp_cbaa8a52 · 0xba…ab</div>
            <div className="checkrow"><span className="c">✓</span> Cohort rule matched</div>
            <div className="checkrow"><span className="c">✓</span> ZK proof valid</div>
            <div className="checkrow"><span className="c">✓</span> Raw data stayed local</div>
          </div>
          <div className="rail-card">
            <div className="label">Portfolio health</div>
            <div className="ph-row"><span className="k">Verified outcomes</span><span className="v">{formatNumber(portfolio.verifiedOutcomes)}</span></div>
            <div className="ph-row"><span className="k">Liability opportunity</span><span className="v">{formatCurrencyCompact(portfolio.liabilityAvoided)}</span></div>
            <div className="ph-row"><span className="k">Avg trust</span><span className="v">{portfolio.avgTrust}</span></div>
          </div>
          <div className="rail-card">
            <div className="label">Research feed</div>
            <div className="feed-item"><div className="t">09:18</div><h5>Nature Medicine wearable update indexed</h5><p>Strengthens VO₂ Max &amp; Zone 2 pricing assumptions.</p></div>
            <div className="feed-item"><div className="t">08:44</div><h5>Lancet sleep-risk review reweighted</h5><p>Raises sleep confidence; keeps causal score below cardio.</p></div>
          </div>
        </aside>
      </div>
    </div>
    {evidenceInsight && (
      <EvidenceModal insight={evidenceInsight} onClose={() => setEvidenceInsight(null)} />
    )}
    </>
  );
}
