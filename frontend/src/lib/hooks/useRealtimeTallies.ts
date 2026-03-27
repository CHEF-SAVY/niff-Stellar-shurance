"use client";

import { useEffect, useRef } from "react";
import { z } from "zod";
import type { TallyUpdate } from "@/components/claims/types";

// Schema to validate untrusted SSE / polling payloads before use
const TallyUpdateSchema = z.object({
  claimId: z.string(),
  approveVotes: z.number().int().nonnegative(),
  rejectVotes: z.number().int().nonnegative(),
  status: z.enum(["open", "closed", "pending"]),
})

function parseTallyUpdate(raw: unknown): TallyUpdate | null {
  const result = TallyUpdateSchema.safeParse(raw)
  return result.success ? (result.data as TallyUpdate) : null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_INTERVAL_MS = 5_000;
const MAX_INTERVAL_MS = 60_000;

// ---------------------------------------------------------------------------
// Pure helper — exported so it can be property-tested (Property 13, Req 6.2)
// ---------------------------------------------------------------------------

/**
 * Computes the polling interval for a given consecutive failure count using
 * exponential backoff: min(baseMs * 2^failureCount, maxMs).
 *
 * @param failureCount - Number of consecutive polling failures (≥ 0)
 * @param baseMs       - Base interval in milliseconds (default 5 000)
 * @param maxMs        - Maximum interval cap in milliseconds (default 60 000)
 */
export function calcBackoffMs(
  failureCount: number,
  baseMs: number = BASE_INTERVAL_MS,
  maxMs: number = MAX_INTERVAL_MS,
): number {
  return Math.min(baseMs * Math.pow(2, failureCount), maxMs);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Keeps tally data fresh by:
 *  1. Attempting an SSE connection to /api/claims/events (Req 6.1).
 *  2. Falling back to polling /api/claims/tallies with exponential backoff
 *     when SSE is unavailable (Req 6.2).
 *  3. Pausing polling (not SSE) while document.visibilityState === 'hidden'
 *     and resuming on visibility change (Req 6.3).
 *  4. Cancelling all pending requests and clearing all timers on unmount
 *     (Req 6.4).
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function useRealtimeTallies(
  claimIds: string[],
  onUpdate: (update: TallyUpdate) => void,
): void {
  // Stable ref for the callback so the polling loop never captures a stale closure.
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  // Stable ref for claimIds to avoid re-running the effect on every render
  // when the caller passes a new array literal with the same contents.
  const claimIdsRef = useRef(claimIds);
  useEffect(() => {
    claimIdsRef.current = claimIds;
  });

  useEffect(() => {
    // -----------------------------------------------------------------------
    // Shared teardown state
    // -----------------------------------------------------------------------
    let unmounted = false;

    // -----------------------------------------------------------------------
    // SSE path
    // -----------------------------------------------------------------------
    let eventSource: EventSource | null = null;
    let sseConnected = false;

    // -----------------------------------------------------------------------
    // Polling path
    // -----------------------------------------------------------------------
    let failureCount = 0;
    let pollTimerId: ReturnType<typeof setTimeout> | null = null;
    let pollAbortController: AbortController | null = null;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    function clearPollTimer() {
      if (pollTimerId !== null) {
        clearTimeout(pollTimerId);
        pollTimerId = null;
      }
    }

    function abortPollRequest() {
      pollAbortController?.abort();
      pollAbortController = null;
    }

    async function poll() {
      if (unmounted || sseConnected) return;
      if (document.visibilityState === "hidden") return; // paused (Req 6.3)

      abortPollRequest();
      const controller = new AbortController();
      pollAbortController = controller;

      try {
        const ids = claimIdsRef.current;
        if (ids.length === 0) {
          scheduleNextPoll(false);
          return;
        }

        const params = new URLSearchParams();
        ids.forEach((id) => params.append("claimId", id));

        const response = await fetch(
          `/api/claims/tallies?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`);
        }

        const updates = (await response.json() as unknown[]);
        if (!unmounted) {
          updates.forEach((raw) => {
            const u = parseTallyUpdate(raw);
            if (u) onUpdateRef.current(u);
          });
          failureCount = 0; // reset on success
          scheduleNextPoll(false);
        }
      } catch (err) {
        if (unmounted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        failureCount += 1;
        scheduleNextPoll(true);
      }
    }

    function scheduleNextPoll(isFailure: boolean) {
      if (unmounted || sseConnected) return;
      clearPollTimer();
      const delay = isFailure ? calcBackoffMs(failureCount) : calcBackoffMs(0); // success → base interval
      pollTimerId = setTimeout(() => {
        if (!unmounted && !sseConnected) poll();
      }, delay);
    }

    // -----------------------------------------------------------------------
    // Visibility change handler — resume polling when tab becomes visible
    // -----------------------------------------------------------------------
    function handleVisibilityChange() {
      if (unmounted || sseConnected) return;
      if (document.visibilityState === "visible") {
        clearPollTimer();
        poll(); // poll immediately on resume
      }
      // When hidden: the next scheduled poll will be a no-op (guarded above).
    }

    // -----------------------------------------------------------------------
    // SSE setup
    // -----------------------------------------------------------------------
    function startSSE() {
      try {
        eventSource = new EventSource("/api/claims/events");

        eventSource.onopen = () => {
          if (unmounted) {
            eventSource?.close();
            return;
          }
          sseConnected = true;
          // SSE is up — stop any polling that may have started.
          clearPollTimer();
          abortPollRequest();
        };

        eventSource.onmessage = (event: MessageEvent) => {
          if (unmounted) return;
          try {
            const raw: unknown = JSON.parse(event.data as string);
            const update = parseTallyUpdate(raw);
            if (update) onUpdateRef.current(update);
          } catch {
            // Ignore malformed messages.
          }
        };

        eventSource.onerror = () => {
          if (unmounted) return;
          // SSE failed or closed — fall back to polling.
          eventSource?.close();
          eventSource = null;
          sseConnected = false;
          // Start polling immediately.
          poll();
        };
      } catch {
        // EventSource constructor can throw in environments where it is not
        // available (e.g. some test environments). Fall back to polling.
        sseConnected = false;
        poll();
      }
    }

    // -----------------------------------------------------------------------
    // Boot
    // -----------------------------------------------------------------------
    document.addEventListener("visibilitychange", handleVisibilityChange);
    startSSE();

    // -----------------------------------------------------------------------
    // Cleanup (Req 6.4)
    // -----------------------------------------------------------------------
    return () => {
      unmounted = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      eventSource?.close();
      eventSource = null;
      clearPollTimer();
      abortPollRequest();
    };
    // Intentionally empty deps: the effect runs once on mount and cleans up
    // on unmount. claimIds and onUpdate are accessed via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
