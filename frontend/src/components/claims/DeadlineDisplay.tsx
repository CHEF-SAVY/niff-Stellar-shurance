"use client";

// Feature: claims-board

import { useEffect, useState } from "react";
import { SECS_PER_LEDGER, deadlineMs } from "@/lib/schemas/vote";

// Requirements: 3.1, 3.2, 3.3, 3.4

interface DeadlineDisplayProps {
  /** ISO-8601 timestamp from server (legacy indexer field). */
  deadlineTimestamp?: string;
  /** On-chain last voting ledger (inclusive); preferred when available. */
  votingDeadlineLedger?: number;
  /** Latest closed ledger from Horizon — required with `votingDeadlineLedger` for countdown. */
  currentLedger?: number | null;
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

function hasLedgerInputs(
  votingDeadlineLedger: number | undefined,
  currentLedger: number | null | undefined,
): currentLedger is number {
  return (
    votingDeadlineLedger !== undefined &&
    currentLedger !== null &&
    currentLedger !== undefined
  );
}

/**
 * Displays the deadline for a claim.
 *
 * When `votingDeadlineLedger` and `currentLedger` are set, the countdown uses the same
 * inclusive-deadline semantics as the contract. Otherwise falls back to ISO `deadlineTimestamp`.
 */
export function DeadlineDisplay({
  deadlineTimestamp,
  votingDeadlineLedger,
  currentLedger,
  indexerLagSeconds,
}: DeadlineDisplayProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  const useLedger = hasLedgerInputs(votingDeadlineLedger, currentLedger);
  const cur = useLedger ? currentLedger : 0;
  const vdl = votingDeadlineLedger ?? 0;

  const [endAtMs, setEndAtMs] = useState(() =>
    useLedger ? Date.now() + deadlineMs(vdl, cur) : 0,
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (useLedger) {
      setEndAtMs(Date.now() + deadlineMs(vdl, cur));
    }
  }, [useLedger, vdl, cur]);

  if (useLedger) {
    const countdown = computeCountdown(endAtMs, now);
    const votingOpen = cur <= vdl;
    const isFuture = votingOpen && countdown !== null;

    return (
      <div className="space-y-1 text-sm">
        {isFuture ? (
          <>
            <div className="font-mono text-base font-semibold tabular-nums text-gray-900">
              {countdown.days > 0 && <span>{countdown.days}d </span>}
              <span>{pad(countdown.hours)}h </span>
              <span>{pad(countdown.minutes)}m </span>
              <span>{pad(countdown.seconds)}s</span>
            </div>
            <div className="text-xs text-gray-500">
              Deadline ledger {vdl} (~{SECS_PER_LEDGER}s / ledger)
            </div>
          </>
        ) : (
          <div className="font-medium text-gray-500">Voting closed</div>
        )}
        <div className="text-xs text-gray-400">
          Ledger {cur} · Horizon poll may lag ~{indexerLagSeconds}s
        </div>
      </div>
    );
  }

  if (!deadlineTimestamp) {
    return (
      <div className="text-xs text-gray-400">
        Waiting for network ledger or indexer deadline…
      </div>
    );
  }

  const absoluteDeadlineMs = new Date(deadlineTimestamp).getTime();
  const countdown = computeCountdown(absoluteDeadlineMs, now);
  const isFuture = countdown !== null;

  return (
    <div className="space-y-1 text-sm">
      {isFuture ? (
        <>
          <div className="font-mono text-base font-semibold tabular-nums text-gray-900">
            {countdown.days > 0 && <span>{countdown.days}d </span>}
            <span>{pad(countdown.hours)}h </span>
            <span>{pad(countdown.minutes)}m </span>
            <span>{pad(countdown.seconds)}s</span>
          </div>
          <div className="text-xs text-gray-500">
            Closes {formatAbsoluteDate(deadlineTimestamp)}
          </div>
        </>
      ) : (
        <div className="font-medium text-gray-500">Voting closed</div>
      )}
      <div className="text-xs text-gray-400">
        Data may be delayed by up to {indexerLagSeconds}s due to indexer lag
      </div>
    </div>
  );
}
