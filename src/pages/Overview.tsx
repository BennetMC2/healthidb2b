import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldOff,
  Database,
  AlertTriangle,
  Smartphone,
  Lock,
  FileCheck,
  ShieldCheck,
  Globe,
  Target,
  Vault,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { identities, verifications, complianceRecords } from '@/data';
import { formatCompact } from '@/utils/format';
import DemoButton from '@/components/walkthrough/DemoButton';

// ── Animated Flow Node ─────────────────────────────────────────────

function FlowNode({
  icon,
  label,
  delay,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  delay: number;
  variant: 'danger' | 'neutral' | 'success';
}) {
  const colors = {
    danger: 'border-error/30 bg-error-muted text-error',
    neutral: 'border-border bg-surface text-secondary',
    success: 'border-accent/30 bg-accent-dim text-accent',
  };

  return (
    <div
      className={`opacity-0 animate-node-appear flex flex-col items-center gap-1.5`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-12 h-12 rounded-md border flex items-center justify-center ${colors[variant]}`}
      >
        {icon}
      </div>
      <span className="text-2xs text-center max-w-[80px] leading-tight text-secondary">
        {label}
      </span>
    </div>
  );
}

function FlowArrow({ delay, variant }: { delay: number; variant: 'danger' | 'success' }) {
  return (
    <div
      className="opacity-0 animate-node-appear flex items-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-8 h-px relative">
        <div
          className={`absolute inset-0 ${
            variant === 'danger' ? 'bg-error/30' : 'bg-accent/30'
          }`}
        />
        <div
          className={`absolute inset-0 animate-flow-pulse ${
            variant === 'danger' ? 'bg-error/60' : 'bg-accent/60'
          }`}
        />
      </div>
      <ChevronRight
        size={12}
        className={variant === 'danger' ? 'text-error/40' : 'text-accent/40'}
      />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();

  const poolSize = identities.length;
  const proofsGenerated = verifications.filter(
    (v) => v.status === 'verified'
  ).length;
  const piiEvents = complianceRecords.filter((r) => r.piiAccessed).length;

  return (
    <div className="h-full overflow-auto scrollbar-thin" data-tour="overview-hero">
      <div className="max-w-[860px] mx-auto py-10 px-6 space-y-12">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Shield size={24} className="text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Health Infrastructure Protocol
          </h1>
          <p className="text-lg text-secondary max-w-[520px] mx-auto leading-relaxed">
            Transition from custodial data liability to zero-knowledge
            verification. Partners receive cryptographic proof receipts — never
            raw health data.
          </p>

          {/* Key stats */}
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="font-mono text-xl font-semibold text-primary">
                {formatCompact(poolSize)}
              </div>
              <div className="text-2xs text-tertiary uppercase tracking-wider mt-0.5">
                Reachable Identities
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="font-mono text-xl font-semibold text-primary">
                {formatCompact(proofsGenerated)}
              </div>
              <div className="text-2xs text-tertiary uppercase tracking-wider mt-0.5">
                Proofs Verified
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="font-mono text-xl font-semibold text-accent">
                {piiEvents}
              </div>
              <div className="text-2xs text-tertiary uppercase tracking-wider mt-0.5">
                PII Events
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem → Solution ────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-6">
          {/* Custodial Model */}
          <div className="card border-error/10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldOff size={16} className="text-error/70" />
              <h3 className="text-sm font-semibold text-primary">
                The Custodial Model
              </h3>
              <span className="badge bg-error-muted border-error/20 text-error">
                High Liability
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Traditional insurers ingest and store raw health records —
              creating a "Toxic Data" liability under GDPR and HIPAA. Every
              data breach exposes the organisation to regulatory fines,
              reputational damage, and class-action risk. Compliance cost
              alone blocks innovation, and the data itself becomes a burden
              rather than an asset.
            </p>
          </div>

          {/* Verification Model */}
          <div className="card border-accent/10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-accent/70" />
              <h3 className="text-sm font-semibold text-primary">
                The Verification Model
              </h3>
              <span className="badge bg-accent-dim border-accent/20 text-accent">
                Zero Liability
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Health data never leaves the user's device. Partners define a
              health metric and threshold, and the protocol delivers a
              zero-knowledge proof receipt — a cryptographic guarantee that
              the condition is met, without revealing any underlying data.
              No storage, no breach surface, no compliance overhead.
            </p>
          </div>
        </section>

        {/* ── Animated Flow Comparison ──────────────────────────── */}
        <section className="space-y-6">
          {/* Old Flow */}
          <div className="card border-error/5 bg-error-muted/20">
            <div className="text-2xs text-error/60 uppercase tracking-wider font-medium mb-4">
              Custodial Flow
            </div>
            <div className="flex items-center justify-center gap-1">
              <FlowNode
                icon={<Smartphone size={18} />}
                label="User Health Data"
                delay={100}
                variant="neutral"
              />
              <FlowArrow delay={250} variant="danger" />
              <FlowNode
                icon={<Database size={18} />}
                label="Raw Data Transfer"
                delay={400}
                variant="danger"
              />
              <FlowArrow delay={550} variant="danger" />
              <FlowNode
                icon={<Database size={18} />}
                label="Insurer Database"
                delay={700}
                variant="danger"
              />
              <FlowArrow delay={850} variant="danger" />
              <FlowNode
                icon={<AlertTriangle size={18} />}
                label="Liability & Breach Risk"
                delay={1000}
                variant="danger"
              />
            </div>
          </div>

          {/* New Flow */}
          <div className="card border-accent/5 bg-accent-dim/20">
            <div className="text-2xs text-accent/60 uppercase tracking-wider font-medium mb-4">
              Verification Flow
            </div>
            <div className="flex items-center justify-center gap-1">
              <FlowNode
                icon={<Smartphone size={18} />}
                label="On-Device Data"
                delay={1300}
                variant="neutral"
              />
              <FlowArrow delay={1450} variant="success" />
              <FlowNode
                icon={<Lock size={18} />}
                label="ZK Proof Request"
                delay={1600}
                variant="success"
              />
              <FlowArrow delay={1750} variant="success" />
              <FlowNode
                icon={<Shield size={18} />}
                label="Proof Generated"
                delay={1900}
                variant="success"
              />
              <FlowArrow delay={2050} variant="success" />
              <FlowNode
                icon={<FileCheck size={18} />}
                label="Verified Receipt"
                delay={2200}
                variant="success"
              />
              <FlowArrow delay={2350} variant="success" />
              <FlowNode
                icon={<ShieldCheck size={18} />}
                label="Zero Liability"
                delay={2500}
                variant="success"
              />
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-primary mb-4 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/explorer')}
              className="card hover:bg-hover transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
                  <Globe size={14} className="text-accent" />
                </div>
                <span className="text-xs font-medium text-primary">
                  1. Explore the Open Pool
                </span>
              </div>
              <p className="text-2xs text-tertiary leading-relaxed">
                Browse {formatCompact(poolSize)} anonymized health identities.
                Segment by health score, reputation tier, connected wearables,
                and demographics — without ever accessing personal data.
              </p>
              <div className="flex items-center gap-1 mt-2 text-accent text-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                Open Explorer <ArrowRight size={10} />
              </div>
            </button>

            <button
              onClick={() => navigate('/campaigns')}
              className="card hover:bg-hover transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
                  <Target size={14} className="text-accent" />
                </div>
                <span className="text-xs font-medium text-primary">
                  2. Launch a Campaign
                </span>
              </div>
              <p className="text-2xs text-tertiary leading-relaxed">
                Create Snapshot (one-time proof) or Stream (continuous
                verification) challenges. Define a health metric, target a
                cohort, and receive cryptographic receipts — not raw files.
              </p>
              <div className="flex items-center gap-1 mt-2 text-accent text-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                View Campaigns <ArrowRight size={10} />
              </div>
            </button>

            <button
              onClick={() => navigate('/treasury')}
              className="card hover:bg-hover transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center">
                  <Vault size={14} className="text-accent" />
                </div>
                <span className="text-xs font-medium text-primary">
                  3. Grow Your Budget
                </span>
              </div>
              <p className="text-2xs text-tertiary leading-relaxed">
                Idle budget earns yield from Real-World Assets (T-Bills) at
                4–5% APY. Combined with enterprise buying power, every $1.00
                of budget creates $1.50+ of user value.
              </p>
              <div className="flex items-center gap-1 mt-2 text-accent text-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                Open Treasury <ArrowRight size={10} />
              </div>
            </button>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="text-center pb-6 space-y-3">
          <div>
            <DemoButton />
          </div>
          <div>
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
