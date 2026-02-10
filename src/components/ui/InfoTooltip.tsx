import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export default function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      <Info
        size={12}
        className="text-tertiary hover:text-secondary cursor-help transition-colors"
      />
      <span
        className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
          px-2.5 py-1.5 rounded bg-elevated border border-border
          text-2xs text-secondary leading-relaxed
          w-[240px] text-center
          opacity-0 pointer-events-none scale-95
          group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100
          transition-all duration-150
          z-50
        "
      >
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-border" />
      </span>
    </span>
  );
}
