"use client";

// Feature: claims-board
// Requirements: 10.1, 10.2, 10.3

import { useEffect, useRef } from "react";

import type { ClaimFilters } from "@/components/claims/types";
import type { ClaimBoard } from "@/lib/schemas/claims-board";

export interface NotificationPrefs {
  enabled: boolean;
  maxPerMinute?: number; // frequency cap (Req 10.3)
}

/**
 * Pure helper — exported for property testing (Property 17).
 * Returns true when a claim requires the authenticated voter's attention
 * given the active filters.
 */
export function claimNeedsVote(
  claim: ClaimBoard,
  filters: ClaimFilters,
): boolean {
  if (!filters.needsMyVote) return false;
  // A claim "needs a vote" when it is open for voting (Processing or Pending)
  return claim.status === "Processing" || claim.status === "Pending";
}

/**
 * Emits browser notifications for incoming claims that match the active
 * "Needs my vote" filter.
 *
 * - Does NOT notify for every real-time update by default (Req 10.1)
 * - Only notifies when a new claim matching the filter arrives (Req 10.2)
 * - Respects maxPerMinute frequency cap from notificationPrefs (Req 10.3)
 */
export function useNotifications(
  incomingClaims: ClaimBoard[],
  filters: ClaimFilters,
  notificationPrefs?: NotificationPrefs,
): void {
  // Track which claim IDs we have already notified about to avoid duplicates.
  const notifiedIds = useRef<Set<string>>(new Set());
  // Track timestamps of recent notifications for frequency capping.
  const recentTimestamps = useRef<number[]>([]);

  useEffect(() => {
    // Skip entirely if notifications are disabled or needsMyVote filter is off.
    if (notificationPrefs?.enabled === false) return;
    if (!filters.needsMyVote) return;

    // Skip if browser Notification API is unavailable or permission not granted.
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const maxPerMinute = notificationPrefs?.maxPerMinute ?? Infinity;
    const now = Date.now();

    // Prune timestamps older than 60 seconds for the frequency cap.
    recentTimestamps.current = recentTimestamps.current.filter(
      (t) => now - t < 60_000,
    );

    for (const claim of incomingClaims) {
      // Already notified about this claim — skip.
      if (notifiedIds.current.has(claim.claim_id)) continue;

      // Claim doesn't match the "needs my vote" predicate — skip (Req 10.2).
      if (!claimNeedsVote(claim, filters)) continue;

      // Frequency cap reached — stop for this batch (Req 10.3).
      if (recentTimestamps.current.length >= maxPerMinute) break;

      // Emit notification.
      new Notification("Claim needs your vote", {
        body: `Claim ${claim.claim_id} (Policy ${claim.policy_id}) is open for voting.`,
        tag: `claim-vote-${claim.claim_id}`,
      });

      notifiedIds.current.add(claim.claim_id);
      recentTimestamps.current.push(Date.now());
    }
  }, [incomingClaims, filters, notificationPrefs]);
}
