import { getConfig } from '@/config/env'

export type TxType = 'all' | 'policy' | 'claims'

export interface TxRecord {
  hash: string
  type: 'Premium Payment' | 'Claim Payout' | 'Policy Renewal' | 'Claim Submission'
  timestamp: string
  status: 'success' | 'failed'
  /** Source: chain-derived (raw Stellar tx) or indexer-derived (insurance metadata) */
  source: 'chain' | 'indexer'
}

export interface TxHistoryPage {
  items: TxRecord[]
  nextCursor: string | null
}

export async function fetchTransactionHistory(
  address: string,
  filter: TxType,
  cursor?: string,
  limit = 20,
): Promise<TxHistoryPage> {
  const { apiUrl } = getConfig()
  const params = new URLSearchParams({ limit: String(limit) })
  if (filter !== 'all') params.set('type', filter)
  if (cursor) params.set('cursor', cursor)

  const res = await fetch(
    `${apiUrl}/api/v1/account/${encodeURIComponent(address)}/history?${params}`,
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const error = new Error(err.message ?? 'Failed to fetch transaction history') as Error & {
      status: number
    }
    ;(error as { status: number }).status = res.status
    throw error
  }

  return res.json() as Promise<TxHistoryPage>
}
