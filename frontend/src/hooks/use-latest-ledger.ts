"use client";

import { useEffect, useState } from "react";
import { getConfig } from "@/config/env";

/**
 * Polls Horizon for the latest closed ledger sequence (public, unauthenticated).
 * Used to align claim voting countdowns with the same ledger axis as the contract.
 */
export function useLatestLedger(pollMs = 15_000): number | null {
  const [seq, setSeq] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { horizonUrl } = getConfig();

    async function tick() {
      try {
        const res = await fetch(`${horizonUrl}/ledgers?order=desc&limit=1`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          _embedded?: { records?: { sequence?: number }[] };
        };
        const s = data._embedded?.records?.[0]?.sequence;
        if (typeof s === "number" && !cancelled) setSeq(s);
      } catch {
        /* ignore transient Horizon errors */
      }
    }

    void tick();
    const id = setInterval(() => void tick(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return seq;
}
