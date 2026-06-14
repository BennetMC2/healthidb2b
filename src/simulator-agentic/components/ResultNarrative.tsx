import type { NarrativeReport } from "@shared/schema";
import { fmtPmpm } from "@sim/lib/format";
import { FileText, ChevronRight } from "lucide-react";

// TIER 3 drill-down: the analyst's written note. The verdict chip and the
// recommendation live in the Decision Card (Tier 1); this panel carries the
// longer prose walk-through, the drivers and the confidence note.
export default function ResultNarrative({
  report,
  configured,
}: {
  report: NarrativeReport;
  configured: boolean;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card/40 p-4 sm:p-5" data-testid="card-result-narrative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" /> Analyst's note
        </div>
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
          {configured ? "configured reward economics" : "impact-only mode until rewards are configured"}
          {configured && typeof report.atRewardPmpm === "number" && (
            <span className="text-foreground/60"> · computed at {fmtPmpm(report.atRewardPmpm)}</span>
          )}
        </div>
      </div>

      {/* plain-english summary */}
      <p className="mb-4 text-sm leading-relaxed text-foreground/80" data-testid="text-narrative-summary">
        {report.summary}
      </p>

      {/* drivers */}
      {report.drivers?.length > 0 && (
        <div className="mb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {report.drivers.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 rounded-md border border-card-border bg-background/40 px-2.5 py-2 font-mono text-[0.72rem] leading-snug text-foreground/75"
              data-testid={`text-narrative-driver-${i}`}
            >
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{d}</span>
            </div>
          ))}
        </div>
      )}

      {/* confidence note */}
      <p className="border-t border-card-border pt-3 font-mono text-[0.68rem] leading-relaxed text-muted-foreground" data-testid="text-narrative-confidence">
        <span className="text-foreground/55">Confidence — </span>
        {report.confidence}
      </p>
    </div>
  );
}
