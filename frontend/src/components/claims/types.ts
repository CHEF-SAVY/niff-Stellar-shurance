import type { ClaimBoard } from "@/lib/schemas/claims-board";

// Re-export for convenience
export type { ClaimBoard };

// Board-level claim status values used in filters (distinct from on-chain ClaimStatus)
export type BoardClaimStatus = "open" | "closed" | "pending";

/** Active filter state for the Claims Board (Req 5.1) */
export interface ClaimFilters {
  status: BoardClaimStatus | "all";
  policyRef: string;
  submittedAfter: string | null; // ISO-8601 date string
  submittedBefore: string | null; // ISO-8601 date string
  needsMyVote: boolean; // only active when JWT present (Req 4.1)
}

/** Paginated API response for claims (Req 1.2) */
export interface ClaimsPage {
  claims: ClaimBoard[];
  page: number;
  totalPages: number;
  totalCount: number;
}

/** SSE / polling tally update event payload (Req 6.1) */
export interface TallyUpdate {
  claimId: string;
  approveVotes: number;
  rejectVotes: number;
  status: BoardClaimStatus;
}

/** URL query parameter mapping for ClaimFilters (Req 5.3, 5.4) */
export const FILTER_QUERY_PARAMS = {
  status: "status",
  policyRef: "policy",
  submittedAfter: "after",
  submittedBefore: "before",
  needsMyVote: "needs_my_vote",
  page: "page",
} as const satisfies Record<keyof ClaimFilters | "page", string>;

/** Default filter state */
export const DEFAULT_FILTERS: ClaimFilters = {
  status: "all",
  policyRef: "",
  submittedAfter: null,
  submittedBefore: null,
  needsMyVote: false,
};
