export default function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border bg-surface px-4 py-2.5 text-2xs text-tertiary">
      <div className="flex items-center gap-2">
        <span>&copy; 2026 HealthID Protocol</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-muted border border-success/15 text-success text-2xs font-medium">
          SOC 2 Type II
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a href="#" className="hover:text-secondary transition-colors">Privacy</a>
        <a href="#" className="hover:text-secondary transition-colors">Terms</a>
        <a href="#" className="hover:text-secondary transition-colors">Security</a>
      </div>
    </footer>
  );
}
