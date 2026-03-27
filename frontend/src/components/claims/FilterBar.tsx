"use client";

import React, { useRef, useCallback } from "react";
import type { ClaimFilters } from "./types";

export interface FilterBarProps {
  filters: ClaimFilters;
  onChange: (filters: ClaimFilters) => void;
  showNeedsMyVote: boolean; // false when no JWT present (Req 4.2)
}

const STATUS_OPTIONS: Array<{ value: ClaimFilters["status"]; label: string }> =
  [
    { value: "all", label: "All statuses" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "pending", label: "Pending" },
  ];

/**
 * FilterBar — renders status select, policy text input, date-range inputs,
 * and (conditionally) the "Needs my vote" toggle.
 *
 * Filter changes are debounced 200 ms before calling onChange (Req 7.3).
 * All controls are keyboard-operable via Tab / Enter / Space (Req 5.5).
 * The "Needs my vote" toggle is completely absent from the DOM when
 * showNeedsMyVote is false (Req 4.2).
 */
export function FilterBar({
  filters,
  onChange,
  showNeedsMyVote,
}: FilterBarProps) {
  // Keep a mutable ref to the latest filters so the debounce closure always
  // reads the most-recent value without needing to be recreated.
  const pendingRef = useRef<ClaimFilters>(filters);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleChange = useCallback(
    (next: ClaimFilters) => {
      pendingRef.current = next;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onChange(pendingRef.current);
      }, 200);
    },
    [onChange],
  );

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    scheduleChange({
      ...pendingRef.current,
      status: e.target.value as ClaimFilters["status"],
    });
  };

  const handlePolicyRef = (e: React.ChangeEvent<HTMLInputElement>) => {
    scheduleChange({ ...pendingRef.current, policyRef: e.target.value });
  };

  const handleSubmittedAfter = (e: React.ChangeEvent<HTMLInputElement>) => {
    scheduleChange({
      ...pendingRef.current,
      submittedAfter: e.target.value || null,
    });
  };

  const handleSubmittedBefore = (e: React.ChangeEvent<HTMLInputElement>) => {
    scheduleChange({
      ...pendingRef.current,
      submittedBefore: e.target.value || null,
    });
  };

  const handleNeedsMyVote = (e: React.ChangeEvent<HTMLInputElement>) => {
    scheduleChange({ ...pendingRef.current, needsMyVote: e.target.checked });
  };

  return (
    <div
      role="search"
      aria-label="Filter claims"
      className="flex flex-wrap gap-3 items-end p-3 bg-white border rounded-md"
    >
      {/* Status filter */}
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Status
        <select
          defaultValue={filters.status}
          onChange={handleStatus}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Policy reference filter */}
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Policy reference
        <input
          type="text"
          defaultValue={filters.policyRef}
          onChange={handlePolicyRef}
          placeholder="e.g. POL-123"
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Filter by policy reference"
        />
      </label>

      {/* Date range — submitted after */}
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Submitted after
        <input
          type="date"
          defaultValue={filters.submittedAfter ?? ""}
          onChange={handleSubmittedAfter}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Filter by submitted after date"
        />
      </label>

      {/* Date range — submitted before */}
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Submitted before
        <input
          type="date"
          defaultValue={filters.submittedBefore ?? ""}
          onChange={handleSubmittedBefore}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label="Filter by submitted before date"
        />
      </label>

      {/* "Needs my vote" toggle — only rendered when showNeedsMyVote is true (Req 4.2) */}
      {showNeedsMyVote && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={filters.needsMyVote}
            onChange={handleNeedsMyVote}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            aria-label="Needs my vote"
          />
          Needs my vote
        </label>
      )}
    </div>
  );
}
