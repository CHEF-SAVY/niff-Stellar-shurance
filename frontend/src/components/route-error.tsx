'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveErrorMessage, getCorrelationId } from '@/lib/errors';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  area: string;
}

/**
 * Shared render for Next.js route-level error.tsx files.
 * Keeps all feature-area error UIs consistent.
 */
export function RouteError({ error, reset, area }: Props) {
  const isDev = process.env.NODE_ENV !== 'production';
  const correlationId = getCorrelationId(error) ?? error.digest;

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Forward anonymized event — replace with your observability SDK
      console.error('[RouteError]', { area, correlationId });
    } else {
      console.error('[RouteError dev]', error);
    }
  }, [error, area, correlationId]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center gap-4"
    >
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
      <div>
        <p className="font-semibold text-lg">{area} unavailable</p>
        <p className="text-muted-foreground text-sm mt-1">{resolveErrorMessage(error)}</p>
        {correlationId && (
          <p className="text-xs text-muted-foreground mt-2">
            Support reference: <code className="font-mono">{correlationId}</code>
          </p>
        )}
      </div>

      {isDev && (
        <details className="w-full max-w-xl text-left text-xs border rounded p-3 bg-muted">
          <summary className="cursor-pointer font-medium">Technical details (dev only)</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all opacity-80">
            {error.stack ?? error.message}
          </pre>
        </details>
      )}

      <Button variant="outline" size="sm" onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-2" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
