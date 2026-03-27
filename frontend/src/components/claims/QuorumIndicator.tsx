"use client";

// Feature: claims-board

interface QuorumIndicatorProps {
  approveVotes: number;
  rejectVotes: number;
  quorumThreshold: number;
}

/**
 * Visualizes quorum progress for a single claim.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 9.4
 */
export function QuorumIndicator({
  approveVotes,
  rejectVotes,
  quorumThreshold,
}: QuorumIndicatorProps) {
  const totalCast = approveVotes + rejectVotes;
  const quorumReached = totalCast >= quorumThreshold;

  // Clamp to [0, 100] to avoid overflow when cast > threshold
  const progressPct =
    quorumThreshold > 0
      ? Math.min(Math.round((totalCast / quorumThreshold) * 100), 100)
      : 100;

  return (
    <div aria-live="polite" aria-atomic="true" className="space-y-1">
      {/* Progress bar — role="progressbar" with ARIA value attributes (Req 2.1, 2.2) */}
      <div
        role="progressbar"
        aria-valuenow={totalCast}
        aria-valuemin={0}
        aria-valuemax={quorumThreshold}
        aria-label={`Quorum progress: ${totalCast} of ${quorumThreshold} votes cast`}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            quorumReached ? "bg-green-600" : "bg-blue-500"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Textual summary — must contain both totalCast and quorumThreshold (Req 2.2) */}
      <div className="flex items-center justify-between text-xs text-gray-700">
        <span>
          {totalCast} of {quorumThreshold} votes cast
        </span>

        {/* Non-color-only "Quorum reached" cue with checkmark icon (Req 2.3) */}
        {quorumReached && (
          <span
            className="flex items-center gap-1 font-medium text-green-700"
            aria-label="Quorum reached"
          >
            {/* Checkmark SVG icon — visible non-color cue */}
            <svg
              aria-hidden="true"
              focusable="false"
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="2,8 6,12 14,4" />
            </svg>
            Quorum reached
          </span>
        )}
      </div>
    </div>
  );
}
