/**
 * Retry helper for idempotent read operations.
 *
 * Uses exponential backoff with jitter. Only retries on transient errors
 * (network failures, 5xx, rate limits). Never retries 4xx client errors
 * (except 429 with Retry-After).
 */

import { AppError } from '@/lib/errors';

const RETRYABLE_CODES = new Set([
  'NETWORK_ERROR',
  'SERVER_ERROR',
  'SOROBAN_RPC_ERROR',
  'TIMEOUT_ERROR',
  'RATE_LIMIT_EXCEEDED',
]);

function isRetryable(error: unknown): boolean {
  if (error instanceof AppError) return RETRYABLE_CODES.has(error.code);
  if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) return true;
  return false;
}

function backoffMs(attempt: number, baseMs = 500, maxMs = 10_000): number {
  const exp = Math.min(baseMs * 2 ** attempt, maxMs);
  // ±20% jitter
  return exp * (0.8 + Math.random() * 0.4);
}

export interface RetryOptions {
  maxAttempts?: number;
  baseMs?: number;
  maxMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseMs = 500, maxMs = 10_000, onRetry } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === maxAttempts - 1) throw err;
      onRetry?.(attempt + 1, err);
      await new Promise((r) => setTimeout(r, backoffMs(attempt, baseMs, maxMs)));
    }
  }
  throw lastError;
}
