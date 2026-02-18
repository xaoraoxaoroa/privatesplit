import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
        <div className="bg-terminal-bg border border-terminal-red p-6 m-4 font-mono">
          <p className="text-terminal-red text-sm tracking-wider mb-2">
            &gt; SYSTEM ERROR
          </p>
          <p className="text-terminal-dim text-xs mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="border border-terminal-red text-terminal-red px-4 py-2 text-xs tracking-widest uppercase hover:bg-terminal-red hover:text-terminal-bg transition-colors"
          >
            [ REBOOT ]
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
