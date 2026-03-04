import { useState, useEffect } from 'react';
import { useDemoStore } from '@/stores/useDemoStore';

export function useSimulatedLoading(ms = 500): boolean {
  const [loading, setLoading] = useState(true);
  const demoActive = useDemoStore((s) => s.isActive);

  useEffect(() => {
    if (demoActive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(timer);
  }, [ms, demoActive]);

  return loading;
}
