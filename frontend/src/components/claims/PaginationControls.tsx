"use client";

/**
 * PaginationControls — Previous/Next navigation with current page indicator.
 *
 * - Native <button> elements for keyboard accessibility (Tab, Enter, Space) (Req 9.1)
 * - Minimum 44×44 CSS px touch targets (Req 8.3)
 * - aria-label on buttons, aria-current="page" on the page indicator (Req 9.1)
 * - "Previous" disabled on page 1; "Next" disabled on last page (Req 1.2)
 */

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst}
        aria-label="Go to previous page"
        className="min-h-[44px] min-w-[44px] rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <span
        aria-current="page"
        aria-live="polite"
        className="text-sm text-gray-700 min-h-[44px] flex items-center px-2"
      >
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={isLast}
        aria-label="Go to next page"
        className="min-h-[44px] min-w-[44px] rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  );
}
