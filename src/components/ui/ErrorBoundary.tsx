import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 h-full">
          <div className="w-12 h-12 rounded-lg bg-error-muted border border-error/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-error" />
          </div>
          <div className="text-center max-w-[400px]">
            <p className="text-sm font-medium text-primary">
              {this.props.fallbackTitle || 'Something went wrong'}
            </p>
            <p className="text-xs text-tertiary mt-1">
              {this.state.error?.message || 'An unexpected error occurred. Try refreshing the page.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="btn-primary text-xs mt-2"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
