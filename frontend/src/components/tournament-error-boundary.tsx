"use client";

import React from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class TournamentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "[TournamentErrorBoundary] Caught an error:",
      error,
      errorInfo,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-black text-white font-sans flex items-center justify-center p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-4xl font-black mb-4 text-red-500">
                Tournament Error
              </h1>
              <p className="text-xl text-neutral-400 mb-4">
                Something went wrong loading the tournament arena.
              </p>
              {this.state.error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-left">
                  <p className="text-sm text-red-400 font-mono mb-2">
                    Error Message:
                  </p>
                  <p className="text-sm text-white">
                    {this.state.error.message}
                  </p>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300">
                      View Full Error Details
                    </summary>
                    <pre className="mt-2 text-xs text-red-400 bg-black/50 p-4 rounded overflow-auto max-h-48">
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/"
                  className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
            <div className="mt-8 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
              <h3 className="text-sm font-bold text-neutral-500 mb-3">
                Troubleshooting Tips
              </h3>
              <ul className="text-sm text-neutral-400 space-y-2">
                <li>• Check that the backend server is running on port 8765</li>
                <li>• Refresh the page to retry</li>
                <li>• Check browser console for detailed error logs</li>
                <li>• Make sure WebSocket connections are allowed</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
