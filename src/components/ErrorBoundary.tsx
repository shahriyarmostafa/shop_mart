'use client';

import { Component, ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

/**
 * Last-resort safety net for the admin area. Anything that throws during
 * render anywhere below this in the tree (bad data, an unexpected null,
 * a third-party component misbehaving, etc.) is caught here and shown as a
 * friendly message instead of a blank white screen / dev overlay.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Something went wrong.',
    };
  }

  componentDidCatch(error: unknown) {
    // Log for diagnostics; still fully caught so the UI stays usable.
    console.error('[admin] caught render error:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-card p-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-spice/10 flex items-center justify-center mb-4">
              <AlertOctagon size={24} className="text-spice" />
            </div>
            <h1 className="font-display text-xl font-semibold text-ink mb-2">Something went wrong</h1>
            <p className="text-ink-400 text-sm mb-6">
              {this.state.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <button
              onClick={this.handleReset}
              className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
