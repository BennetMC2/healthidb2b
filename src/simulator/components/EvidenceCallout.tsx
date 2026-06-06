import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EvidenceCalloutProps {
  type?: 'info' | 'warning' | 'success';
  title: string;
  children: React.ReactNode;
  source?: string;
}

const STYLES = {
  info: {
    border: 'border-accent/20',
    bg: 'bg-accent/5',
    icon: <Info size={15} className="text-accent shrink-0" />,
    titleColor: 'text-accent',
  },
  warning: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    icon: <AlertTriangle size={15} className="text-amber-500 shrink-0" />,
    titleColor: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    icon: <CheckCircle2 size={15} className="text-green-500 shrink-0" />,
    titleColor: 'text-green-600 dark:text-green-400',
  },
};

export default function EvidenceCallout({ type = 'info', title, children, source }: EvidenceCalloutProps) {
  const style = STYLES[type];

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${style.titleColor}`}>
        {style.icon}
        {title}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-secondary">
        {children}
      </div>
      {source && (
        <div className="mt-2 text-2xs text-tertiary">
          Source: {source}
        </div>
      )}
    </div>
  );
}
