import { useNavigate } from 'react-router-dom';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import {
  ArrowRight,
  Smartphone,
  Activity,
  Heart,
  Shield,
  CheckCircle,

  Layers,
  AlertTriangle,
  Unplug,
  ShieldOff,
  Building2,
  Hash,
  Vault,
  Sparkles,
  Brain,

  Lock,
  Users,
  Plug,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { identities, verifications, complianceRecords } from '@/data';
import { formatCompact } from '@/utils/format';
import { usePartnerStore } from '@/stores/usePartnerStore';
import { industryContexts } from '@/data/partnerContext';
import DemoButton from '@/components/walkthrough/DemoButton';
import LiveProofButton from '@/components/proof/LiveProofButton';
import ComparisonWidget from '@/components/proof/ComparisonWidget';
import ActuarialROICalculator from '@/components/campaigns/ActuarialROICalculator';
import { getMetricsGroupedByCategory } from '@/utils/constants';
import { USE_CASE_CONFIG } from '@/utils/actuarial';
import type { HealthMetric, CampaignUseCase } from '@/types';

// ── Center Panel: Infrastructure Pipeline (Framer Motion) ────────

type AnimPhase = 'idle' | 'block' | 'proof' | 'verify';

function InfrastructurePipeline() {
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [cycle, setCycle] = useState(0);

  const runCycle = useCallback(() => {
    setPhase('block');
    setTimeout(() => setPhase('proof'), 1400);
    setTimeout(() => setPhase('verify'), 3000);
    setTimeout(() => {
      setPhase('idle');
      setCycle((c) => c + 1);
    }, 4200);
  }, []);

  useEffect(() => {
    const t = setTimeout(runCycle, 800);
    return () => clearTimeout(t);
  }, [cycle, runCycle]);

  return (
    <div className="flex flex-col w-full gap-5">
      {/* ── Row 1: The 3 Nodes with pipeline track ── */}
      <div className="relative flex items-center px-3" style={{ height: 120 }}>

        {/* ─── Pipeline Track — thick bar connecting all 3 nodes ─── */}
        <div
          className="absolute rounded-full z-0"
          style={{
            left: 48,
            right: 48,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 14,
            background: `linear-gradient(90deg, rgb(var(--n-border-light)) 0%, rgb(var(--n-border)) 30%, rgb(var(--n-border-light)) 50%, rgb(var(--n-border)) 70%, rgb(var(--n-border-light)) 100%)`,
            boxShadow: 'inset 0 2px 3px rgba(27,42,74,0.07), 0 1px 2px rgba(27,42,74,0.04)',
          }}
        />

        {/* Node 1: User Device — left */}
        <div className="relative z-10 flex flex-col items-center" style={{ width: 96 }}>
          <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-accent/25 flex items-center justify-center shadow-md">
            <Smartphone size={32} className="text-accent" />
          </div>
        </div>

        {/* Node 2: ZK Shield — center */}
        <div className="relative z-10 flex-1 flex justify-center">
          <motion.div
            className="w-[76px] h-[76px] rounded-2xl bg-surface border-2 border-accent/30 flex items-center justify-center shadow-lg"
            animate={
              phase === 'block'
                ? {
                    scale: [1, 1.12, 1.04, 1],
                    boxShadow: [
                      '0 4px 6px rgba(224,122,95,0.04)',
                      '0 4px 20px rgba(224,122,95,0.25)',
                      '0 4px 12px rgba(224,122,95,0.1)',
                      '0 4px 6px rgba(224,122,95,0.04)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Shield size={40} className="text-accent" />
          </motion.div>
        </div>

        {/* Node 3: Partner — right */}
        <div className="relative z-10 flex flex-col items-center" style={{ width: 96 }}>
          <motion.div
            className="w-16 h-16 rounded-2xl bg-surface border-2 border-border flex items-center justify-center shadow-md"
            animate={
              phase === 'verify'
                ? {
                    scale: [1, 1.1, 1],
                    borderColor: ['rgba(226,224,219,1)', 'rgba(45,122,79,0.5)', 'rgba(226,224,219,1)'],
                    boxShadow: [
                      '0 4px 6px rgba(27,42,74,0.06)',
                      '0 4px 16px rgba(45,122,79,0.18)',
                      '0 4px 6px rgba(27,42,74,0.06)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Building2 size={32} className="text-secondary" />
          </motion.div>
        </div>

        {/* ─── MOVING: Raw Data → blocked at shield ─── */}
        <AnimatePresence>
          {phase === 'block' && (
            <motion.div
              key={`block-${cycle}`}
              className="absolute z-20"
              style={{ top: '50%', left: 96, transform: 'translateY(-50%)' }}
              initial={{ x: 0, opacity: 1, scale: 1 }}
              animate={{ x: 100, opacity: 0, scale: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-error-muted border border-error/25 flex items-center justify-center shadow">
                  <Heart size={18} className="text-error" />
                </div>
                <span className="text-2xs font-mono font-bold text-error/80">Raw PII</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MOVING: Digital Receipt → glides to partner ─── */}
        <AnimatePresence>
          {(phase === 'proof' || phase === 'verify') && (
            <motion.div
              key={`proof-${cycle}`}
              className="absolute z-20"
              style={{ top: '50%', left: '50%', transform: 'translateY(-50%)' }}
              initial={{ x: -20, opacity: 0, scale: 0.6 }}
              animate={{ x: 80, opacity: 1, scale: 1 }}
              transition={{ duration: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-success-muted border border-success/25 flex items-center justify-center shadow">
                  <Hash size={18} className="text-success" />
                </div>
                <span className="text-2xs font-mono font-bold text-success/80">0x9F…A2</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── BLOCKED badge — appears above shield ─── */}
        <AnimatePresence>
          {phase === 'block' && (
            <motion.div
              key={`flash-${cycle}`}
              className="absolute z-30 left-1/2 -translate-x-1/2"
              style={{ top: 4 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: 0.7, duration: 0.35 }}
            >
              <span className="text-2xs font-bold text-error bg-error-muted px-2.5 py-0.5 rounded-full border border-error/20 shadow-sm">
                BLOCKED
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Verified check — appears on partner node ─── */}
        <AnimatePresence>
          {phase === 'verify' && (
            <motion.div
              key={`check-${cycle}`}
              className="absolute z-30"
              style={{ top: 6, right: 28 }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-7 h-7 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shadow-sm">
                <CheckCircle size={15} className="text-success" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Row 2: Labels directly under nodes ── */}
      <div className="flex items-start px-3">
        <div className="flex flex-col items-center" style={{ width: 96 }}>
          <div className="text-xs font-bold text-primary">User Device</div>
          <div className="text-2xs text-tertiary text-center mt-0.5 leading-snug">Wearables, labs<br />& clinical feeds</div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-accent">ZK Bridge</div>
            <div className="text-2xs text-tertiary text-center mt-0.5 leading-snug">On-device proof<br />generation</div>
          </div>
        </div>
        <div className="flex flex-col items-center" style={{ width: 96 }}>
          <div className="text-xs font-bold text-primary">Partner</div>
          <div className="text-2xs text-tertiary text-center mt-0.5 leading-snug">Receives verified<br />claims only</div>
        </div>
      </div>

      {/* ── Row 3: 4-step process — connected to pipeline via tick marks ── */}
      <div className="relative mx-3 mt-1">
        {/* Background bar connecting the steps */}
        <div className="absolute left-6 right-6 top-3 h-0.5 bg-border z-0" />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4">
          {[
            { n: '1', label: 'User Consent' },
            { n: '2', label: 'The Challenge' },
            { n: '3', label: 'ZK Proof Generated' },
            { n: '4', label: 'Verified Claim' },
          ].map((s) => (
            <div key={s.n} className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-surface border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <span className="text-2xs font-bold text-accent">{s.n}</span>
              </div>
              <span className="text-2xs font-medium text-secondary text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      <p className="text-2xs text-tertiary text-center leading-relaxed px-4">
        Raw data is blocked at the bridge. Only cryptographic proof receipts reach the partner.
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();
  const { currentPartner } = usePartnerStore();
  const ctx = industryContexts[currentPartner.industry];
  const loading = useSimulatedLoading(400);

  const poolSize = identities.length;
  const proofsGenerated = verifications.filter((v) => v.status === 'verified').length;
  const piiEvents = complianceRecords.filter((r) => r.piiAccessed).length;

  const [roiMetric, setRoiMetric] = useState<HealthMetric>('vo2_max');
  const [roiUseCase, setRoiUseCase] = useState<CampaignUseCase>('dynamic_premium');
  const [roiParticipants, setRoiParticipants] = useState(5000);

  const metricGroups = getMetricsGroupedByCategory();
  const useCaseLabels: Record<CampaignUseCase, string> = {
    underwriting: 'Underwriting',
    dynamic_premium: 'Dynamic Premium',
    claims_reduction: 'Claims Reduction',
    renewal: 'Renewal',
    acquisition: 'Acquisition',
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto scrollbar-thin">
        <div className="px-6 py-8 space-y-6 animate-pulse">
          <div className="skeleton h-12 w-full max-w-[500px] mx-auto" />
          <div className="skeleton h-5 w-full max-w-[400px] mx-auto" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
            <div className="skeleton h-[520px] rounded-xl" />
            <div className="skeleton h-[520px] rounded-xl" />
            <div className="skeleton h-[520px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto scrollbar-thin" data-tour="overview-hero">
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-display">
            HealthID: The Universal Infrastructure for the New Health Economy
          </h1>
          <p className="text-sm text-secondary max-w-[560px] mx-auto leading-relaxed">
            {ctx.subheadline}
          </p>

          {/* Key stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-2">
            <div className="text-center">
              <span className="font-mono text-lg font-semibold text-primary">{formatCompact(poolSize)}</span>
              <span className="text-2xs text-tertiary uppercase tracking-wider ml-1.5">Identities</span>
            </div>
            <div className="w-px h-5 bg-border self-center" />
            <div className="text-center">
              <span className="font-mono text-lg font-semibold text-primary">{formatCompact(proofsGenerated)}</span>
              <span className="text-2xs text-tertiary uppercase tracking-wider ml-1.5">Proofs</span>
            </div>
            <div className="w-px h-5 bg-border self-center" />
            <div className="text-center">
              <span className="font-mono text-lg font-semibold text-accent">{piiEvents}</span>
              <span className="text-2xs text-tertiary uppercase tracking-wider ml-1.5">PII Events</span>
            </div>
          </div>
        </section>

        {/* ── 3-Panel Canvas ─────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-tour="overview-personas">

          {/* ─── LEFT: Trust & Privacy Chasm ─────────────────── */}
          <div className="rounded-xl bg-base border border-border p-5 shadow-sm flex flex-col">
            <div className="text-2xs text-error/70 uppercase tracking-wider font-semibold mb-4">
              The Trust &amp; Privacy Chasm
            </div>

            {/* Data Silos — links to Explorer */}
            <button onClick={() => navigate('/explorer')} className="flex items-center gap-3 mb-3 w-full text-left hover:bg-hover/50 rounded-lg p-1 -m-1 transition-colors group">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-error-muted border border-error/15 flex items-center justify-center">
                  <Unplug size={18} className="text-error/70" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error/15 border border-error/20 flex items-center justify-center">
                  <AlertTriangle size={8} className="text-error" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary group-hover:text-accent transition-colors">Data Silos &amp; Noise</div>
                <div className="text-2xs text-tertiary leading-relaxed">
                  Fragmented health records scattered across incompatible systems
                </div>
              </div>
              <ArrowRight size={10} className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>

            {/* Liability Trap — links to Compliance */}
            <button onClick={() => navigate('/compliance#zero-pii')} className="flex items-center gap-3 mb-3 w-full text-left hover:bg-hover/50 rounded-lg p-1 -m-1 transition-colors group">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-error-muted border border-error/15 flex items-center justify-center">
                  <ShieldOff size={18} className="text-error/70" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error/15 border border-error/20 flex items-center justify-center">
                  <AlertTriangle size={8} className="text-error" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary group-hover:text-accent transition-colors">The Liability Trap</div>
                <div className="text-2xs text-tertiary leading-relaxed">
                  Catastrophic custody liability under GDPR &amp; HIPAA — every stored record is a breach target
                </div>
              </div>
              <ArrowRight size={10} className="text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>

            {/* Fragmentation Crisis */}
            <div className="rounded-lg bg-warning-muted border border-warning/15 p-3 mb-3">
              <div className="text-2xs font-semibold text-primary mb-1">The Fragmentation Crisis</div>
              <div className="text-2xs text-secondary leading-relaxed">
                Raw health data from <span className="font-medium text-primary">Apple Health</span>, <span className="font-medium text-primary">Oura</span>, and <span className="font-medium text-primary">Garmin</span> is clinically significant — but trapped in proprietary silos with no interoperability layer.
              </div>
            </div>

            {/* Walled vs Open — expanded */}
            <div className="rounded-lg bg-elevated border border-border p-3 flex-1">
              <div className="text-2xs font-semibold text-primary mb-2">Walled Gardens vs. Open Networks</div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-error/60 mt-1 flex-shrink-0" />
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-medium text-primary">Closed Loops</span> — restricted to existing policyholders; zero net-new acquisition
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-error/60 mt-1 flex-shrink-0" />
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-medium text-primary">Heavy Tech Debt</span> — siloed vendor platforms with 6–12 month integration timelines
                  </div>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1 flex-shrink-0" />
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-medium text-accent">Open Network (Universal Identity)</span> — HealthID reaches verified, health-conscious users across all platforms
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mt-1 flex-shrink-0" />
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-medium text-success">Net-New Customer Acquisition</span> — a channel for acquiring pre-verified, low-risk individuals outside your existing book
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CENTER: Infrastructure Pipeline ─────────────── */}
          <div className="rounded-xl bg-surface border border-accent/15 p-5 shadow flex flex-col">
            <div className="text-2xs text-accent uppercase tracking-wider font-semibold mb-1">
              The Infrastructure Pipeline
            </div>
            <div className="text-2xs text-tertiary mb-2">
              Health data verified on-device, delivered as cryptographic proof — never raw files.
            </div>
            {/* Full animation — desktop only */}
            <div className="hidden sm:flex flex-1 flex-col justify-center">
              <InfrastructurePipeline />
            </div>
            {/* Compact static — mobile only */}
            <div className="flex sm:hidden flex-1 items-center justify-center gap-3 py-4">
              {[
                { icon: '📱', label: 'Device' },
                { icon: '🔒', label: 'ZK Proof' },
                { icon: '🏢', label: 'Partner' },
              ].map((n, i) => (
                <div key={n.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-surface border-2 border-accent/25 flex items-center justify-center text-xl shadow-sm">
                      {n.icon}
                    </div>
                    <span className="text-2xs text-tertiary font-medium">{n.label}</span>
                  </div>
                  {i < 2 && <span className="text-accent/40 text-lg mb-4">→</span>}
                </div>
              ))}
            </div>
            <div className="text-center mt-2">
              <LiveProofButton variant="primary" size="sm" />
            </div>
          </div>

          {/* ─── RIGHT: Actuarial Impact ──────────────────────── */}
          <div className="rounded-xl bg-accent-muted/30 border border-accent/10 p-5 shadow-sm flex flex-col">
            <div className="text-2xs text-accent uppercase tracking-wider font-semibold mb-4">
              Actuarial Impact
            </div>

            {/* Featured: Actuarial Risk Model — primary CTA */}
            <button
              onClick={() => navigate('/campaigns/new')}
              className="rounded-lg bg-surface border border-accent/15 p-3 text-left w-full hover:shadow-md transition-shadow cursor-pointer mb-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-2xs text-accent uppercase tracking-wider font-medium">Actuarial Risk Model</span>
                <TrendingUp size={11} className="text-accent/60" />
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-mono text-xl font-bold text-accent">22%</span>
                <span className="text-2xs text-secondary">avg. claims reduction · HbA1c</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-mono text-base font-bold text-primary">20 bps</span>
                <span className="text-2xs text-tertiary">morbidity assumption shift</span>
              </div>
              <div className="text-2xs text-tertiary leading-relaxed mb-2">
                Evidence-graded per-metric projections with morbidity shift, payback period, and VNB impact.
              </div>
              <span className="text-2xs text-accent flex items-center gap-1">
                Build a campaign <ArrowRight size={10} />
              </span>
            </button>

            {/* Actuarial-focused list items */}
            <div className="space-y-1 flex-1">
              <button onClick={() => navigate('/treasury#actuarial-roi')} className="flex items-center gap-2.5 w-full text-left hover:bg-accent/5 rounded p-1 -m-1 transition-colors group">
                <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={13} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-2xs font-semibold text-primary group-hover:text-accent transition-colors">Morbidity Shift Modeling</div>
                  <div className="text-2xs text-tertiary">Basis-point morbidity improvement by metric and use case</div>
                </div>
              </button>
              <button onClick={() => navigate('/treasury#portfolio-book')} className="flex items-center gap-2.5 w-full text-left hover:bg-accent/5 rounded p-1 -m-1 transition-colors group">
                <div className="w-7 h-7 rounded bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={13} className="text-success" />
                </div>
                <div className="flex-1">
                  <div className="text-2xs font-semibold text-primary group-hover:text-accent transition-colors">Portfolio Book Analysis</div>
                  <div className="text-2xs text-tertiary">Total VNB impact and annual savings scaled to your full book</div>
                </div>
              </button>
              <button onClick={() => navigate('/treasury#actuarial-roi')} className="flex items-center gap-2.5 w-full text-left hover:bg-accent/5 rounded p-1 -m-1 transition-colors group">
                <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Layers size={13} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-2xs font-semibold text-primary group-hover:text-accent transition-colors">Multi-Metric Stacking</div>
                  <div className="text-2xs text-tertiary">Combine up to 3 metrics with correlation dampening for blended morbidity impact</div>
                </div>
              </button>

              {/* Yield — de-emphasized footnote */}
              <div className="pt-1 mt-1 border-t border-accent/8">
                <button onClick={() => navigate('/treasury#yield-mechanics')} className="flex items-center gap-2.5 w-full text-left hover:bg-accent/5 rounded p-1 -m-1 transition-colors group">
                  <div className="w-7 h-7 rounded bg-border flex items-center justify-center flex-shrink-0">
                    <Vault size={13} className="text-tertiary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xs font-medium text-tertiary group-hover:text-secondary transition-colors">Yield-Subsidized Rewards</div>
                    <div className="text-2xs text-tertiary/70">T-Bill yield covers reward cost; 4–5% APY on idle funds</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Model Your Actuarial ROI ────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-primary font-display">Model Your Actuarial ROI</h2>
              <p className="text-2xs text-tertiary mt-0.5">
                Evidence-graded per-metric projections · adjust inputs to see live numbers
              </p>
            </div>
            <button
              onClick={() => navigate('/campaigns/new')}
              className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
            >
              Build a Campaign <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: controls */}
            <div className="rounded-xl bg-surface border border-border p-5 shadow-sm flex flex-col gap-4">
              {/* Metric selector */}
              <div>
                <label className="text-2xs text-tertiary block mb-1.5 uppercase tracking-wider font-medium">Health Metric</label>
                <select
                  value={roiMetric}
                  onChange={(e) => setRoiMetric(e.target.value as HealthMetric)}
                  className="input-field text-xs w-full"
                >
                  {metricGroups.map((group) => (
                    <optgroup key={group.category} label={group.label}>
                      {group.metrics.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Use-case toggles */}
              <div>
                <label className="text-2xs text-tertiary block mb-1.5 uppercase tracking-wider font-medium">Use Case</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(useCaseLabels) as CampaignUseCase[]).map((uc) => (
                    <button
                      key={uc}
                      onClick={() => setRoiUseCase(uc)}
                      className={`badge cursor-pointer transition-colors ${
                        roiUseCase === uc ? 'badge-accent' : 'badge-default hover:bg-accent/10'
                      }`}
                    >
                      {useCaseLabels[uc]}
                    </button>
                  ))}
                </div>
                {USE_CASE_CONFIG[roiUseCase]?.additionalNote && (
                  <p className="text-2xs text-tertiary mt-1.5">
                    {USE_CASE_CONFIG[roiUseCase].additionalNote}
                  </p>
                )}
              </div>

              {/* Participant count */}
              <div>
                <label className="text-2xs text-tertiary block mb-1.5 uppercase tracking-wider font-medium">
                  Participant Count
                </label>
                <input
                  type="number"
                  value={roiParticipants}
                  min={100}
                  max={500000}
                  step={500}
                  onChange={(e) => setRoiParticipants(Math.max(100, Number(e.target.value)))}
                  className="input-field text-xs font-mono w-full"
                />
                <p className="text-2xs text-tertiary mt-1">
                  Projected policyholders in campaign cohort
                </p>
              </div>
            </div>

            {/* Right: calculator output */}
            <div className="flex flex-col justify-center">
              <ActuarialROICalculator
                metric={roiMetric}
                type="snapshot"
                useCase={roiUseCase}
                maxParticipants={roiParticipants}
                budgetCeiling={roiParticipants * 5}
                showVNB={true}
              />
            </div>
          </div>
        </section>

        {/* ── Two Products. One Ecosystem. ───────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-1 text-center font-display">
            Two Products. One Ecosystem.
          </h2>
          <p className="text-2xs text-tertiary text-center mb-4">
            The supply, the bridge, and the demand — connected by cryptographic trust.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Supply */}
            <div
              className="rounded-xl bg-surface border border-border p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate('/explorer')}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
                  <Smartphone size={18} className="text-accent" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary">The Supply</div>
                  <div className="text-2xs text-accent font-medium">Consumer App</div>
                </div>
                <ArrowRight size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-accent/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Unified Data Repository</span> — wearables, labs, and clinical feeds aggregated on-device into a single health identity
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain size={11} className="text-accent/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Predictive AI Assistant</span> — spots cross-domain trends (sleep vs. glucose vs. HRV) and delivers actionable guidance before issues emerge
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-2xs text-tertiary">
                  <span className="font-mono font-semibold text-primary">{formatCompact(identities.length)}</span> verified health identities in the network
                </div>
              </div>
            </div>

            {/* Card 2: Bridge — clickable to campaigns */}
            <div
              className="rounded-xl bg-accent-muted/40 border border-accent/15 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate('/campaigns')}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
                  <Lock size={18} className="text-accent" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary">The Bridge</div>
                  <div className="text-2xs text-accent font-medium">ZK Protocol</div>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield size={11} className="text-accent/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Cryptographic Verification</span> — proves health actions occurred without exposing the underlying data
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Hash size={11} className="text-accent/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Digital Receipts</span> — partners receive verifiable proof receipts instead of medical records. Zero new liability created.
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-accent/10">
                <div className="text-2xs text-tertiary">
                  <span className="font-mono font-semibold text-accent">0</span> bytes of raw health data ever transferred
                </div>
              </div>
            </div>

            {/* Card 3: Demand */}
            <div
              className="rounded-xl bg-surface border border-border p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate('/treasury')}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                  <Plug size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary">The Demand</div>
                  <div className="text-2xs text-secondary font-medium">Partner API</div>
                </div>
                <ArrowRight size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-success/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity size={11} className="text-success/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Dynamic Risk Reduction</span> — insurers plug in to reduce claims through verified, incentivized health behavior
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users size={11} className="text-accent/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Net-New Acquisition</span> — acquire pre-verified, health-conscious policyholders from outside your existing book
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Vault size={11} className="text-accent/60" />
                  </div>
                  <div className="text-2xs text-secondary leading-relaxed">
                    <span className="font-semibold text-primary">Institutional Treasury</span> — fund rewards via yield-generating vault with full audit trail
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-2xs text-tertiary">
                  <span className="font-mono font-semibold text-primary">4–5%</span> APY on idle funds via tokenized T-Bills
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison: Traditional vs HealthID ──────────── */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-1 text-center font-display">
            Traditional Verification vs. HealthID
          </h2>
          <p className="text-2xs text-tertiary text-center mb-4">
            Side-by-side comparison using {ctx.headline.toLowerCase()} data.
          </p>
          <div className="max-w-[560px] mx-auto">
            <ComparisonWidget />
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="text-center pb-4 space-y-2">
          <DemoButton />
          <div className="flex items-center justify-center gap-3">
            <LiveProofButton variant="ghost" size="md" />
            <button
              onClick={() => navigate('/explorer')}
              className="btn-primary text-sm px-6 py-2"
            >
              Enter Platform <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
