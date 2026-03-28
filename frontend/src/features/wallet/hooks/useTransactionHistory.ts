'use client'

import { useState, useCallback, useRef } from 'react'

import { fetchTransactionHistory, TxType, TxRecord } from '@/lib/api/transaction-history'

interface State {
  items: TxRecord[]
  isLoading: boolean
  isLoadingMore: boolean
  error: Error & { status?: number } | null
  hasMore: boolean
}

export function useTransactionHistory(address: string | null) {
  const [filter, setFilterState] = useState<TxType>('all')
  const [state, setState] = useState<State>({
    items: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: false,
  })
  const cursorRef = useRef<string | null>(null)

  const load = useCallback(
    async (nextFilter: TxType, append = false) => {
      if (!address) return
      setState((s) => ({
        ...s,
        isLoading: !append,
        isLoadingMore: append,
        error: null,
      }))
      try {
        const page = await fetchTransactionHistory(
          address,
          nextFilter,
          append ? (cursorRef.current ?? undefined) : undefined,
        )
        cursorRef.current = page.nextCursor
        setState((s) => ({
          items: append ? [...s.items, ...page.items] : page.items,
          isLoading: false,
          isLoadingMore: false,
          error: null,
          hasMore: page.nextCursor !== null,
        }))
      } catch (err) {
        setState((s) => ({
          ...s,
          isLoading: false,
          isLoadingMore: false,
          error: err as Error & { status?: number },
        }))
      }
    },
    [address],
  )

  const setFilter = useCallback(
    (f: TxType) => {
      cursorRef.current = null
      setFilterState(f)
      load(f, false)
    },
    [load],
  )

  const refresh = useCallback(() => {
    cursorRef.current = null
    load(filter, false)
  }, [filter, load])

  const loadMore = useCallback(() => load(filter, true), [filter, load])

  return { ...state, filter, setFilter, refresh, loadMore }
}
