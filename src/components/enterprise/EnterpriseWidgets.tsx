import { CalendarClock, Check, Hexagon, Radio, ShieldCheck, Sparkles } from 'lucide-react';
import { formatNumber } from '@/utils/format';
import type { PartnerPortfolio } from '@/data/partnerPortfolios';

const proofTicker = [
  'rcp_8f31a904 · 0x51d8b5…cea485ca',
  'rcp_cbaa8a52 · 0xba95b0…f07ab18c',
  'rcp_2290fe71 · 0x7e34c2…912ad4bf',
  'rcp_d8a04c19 · 0x12ce78…a09cc711',
];

export function ProofReceiptAnimation({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`proof-receipt ${compact ? 'p-3' : 'p-4'} rounded-xl border border-border bg-surface`}>
      <div className="flex items-center gap-3">
        <div className="proof-receipt__hex">
          <Hexagon size={26} />
          <ShieldCheck size={13} className="absolute" />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Proof verified</div>
          <div className="proof-receipt__ticker mt-1 h-5 overflow-hidden font-mono text-xs text-primary">
            <div className="proof-receipt__ticker-track">
              {[...proofTicker, ...proofTicker.slice(0, 1)].map((proof, index) => (
                <div key={`${proof}-${index}`} className="h-5 truncate">{proof}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {['Cohort rule matched', 'ZK proof valid', 'Raw data stayed local'].map((label, index) => (
          <div key={label} className="proof-receipt__check flex items-center gap-2 rounded border border-border bg-base/60 px-2 py-1.5" style={{ animationDelay: `${index * 180 + 260}ms` }}>
            <Check size={12} className="text-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-secondary">{label}</span>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 rounded bg-primary px-3 py-2 text-white">
          <div className="font-display text-lg font-semibold text-white">A+</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">Health Proof · Verified</div>
        </div>
      )}
    </div>
  );
}

export function FDECard({ portfolio }: { portfolio: PartnerPortfolio }) {
  return (
    <section className="card bg-surface">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Forward deployed engineer</div>
          <h3 className="mt-1 text-sm font-semibold text-primary">{portfolio.fde.name}</h3>
          <p className="mt-1 text-xs text-secondary">{portfolio.fde.role}</p>
          <div className="mt-3 grid gap-2 font-mono text-[11px] text-tertiary">
            <span>{portfolio.fde.channel}</span>
            <span className="flex items-center gap-1"><CalendarClock size={12} /> Next sync {portfolio.fde.nextSync}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResearchFeed({ portfolio }: { portfolio: PartnerPortfolio }) {
  return (
    <section className="card bg-surface">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Research feed</h3>
        <span className="flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
          <Radio size={11} /> Live
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {portfolio.researchFeed.map((item) => (
          <div key={`${item.time}-${item.title}`} className="rounded border border-border bg-base/60 px-3 py-3">
            <div className="font-mono text-[11px] text-accent">{item.time}</div>
            <div className="mt-1 text-xs font-medium text-primary">{item.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-tertiary">{item.impact}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PartnerPortfolioBand({ portfolio }: { portfolio: PartnerPortfolio }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <div className="rounded-xl border border-border bg-surface px-3 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">Lives monitored</div>
        <div className="mt-1 font-mono text-lg font-semibold text-primary">{formatNumber(portfolio.lives)}</div>
      </div>
      <div className="rounded-xl border border-border bg-surface px-3 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">Data sources</div>
        <div className="mt-1 font-mono text-lg font-semibold text-primary">{formatNumber(portfolio.dataSources)}</div>
      </div>
      <div className="rounded-xl border border-border bg-surface px-3 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">Lead signal</div>
        <div className="mt-1 font-mono text-lg font-semibold text-primary">{portfolio.leadSignal}</div>
      </div>
      <div className="rounded-xl border border-border bg-surface px-3 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-tertiary">Indexed papers</div>
        <div className="mt-1 font-mono text-lg font-semibold text-primary">{formatNumber(portfolio.indexedPapers)}</div>
      </div>
    </div>
  );
}

export function ActuaryProofMark() {
  return (
    <div className="relative hidden h-28 w-28 overflow-hidden rounded-[30px] border border-accent/25 bg-primary/80 text-accent xl:flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgb(var(--a-accent)/0.28),transparent_18%),linear-gradient(145deg,rgb(var(--n-elevated)/0.16),transparent)]" />
      <div className="absolute left-4 top-4 h-20 w-20 rounded-[24px] border border-accent/20" />
      <div className="absolute left-8 top-8 h-12 w-12 rotate-45 rounded-xl border border-accent/35 bg-accent/10" />
      <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-accent/25 bg-accent/15">
        <ShieldCheck size={24} strokeWidth={1.6} />
      </div>
      <div className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-accent animate-[pulseDot_2s_ease-in-out_infinite]" />
      <div className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent/80">ZK</div>
      <div className="absolute bottom-5 right-5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent/80">A+</div>
    </div>
  );
}
