export default function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border bg-surface px-4 py-2.5 text-2xs text-tertiary">
      <div className="flex items-center gap-2">
        <span>&copy; 2026 HealthID Foundation Ltd · Hong Kong</span>
        <span className="inline-flex items-center gap-1 rounded border border-border bg-elevated px-2 py-0.5 font-mono text-2xs lowercase text-tertiary">
          Pilot environment · illustrative cohort
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a href="https://healthid.life" target="_blank" rel="noreferrer" className="hover:text-accent">
          Consumer site ↗
        </a>
        <span>Privacy</span>
        <span>Terms</span>
        <span>Security</span>
      </div>
    </footer>
  );
}
