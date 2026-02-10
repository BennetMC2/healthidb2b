import { useEffect, useState, useCallback } from 'react';

interface SpotlightOverlayProps {
  targetSelector: string | null;
}

export default function SpotlightOverlay({ targetSelector }: SpotlightOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    if (!targetSelector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(targetSelector);
    if (!el) {
      setRect(null);
      return;
    }
    setRect(el.getBoundingClientRect());
  }, [targetSelector]);

  useEffect(() => {
    updateRect();

    // Re-measure on scroll/resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    // Also observe DOM changes (elements might appear after navigation)
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updateRect);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
      observer.disconnect();
    };
  }, [updateRect]);

  if (!rect) {
    // Full-screen dim with no cutout
    return (
      <div
        className="fixed inset-0 z-[9000] bg-black/60 transition-opacity duration-300"
        style={{ pointerEvents: 'none' }}
      />
    );
  }

  const padding = 6;

  return (
    <>
      {/* Four overlay panels around the cutout */}
      {/* Top */}
      <div
        className="fixed left-0 right-0 top-0 bg-black/60 z-[9000] transition-all duration-300"
        style={{
          height: Math.max(0, rect.top - padding),
          pointerEvents: 'auto',
        }}
      />
      {/* Bottom */}
      <div
        className="fixed left-0 right-0 bottom-0 bg-black/60 z-[9000] transition-all duration-300"
        style={{
          height: Math.max(0, window.innerHeight - rect.bottom - padding),
          pointerEvents: 'auto',
        }}
      />
      {/* Left */}
      <div
        className="fixed left-0 bg-black/60 z-[9000] transition-all duration-300"
        style={{
          top: rect.top - padding,
          height: rect.height + padding * 2,
          width: Math.max(0, rect.left - padding),
          pointerEvents: 'auto',
        }}
      />
      {/* Right */}
      <div
        className="fixed right-0 bg-black/60 z-[9000] transition-all duration-300"
        style={{
          top: rect.top - padding,
          height: rect.height + padding * 2,
          left: rect.right + padding,
          pointerEvents: 'auto',
        }}
      />
      {/* Cutout border highlight */}
      <div
        className="fixed z-[9001] rounded border border-accent/30 transition-all duration-300"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
