/**
 * Shared fetch wrapper.
 *
 * - Extracts `requestId` from response headers for correlation.
 * - Throws typed `AppError` so all callers get consistent error handling.
 * - Never logs or surfaces private keys / seeds / XDR in error messages.
 */

import { AppError } from '@/lib/errors';

export interface ApiErrorBody {
  statusCode?: number;
  error?: string;
  message?: string;
  requestId?: string;
}

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new AppError('NETWORK_ERROR', 'Network request failed');
  }

  const requestId =
    response.headers.get('x-request-id') ??
    response.headers.get('x-correlation-id') ??
    undefined;

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({}));
    const code =
      body.error?.toUpperCase().replace(/ /g, '_') ?? httpStatusToCode(response.status);
    throw new AppError(code, body.message ?? 'Request failed', requestId, body);
  }

  return response.json() as Promise<T>;
}

function httpStatusToCode(status: number): string {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMIT_EXCEEDED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
}
