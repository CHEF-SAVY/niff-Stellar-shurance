'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveErrorMessage, getCorrelationId } from '@/lib/errors';

interface Props {
  children: React.ReactNode;
  /** Shown in the fallback heading, e.g. "Claims Board" */
  area?: string;
}

interface State {
  error: unknown;
  hasError: boolean;
}

/**
 * Error boundary for a major feature area.
 *
 * - In development: shows a collapsible technical details panel.
 * - In production: shows only a user-safe message + correlation ID.
 * - Never renders private keys, seeds, or raw XDR.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Forward anonymized event to observability (no PII, no stack in prod)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const correlationId = getCorrelationId(error);
      // Replace with your observability SDK call, e.g. Sentry.captureException
      console.error('[ErrorBoundary]', {
        area: this.props.area,
        correlationId,
        componentStack: info.componentStack?.slice(0, 200), // truncate
      });
    } else {
      console.error('[ErrorBoundary dev]', error, info);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const userMessage = resolveErrorMessage(error);
    const correlationId = getCorrelationId(error);
    const isDev = process.env.NODE_ENV !== 'production';

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center gap-4"
      >
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
        <div>
          <p className="font-semibold text-lg">
            {this.props.area ? `${this.props.area} unavailable` : 'Something went wrong'}
          </p>
          <p className="text-muted-foreground text-sm mt-1">{userMessage}</p>
          {correlationId && (
            <p className="text-xs text-muted-foreground mt-2">
              Support reference:{' '}
              <code className="font-mono">{correlationId}</code>
            </p>
          )}
        </div>

        {isDev && error instanceof Error && (
          <details className="w-full max-w-xl text-left text-xs border rounded p-3 bg-muted">
            <summary className="cursor-pointer font-medium">Technical details (dev only)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all opacity-80">
              {error.stack ?? error.message}
            </pre>
          </details>
        )}

        <Button variant="outline" size="sm" onClick={this.reset}>
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden />
          Try again
        </Button>
      </div>
    );
  }
}
