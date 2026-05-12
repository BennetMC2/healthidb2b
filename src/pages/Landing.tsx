import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Sparkles, Target, Users, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

function HealthProofCard() {
  const rows = [
    ['Activity Consistency', 'A+'],
    ['Sleep Quality', 'A'],
    ['VO2 Max Improvement', 'B+'],
  ];

  return (
    <div className="relative rounded-[28px] border border-[rgba(26,26,62,0.12)] bg-[rgb(var(--hid-cream-50))] p-5">
      <div className="absolute right-4 top-4 rounded-full border border-[rgba(26,26,62,0.1)] bg-white px-3 py-1 text-xs font-medium text-[rgb(var(--hid-navy-700))]">
        Zero-custody
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.12em] text-[rgb(var(--hid-rust-500))]">Health Proof</div>
      <div className="mt-3 flex items-baseline gap-3">
        <div className="text-6xl font-extrabold leading-none text-[rgb(var(--hid-navy-900))]">A+</div>
        <div className="text-sm text-[rgb(var(--hid-navy-600))]">Verification Result</div>
      </div>
      <div className="mt-6 space-y-3">
        {rows.map(([label, grade]) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-[rgba(26,26,62,0.08)] bg-white px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-[rgb(var(--hid-navy-800))]">{label}</div>
              <div className="mt-1 text-xs text-[rgb(var(--hid-navy-500))]">Verified · No raw data shared</div>
            </div>
            <div className="rounded-md bg-[rgb(var(--hid-navy-900))] px-2.5 py-1 font-display text-sm font-semibold text-[rgb(var(--hid-cream-50))]">
              {grade}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg bg-[rgb(var(--hid-navy-900))] text-[rgb(var(--hid-cream-50))]">
        <div className="border-r border-white/10 p-4">
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-[rgb(var(--hid-rust-400))]">Health Points</div>
          <div className="mt-1 text-2xl font-bold">2,840</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-[rgb(var(--hid-rust-400))]">Confidence</div>
          <div className="mt-1 text-2xl font-bold">87</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const proofFlow: Array<{ title: string; body: string; icon: LucideIcon }> = [
    { title: 'Raw data', body: 'User-held wearables, labs, health records', icon: Users },
    { title: 'ZK proof', body: 'Private verification against campaign logic', icon: ShieldCheck },
    { title: 'Insurer receipt', body: 'Result, confidence grade, proof ID, audit trail', icon: CheckCircle2 },
  ];

  const productCards: Array<{ title: string; body: string; icon: LucideIcon; href: string }> = [
    {
      title: 'AI Actuary',
      body: 'Always-on actuarial intelligence. Identifies cohort opportunities, drafts campaigns, and flags emerging risk before your team asks.',
      icon: Sparkles,
      href: '/app/actuary',
    },
    {
      title: 'Verification Trail',
      body: 'Audit-grade proof log. Receipt-only operating model. Zero raw PII access.',
      icon: Lock,
      href: '/app/compliance',
    },
    {
      title: 'Campaign Engine',
      body: 'Cohort to in-market campaign in minutes, with rewards priced from the loss-ratio line.',
      icon: Target,
      href: '/app/campaigns',
    },
  ];

  return (
    <div className="h-screen overflow-auto bg-[rgb(var(--hid-cream-100))] text-[rgb(var(--hid-navy-800))]">
      <header className="sticky top-0 z-30 border-b border-[rgba(26,26,62,0.08)] bg-[rgba(247,243,236,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 md:px-8 lg:px-12">
          <Link to="/" className="text-xl font-bold text-[rgb(var(--hid-navy-900))]">HealthID</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[rgb(var(--hid-navy-700))] md:flex">
            <a href="#platform">Platform</a>
            <a href="#protocol">Protocol</a>
            <a href="#insurers">Insurers</a>
            <a href="#investors">Investors</a>
            <a href="#about">About</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app/actuary" className="rounded-lg px-3 py-2 text-sm font-medium text-[rgb(var(--hid-navy-800))] hover:bg-[rgb(var(--hid-cream-200))]">
              Sign in
            </Link>
            <Link to="/contact" className="rounded-lg bg-[rgb(var(--hid-rust-500))] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgb(var(--hid-rust-600))]">
              Book a pilot
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1280px] gap-12 px-4 py-16 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-24">
          <div className="self-center">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--hid-rust-500))]">
              HealthID for life & health insurers
            </div>
            <h1 className="mt-5 max-w-3xl text-[clamp(48px,7vw,88px)] font-extrabold leading-[0.95] text-[rgb(var(--hid-navy-900))]">
              The verification layer between every wearable, every lab, and every underwriter.
            </h1>
            <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-[rgb(var(--hid-navy-700))]">
              HealthID turns ambient health activity into cryptographic receipts that insurers can price, underwrite, and reward against without ever touching the raw data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex h-14 items-center gap-2 rounded-xl bg-[rgb(var(--hid-rust-500))] px-6 text-sm font-semibold text-white hover:bg-[rgb(var(--hid-rust-600))]">
                Book a 30-min pilot
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <a href="#protocol" className="inline-flex h-14 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[rgb(var(--hid-navy-800))] underline decoration-[rgb(var(--hid-rust-500))] decoration-2 underline-offset-4">
                See the protocol
                <ArrowRight size={16} strokeWidth={1.5} />
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-[rgb(var(--hid-navy-500))]">
              <span>No raw health data custody</span>
              <span>Zero-knowledge proofs</span>
              <span>APAC-compliant by design</span>
            </div>
          </div>

          <div className="grid gap-4">
            <HealthProofCard />
            <div className="grid gap-3 rounded-xl border border-[rgba(26,26,62,0.08)] bg-white/70 p-4 font-mono text-xs text-[rgb(var(--hid-navy-700))]">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[rgb(var(--hid-rust-500))]" /> Proof Verified · prt_cbaa8a52</div>
              <div>0xba95b0...f07ab18c · No PII Access</div>
            </div>
          </div>
        </section>

        <section className="border-y border-[rgba(26,26,62,0.08)] bg-[rgb(var(--hid-cream-50))]">
          <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-8 font-mono text-xs uppercase tracking-[0.1em] text-[rgb(var(--hid-navy-600))] md:grid-cols-3 md:px-8 lg:px-12">
            <div><span className="block text-[rgb(var(--hid-navy-900))]">Built with operators from</span> Discovery Vitality</div>
            <div><span className="block text-[rgb(var(--hid-navy-900))]">Advised by</span> Yat Siu · Dr. Craig Nossel</div>
            <div><span className="block text-[rgb(var(--hid-navy-900))]">Infrastructure</span> Moca Chain · Animoca Brands JV</div>
          </div>
        </section>

        <section id="protocol" className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:px-12">
          <div className="max-w-3xl">
            <h2 className="text-[clamp(36px,5vw,56px)] font-extrabold leading-tight text-[rgb(var(--hid-navy-900))]">
              Insurers need richer health intelligence. Regulators and customers want less data custody.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[rgb(var(--hid-navy-700))]">
              HealthID solves all three with one primitive: the receipt. Raw data stays private, zero-knowledge proofs verify the claim, and insurers receive an audit-ready signal.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {proofFlow.map(({ title, body, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-[rgba(26,26,62,0.08)] bg-[rgb(var(--hid-cream-50))] p-6">
                <Icon size={24} strokeWidth={1.5} className="text-[rgb(var(--hid-rust-500))]" />
                <h3 className="mt-5 text-xl font-bold text-[rgb(var(--hid-navy-900))]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--hid-navy-700))]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="bg-[rgb(var(--hid-navy-900))] text-[rgb(var(--hid-cream-100))]">
          <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:px-12">
            <div className="grid gap-5 md:grid-cols-4">
              {[
                ['$92.1M', 'Illustrative liability avoided'],
                ['0', 'Raw health records held'],
                ['15,376', 'Verification events in pilot cohort'],
                ['9,431', 'Binary receipts emitted'],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-white/15 pl-5">
                  <div className="font-mono text-xs uppercase tracking-[0.12em] text-[rgb(var(--hid-rust-400))]">{label}</div>
                  <div className="mt-3 text-5xl font-extrabold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insurers" className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:px-12">
          <div className="grid gap-6 md:grid-cols-3">
            {productCards.map(({ title, body, icon: Icon, href }) => (
              <Link key={title} to={href} className="group rounded-xl border border-[rgba(26,26,62,0.08)] bg-[rgb(var(--hid-cream-50))] p-6 transition-transform hover:-translate-y-0.5">
                <Icon size={24} strokeWidth={1.5} className="text-[rgb(var(--hid-rust-500))]" />
                <h3 className="mt-5 text-2xl font-bold text-[rgb(var(--hid-navy-900))]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--hid-navy-700))]">{body}</p>
                <div className="mt-5 font-mono text-xs uppercase tracking-[0.12em] text-[rgb(var(--hid-rust-500))]">See it live</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
