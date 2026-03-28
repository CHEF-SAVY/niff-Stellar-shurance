'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveErrorMessage, getCorrelationId } from '@/lib/errors';

interface InlineErrorProps {
  error: unknown;
  /** If provided, renders a retry button */
  onRetry?: () => void;
  className?: string;
}

/**
 * Standardized inline error for forms and data-fetch sections.
 * Shows user-safe message + optional correlation ID + optional retry button.
 */
export function InlineError({ error, onRetry, className }: InlineErrorProps) {
  const message = resolveErrorMessage(error);
  const correlationId = getCorrelationId(error);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm ${className ?? ''}`}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-destructive font-medium">{message}</p>
        {correlationId && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Ref: <code className="font-mono">{correlationId}</code>
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0 h-7 px-2">
          <RefreshCw className="h-3 w-3 mr-1" aria-hidden />
          Retry
        </Button>
      )}
    </div>
  );
}
