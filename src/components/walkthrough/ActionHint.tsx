import { useEffect, useState, useCallback } from 'react';
import { MousePointerClick } from 'lucide-react';

interface ActionHintProps {
  targetSelector: string | null;
  text: string;
}

export default function ActionHint({ targetSelector, text }: ActionHintProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!targetSelector) {
      setPosition(null);
      return;
    }
    const el = document.querySelector(targetSelector);
    if (!el) {
      setPosition(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 12,
      left: rect.left + rect.width / 2,
    });
  }, [targetSelector]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    const observer = new MutationObserver(() => {
      requestAnimationFrame(updatePosition);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      observer.disconnect();
    };
  }, [updatePosition]);

  if (!position) return null;

  return (
    <div
      className="fixed z-[9200] -translate-x-1/2 animate-hint-pulse"
      style={{ top: position.top, left: position.left, pointerEvents: 'none' }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded border border-accent/30 bg-accent-dim text-accent text-base font-medium whitespace-nowrap">
        <MousePointerClick size={16} />
        {text}
      </div>
      {/* Arrow pointing up */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-dim border-l border-t border-accent/30 rotate-45" />
    </div>
  );
}
