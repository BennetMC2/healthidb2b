import { useEffect, useMemo, useState } from 'react';

const SCAN_INTERVAL_MINUTES = 60;
const LAST_SCAN_MINUTE = 14;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getHktNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
}

function computeScanClock() {
  const now = getHktNow();
  const lastScan = new Date(now);
  lastScan.setMinutes(LAST_SCAN_MINUTE, 0, 0);

  if (lastScan > now) {
    lastScan.setHours(lastScan.getHours() - 1);
  }

  const nextScan = new Date(lastScan);
  nextScan.setMinutes(nextScan.getMinutes() + SCAN_INTERVAL_MINUTES);

  const remainingMs = Math.max(nextScan.getTime() - now.getTime(), 0);
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000);

  return {
    lastScanLabel: `${pad(lastScan.getHours())}:${pad(lastScan.getMinutes())} HKT`,
    nextScanLabel: `${pad(remainingMinutes)}:${pad(remainingSeconds)}`,
  };
}

export function useScanClock() {
  const initial = useMemo(() => computeScanClock(), []);
  const [clock, setClock] = useState(initial);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(computeScanClock()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return clock;
}
