'use client';

import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { resolveErrorMessage, getCorrelationId } from '@/lib/errors';

/**
 * Standardized error toast helper.
 * Call `toastError(err)` from any form submit / mutation handler.
 * Shows user-safe message; appends correlation ID when available.
 */
export function useErrorToast() {
  const toastError = useCallback((error: unknown, title = 'Something went wrong') => {
    const description = resolveErrorMessage(error);
    const correlationId = getCorrelationId(error);

    toast({
      variant: 'destructive',
      title,
      description: correlationId
        ? `${description} (Ref: ${correlationId})`
        : description,
    });
  }, []);

  return { toastError };
}
