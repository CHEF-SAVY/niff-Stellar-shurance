"use client";

// Feature: claims-board

import { useEffect, useState } from "react";

// Requirements: 3.1, 3.2, 3.3, 3.4

interface DeadlineDisplayProps {
  /** ISO-8601 timestamp from server — the ONLY accepted deadline input (Req 3.1) */
  deadlineTimestamp: string;
  /** Configured indexer lag in seconds (default 30) */
  indexerLagSeconds: number;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(deadlineMs: number, nowMs: number): Countdown | null {
  const diffMs = deadlineMs - nowMs;
  if (diffMs <= 0) return null;

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function formatAbsoluteDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Displays the deadline for a claim.
 *
 * - Future deadline: live countdown (days/hours/minutes/seconds) + absolute date (Req 3.2)
 * - Past deadline: "Voting closed" label (Req 3.3)
 * - Always: indexer-lag disclaimer (Req 3.4)
 * - Props accept only ISO-8601 timestamp — no block numbers (Req 3.1)
 */
export function DeadlineDisplay({
  deadlineTimestamp,
  indexerLagSeconds,
}: DeadlineDisplayProps) {
  const deadlineMs = new Date(deadlineTimestamp).getTime();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const countdown = computeCountdown(deadlineMs, now);
  const isFuture = countdown !== null;

  return (
    <div className="space-y-1 text-sm">
      {isFuture ? (
        <>
          {/* Countdown (Req 3.2) */}
          <div className="font-mono text-base font-semibold tabular-nums text-gray-900">
            {countdown.days > 0 && <span>{countdown.days}d </span>}
            <span>{pad(countdown.hours)}h </span>
            <span>{pad(countdown.minutes)}m </span>
            <span>{pad(countdown.seconds)}s</span>
          </div>
          {/* Absolute date (Req 3.2) */}
          <div className="text-xs text-gray-500">
            Closes {formatAbsoluteDate(deadlineTimestamp)}
          </div>
        </>
      ) : (
        /* Past deadline (Req 3.3) */
        <div className="font-medium text-gray-500">Voting closed</div>
      )}

      {/* Indexer-lag disclaimer — always rendered (Req 3.4) */}
      <div className="text-xs text-gray-400">
        Data may be delayed by up to {indexerLagSeconds}s due to indexer lag
      </div>
    </div>
  );
}
