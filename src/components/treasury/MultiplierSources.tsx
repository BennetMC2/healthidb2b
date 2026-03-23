import { TrendingUp, ArrowUpRight, RefreshCw } from 'lucide-react';

const sources = [
  {
    icon: TrendingUp,
    title: 'Yield Generation',
    description: 'Idle funds earn 4–5% APY in tokenized T-Bills (BUIDL/USDY)',
    metric: '4.5% APY',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: ArrowUpRight,
    title: 'Wholesale Buying Power',
    description: 'Enterprise bulk purchasing: 1.5¢ protocol cost → 3.0¢+ perceived user value',
    metric: '150% arbitrage',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: RefreshCw,
    title: 'Double Float & Breakage',
    description: 'Users save 6–18 months toward aspirational goals; unredeemed value recycles after 24 months',
    metric: '48% float rate',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
];

export default function MultiplierSources() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {sources.map((s) => (
        <div key={s.title} className="card flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded ${s.bg} flex items-center justify-center`}>
              <s.icon size={14} className={s.color} />
            </div>
            <span className="text-xs font-semibold text-primary">{s.title}</span>
          </div>
          <p className="text-2xs text-tertiary leading-relaxed">{s.description}</p>
          <span className={`font-mono text-sm font-bold ${s.color} mt-auto`}>{s.metric}</span>
        </div>
      ))}
    </div>
  );
}
