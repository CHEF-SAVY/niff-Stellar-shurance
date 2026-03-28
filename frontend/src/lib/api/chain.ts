/**
 * chain.ts — Trust-minimised reads via Soroban simulation.
 *
 * These functions call the backend's /api/chain/* simulation endpoints, which
 * forward read-only invocations to the Soroban RPC without requiring a signed
 * transaction.  The backend never writes state on behalf of the caller.
 *
 * ## Chain reads vs indexer reads
 *
 * | Property          | Chain read (this file)         | Indexer read (policy.ts / claim.ts) |
 * |-------------------|-------------------------------|--------------------------------------|
 * | Latency           | Current ledger (no lag)       | 1–3 ledger lag (~5–15 s on Mainnet)  |
 * | Trust             | Verified against ledger state | Depends on indexer correctness       |
 * | Cost              | Simulation fee (free read)    | Plain HTTP GET, no on-chain cost     |
 * | Best for          | Detail views, 404 detection   | List views, dashboards               |
 *
 * ## Pagination
 *
 * Both `listPolicies` and `listClaims` use an **exclusive cursor** strategy:
 *   - Pass `startAfter = 0` for the first page.
 *   - Pass the last `policy_id` / `claim_id` from the previous page to advance.
 *   - An empty result array means no more pages exist.
 *
 * `limit` is silently clamped to `CHAIN_PAGE_SIZE_MAX` (20) by the contract.
 * Requesting more than 20 items in one call is safe but will never return more
 * than 20 items.
 *
 * Stale cursors: because IDs are monotonically increasing and records are never
 * deleted, a cursor pointing past the last item returns an empty page — it
 * never panics or skips records.
 */

import { getConfig } from '@/config/env';
import type { OnChainPolicySummary, OnChainClaimSummary } from '@/types/claim';

const { apiUrl: API_BASE_URL } = getConfig();

/** Mirrors on-chain `POLICY_BATCH_GET_MAX` / `PAGE_SIZE_MAX` (contracts/niffyinsure). */
export const POLICY_BATCH_GET_MAX = 20;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // NestJS BadRequestException({ code, message }) → { message: { code, message }, statusCode }
    const nested =
      body.message !== undefined &&
      typeof body.message === 'object' &&
      !Array.isArray(body.message)
        ? (body.message as { code?: string; message?: string })
        : null;
    const code = nested?.code ?? body.code ?? 'CHAIN_READ_FAILED';
    const msg =
      nested?.message ??
      (typeof body.message === 'string' ? body.message : null) ??
      body.error ??
      'Chain read failed';
    throw new ChainReadError(code, msg);
  }
  return res.json();
}

export class ChainReadError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ChainReadError';
  }
}

/**
 * Fetch a single policy by (holder, policyId) via Soroban simulation.
 * Returns `null` when the policy does not exist (404 pattern).
 */
export type PolicyBatchKey = { holder: string; policyId: number };

/**
 * Batch-fetch policies via one `get_policies_batch` simulation.
 * Results align with `keys`; missing policies are `null` at that index.
 */
export async function getPoliciesBatch(
  keys: PolicyBatchKey[],
): Promise<(Record<string, unknown> | null)[]> {
  if (keys.length > POLICY_BATCH_GET_MAX) {
    throw new ChainReadError(
      'POLICY_BATCH_TOO_LARGE',
      `At most ${POLICY_BATCH_GET_MAX} policies per batch.`,
    );
  }
  const res = await fetch(`${API_BASE_URL}/api/chain/policies/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keys: keys.map((k) => ({ holder: k.holder, policy_id: k.policyId })),
    }),
  });
  const data = await handleResponse<{ results: (Record<string, unknown> | null)[] }>(res);
  return data.results;
}

export async function getPolicy(
  holder: string,
  policyId: number,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/chain/policies/${encodeURIComponent(holder)}/${policyId}`,
  );
  if (res.status === 404) return null;
  return handleResponse<Record<string, unknown>>(res);
}

/**
 * Fetch a single claim by claimId via Soroban simulation.
 * Returns `null` when the claim does not exist (404 pattern).
 */
export async function getClaim(claimId: number | bigint): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API_BASE_URL}/api/chain/claims/${claimId}`);
  if (res.status === 404) return null;
  return handleResponse<Record<string, unknown>>(res);
}

/**
 * Paginated list of a holder's policy summaries via Soroban simulation.
 *
 * @param holder      - Stellar address of the policy holder.
 * @param startAfter  - Exclusive cursor (policy_id). Pass 0 for the first page.
 * @param limit       - Items per page. Clamped to 20 by the contract.
 */
export async function listPolicies(
  holder: string,
  startAfter = 0,
  limit = 20,
): Promise<OnChainPolicySummary[]> {
  const params = new URLSearchParams({
    start_after: String(startAfter),
    limit: String(limit),
  });
  const res = await fetch(
    `${API_BASE_URL}/api/chain/policies/${encodeURIComponent(holder)}?${params}`,
  );
  return handleResponse<OnChainPolicySummary[]>(res);
}

/**
 * Paginated list of claim summaries via Soroban simulation.
 *
 * @param startAfter  - Exclusive cursor (claim_id). Pass 0 for the first page.
 * @param limit       - Items per page. Clamped to 20 by the contract.
 */
export async function listClaims(
  startAfter: number | bigint = 0,
  limit = 20,
): Promise<OnChainClaimSummary[]> {
  const params = new URLSearchParams({
    start_after: String(startAfter),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE_URL}/api/chain/claims?${params}`);
  return handleResponse<OnChainClaimSummary[]>(res);
}

export const CHAIN_READ_ERROR_MESSAGES: Record<string, string> = {
  CHAIN_READ_FAILED: 'Chain read failed. Please try again.',
  CONTRACT_NOT_INITIALIZED: 'Contract is not yet initialized.',
  POLICY_BATCH_TOO_LARGE: 'Too many policies in one batch. Load at most 20 at a time.',
  RPC_UNAVAILABLE: 'Soroban RPC is temporarily unavailable. Falling back to indexer data.',
};

export function getChainReadErrorMessage(error: ChainReadError): string {
  return CHAIN_READ_ERROR_MESSAGES[error.code] ?? error.message;
}
