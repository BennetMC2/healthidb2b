import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background p-6 text-foreground">
          <div className="mx-auto max-w-2xl rounded-xl border border-destructive/40 bg-destructive/10 p-5">
            <div className="font-mono text-sm font-semibold text-destructive">Application error</div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              A UI component failed while rendering the simulation. The page stayed loaded so the error can be fixed.
            </p>
            <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-card-border bg-background/70 p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
