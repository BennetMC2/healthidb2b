import { useEffect, useRef, useState } from "react";
import type { SimState } from "@sim/lib/sim";
import { askCopilot, buildCopilotContext, type CopilotMessage } from "@sim/lib/copilot";
import { MessageSquareText, Send, Sparkles, X } from "lucide-react";

const SUGGESTED = [
  "Why this verdict?",
  "What's driving the costs?",
  "How defensible are the assumptions?",
  "What reward would make this net-positive?",
];

// Floating co-pilot: grounded Q&A over the completed run. Every number it can
// cite comes from the same canonical context the panels read from.
export default function CopilotPanel({ state, selectedReward }: { state: SimState; selectedReward: number | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // The co-pilot is always reachable, but it only answers once a run has
  // produced numbers it can ground its answers in.
  const ready = !!state.finance;

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy || !ready) return;
    // context is rebuilt per question so it tracks the reward lever live
    const context = buildCopilotContext(state, selectedReward);
    if (!context) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const answer = await askCopilot(question, history, context);
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setError(e?.message || "Co-pilot request failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-2.5 font-mono text-xs font-semibold text-primary shadow-lg glow-accent hover-elevate"
        data-testid="button-copilot-open"
      >
        <Sparkles className="h-4 w-4" /> Ask co-pilot
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex max-h-[min(620px,80vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-primary/30 bg-card shadow-2xl"
      data-testid="panel-copilot"
    >
      <div className="flex items-center justify-between border-b border-card-border bg-background/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground">
          <MessageSquareText className="h-3.5 w-3.5" /> Results co-pilot
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close co-pilot"
          data-testid="button-copilot-close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3 scrollbar-thin">
        {!ready && (
          <p className="text-sm leading-relaxed text-foreground/80" data-testid="text-copilot-empty">
            Run a simulation first — I answer questions grounded only in the run&apos;s computed numbers, so there is
            nothing to cite yet. Set a goal on the Command &amp; Reward tab and hit run.
          </p>
        )}
        {ready && messages.length === 0 && (
          <div>
            <p className="text-sm leading-relaxed text-foreground/80">
              Ask about this run — the verdict, the value chain, the assumptions behind any number.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-lg border border-card-border bg-background/45 px-3 py-2 text-left text-xs text-foreground/80 hover:border-primary/40 hover:text-primary"
                  data-testid="button-copilot-suggested"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-6 rounded-lg bg-primary/15 px-3 py-2 text-sm leading-relaxed text-foreground"
                : "mr-2 whitespace-pre-wrap rounded-lg border border-card-border bg-background/45 px-3 py-2 text-sm leading-relaxed text-foreground/90"
            }
            data-testid={`copilot-message-${m.role}`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-2 rounded-lg border border-card-border bg-background/45 px-3 py-2 font-mono text-xs text-muted-foreground">
            Reading the run…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="text-copilot-error">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-card-border bg-background/40 p-2.5"
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!ready}
            placeholder={ready ? "Ask about this result…" : "Run a simulation first…"}
            className="min-w-0 flex-1 rounded-lg border border-card-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            data-testid="input-copilot"
          />
          <button
            type="submit"
            disabled={busy || !ready || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            aria-label="Send"
            data-testid="button-copilot-send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 font-mono text-[0.62rem] leading-relaxed text-muted-foreground">
          Answers cite only this run's computed numbers — verify against the panels.
        </p>
      </form>
    </div>
  );
}
