# Implementation Plan: Claims Board

## Overview

Implement the Claims Board as a Next.js 15 App Router page with React 19 client components, using the existing Radix UI / Tailwind / Zod stack. Tasks are ordered to build incrementally: data models and schemas first, then hooks, then UI components, then wiring and real-time updates.

## Tasks

- [x] 1. Extend data schemas and define shared types
  - Add `deadline_timestamp` and `quorum_threshold` optional fields to `ClaimSchema` via `.extend()` in a new `frontend/src/lib/schemas/claims-board.ts` file
  - Define `ClaimFilters`, `ClaimsPage`, and `TallyUpdate` TypeScript interfaces in `frontend/src/components/claims/types.ts`
  - Define the URL query param mapping constants
  - _Requirements: 1.5, 3.1, 5.1_

- [x] 2. Implement `useQueryParamFilters` hook
  - [x] 2.1 Create `frontend/src/lib/hooks/useQueryParamFilters.ts`
    - Read initial `ClaimFilters` from URL search params on mount; write changes back via `router.replace`
    - _Requirements: 5.3, 5.4_
  - [ ]\* 2.2 Write property test for URL round-trip (Property 3)
    - **Property 3: URL query params round-trip through filter state**
    - **Validates: Requirements 5.3, 5.4**
    - File: `frontend/src/lib/hooks/__tests__/useQueryParamFilters.property.test.ts`

- [x] 3. Implement `useAuth` hook
  - [x] 3.1 Create `frontend/src/lib/hooks/useAuth.ts`
    - Read JWT from in-memory store only (never `localStorage` or DOM attributes)
    - Expose `isAuthenticated`, `jwt`, and `onExpiry` callback
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 4. Implement `useClaimsData` hook
  - [x] 4.1 Create `frontend/src/lib/hooks/useClaimsData.ts`
    - Fetch `GET /api/claims` with filter and pagination query params
    - Validate response with Zod `ClaimsPage` schema
    - Expose `claims`, `totalPages`, `loading`, `error`, and `retry`
    - Use `AbortController` to cancel in-flight requests on unmount or filter change
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.4_
  - [ ]\* 4.2 Write unit tests for `useClaimsData`
    - Test retry on failure, empty result, and abort on unmount
    - _Requirements: 1.3, 1.4, 6.4_

- [x] 5. Implement `useRealtimeTallies` hook
  - [x] 5.1 Create `frontend/src/lib/hooks/useRealtimeTallies.ts`
    - Attempt SSE connection to `/api/claims/events`; fall back to polling with exponential backoff (`min(base * 2^n, max)`)
    - Pause polling when `document.visibilityState === 'hidden'`; resume on visibility change
    - Cancel all pending requests and clear timers on unmount
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]\* 5.2 Write property test for exponential backoff formula (Property 13)
    - **Property 13: Exponential backoff formula is correct**
    - **Validates: Requirements 6.2**
    - File: `frontend/src/lib/hooks/__tests__/useRealtimeTallies.property.test.ts`
  - [ ]\* 5.3 Write property test for polling pause on hidden tab (Property 11)
    - **Property 11: Polling pauses when tab is hidden**
    - **Validates: Requirements 6.3**
  - [ ]\* 5.4 Write property test for tally update applied to correct claim only (Property 12)
    - **Property 12: Tally update is applied to the correct claim only**
    - **Validates: Requirements 6.1, 6.5**

- [x] 6. Checkpoint — Ensure all hook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `QuorumIndicator` component
  - [x] 7.1 Create `frontend/src/components/claims/QuorumIndicator.tsx`
    - Render progress bar and textual summary (e.g. "12 of 20 votes cast")
    - Show "Quorum reached" label with checkmark icon when `approveVotes + rejectVotes >= quorumThreshold`
    - Add `aria-live="polite"` on the tally-bearing element
    - Meet WCAG 2.1 AA contrast for all text and graphical elements
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.4_
  - [x]\* 7.2 Write property test for quorum indicator text (Property 4)
    - **Property 4: Quorum indicator text matches numeric values**
    - **Validates: Requirements 2.1, 2.2**
    - File: `frontend/src/components/claims/__tests__/claims-board.property.test.ts`
  - [x]\* 7.3 Write property test for quorum-reached state consistency (Property 5)
    - **Property 5: Quorum-reached state is consistent with threshold**
    - **Validates: Requirements 2.3**
  - [x]\* 7.4 Write property test for ARIA live region presence (Property 16)
    - **Property 16: ARIA live region is present on tally-bearing elements**
    - **Validates: Requirements 9.4**

- [x] 8. Implement `DeadlineDisplay` component
  - [x] 8.1 Create `frontend/src/components/claims/DeadlineDisplay.tsx`
    - Accept only `deadlineTimestamp` (ISO-8601) and `indexerLagSeconds` props — no ledger numbers
    - Show human-readable countdown + absolute date when deadline is future
    - Show "Voting closed" label when deadline is past
    - Always render indexer-lag disclaimer in proximity to the countdown
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]\* 8.2 Write property test for future deadline display (Property 6)
    - **Property 6: Deadline display derives from server timestamp and shows countdown for future deadlines**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]\* 8.3 Write property test for past deadline "Voting closed" (Property 7)
    - **Property 7: Past deadline shows "Voting closed"**
    - **Validates: Requirements 3.3**
  - [ ]\* 8.4 Write property test for indexer lag disclaimer always present (Property 8)
    - **Property 8: Indexer lag disclaimer is always present**
    - **Validates: Requirements 3.4**

- [x] 9. Implement `FilterBar` component
  - [x] 9.1 Create `frontend/src/components/claims/FilterBar.tsx`
    - Render status select, policy text input, date-range inputs, and conditional "Needs my vote" toggle
    - Hide all auth-dependent UI when `showNeedsMyVote` is false
    - All controls keyboard-operable (Tab, Enter, Space)
    - Debounce filter changes by 200 ms before calling `onChange`
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.5, 7.3_
  - [x]\* 9.2 Write property test for no auth UI without JWT (Property 9)
    - **Property 9: No authentication-dependent UI rendered without JWT**
    - **Validates: Requirements 4.2**
  - [x]\* 9.3 Write property test for debounce suppresses intermediate requests (Property 14)
    - **Property 14: Debounce suppresses intermediate requests**
    - **Validates: Requirements 7.3**

- [x] 10. Implement `PaginationControls` component
  - Create `frontend/src/components/claims/PaginationControls.tsx`
  - All controls reachable via Tab and activatable by Enter/Space
  - Minimum 44×44 CSS px touch targets
  - _Requirements: 1.2, 8.3, 9.1_

- [x] 11. Implement `ClaimRow` component
  - [x] 11.1 Create `frontend/src/components/claims/ClaimRow.tsx`
    - Render claim identifier, policy reference, status badge, tally summary, `QuorumIndicator`, `DeadlineDisplay`, and `VoteActionButton`
    - Card layout on mobile viewports (≤320px), table row on desktop
    - Minimum 44×44 CSS px touch targets for interactive controls
    - ARIA labels for all icon-only controls
    - _Requirements: 1.5, 8.1, 8.2, 8.3, 9.1, 9.3_
  - [ ]\* 11.2 Write property test for filter results satisfy filter predicate (Property 2)
    - **Property 2: Filter results satisfy filter predicate**
    - **Validates: Requirements 1.5, 5.2**

- [x] 12. Implement `ClaimsBoard` client component
  - [x] 12.1 Create `frontend/src/components/claims/ClaimsBoard.tsx`
    - Wire together `FilterBar`, `ClaimList`, `PaginationControls`, `useClaimsData`, `useRealtimeTallies`, `useAuth`, and `useQueryParamFilters`
    - Apply tally updates from `useRealtimeTallies` only to the matching `claimId`
    - On JWT expiry: deactivate "Needs my vote" filter, clear auth UI, prompt re-authentication
    - Manage focus correctly when detail panels open/close (return focus to trigger on close)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.3, 6.1, 6.5, 9.2_
  - [x]\* 12.2 Write property test for JWT not exposed in DOM (Property 10)
    - **Property 10: JWT contents are not exposed in the rendered DOM**
    - **Validates: Requirements 4.4**
  - [ ]\* 12.3 Write property test for paginated claims are a subset of all claims (Property 1)
    - **Property 1: Paginated claims are a subset of all claims**
    - **Validates: Requirements 1.2**

- [x] 13. Implement notification logic
  - [x] 13.1 Add notification emission to `ClaimsBoard` or a dedicated `useNotifications` hook
    - Do not emit a notification for every real-time update by default
    - Emit a notification only when a new claim matching the active "Needs my vote" filter arrives
    - Respect user notification preference config (scope and frequency limits) when available
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ]\* 13.2 Write property test for notifications only fire for matching claims (Property 17)
    - **Property 17: Notifications only fire for claims matching the active filter**
    - **Validates: Requirements 10.2**
  - [ ]\* 13.3 Write property test for notification preferences respected (Property 18)
    - **Property 18: Notification preferences are respected**
    - **Validates: Requirements 10.3**

- [x] 14. Add list virtualization support
  - [x] 14.1 Implement virtualized rendering in `ClaimList` behind a feature flag
    - Render only visible rows plus configurable overscan buffer when flag is enabled
    - Keep DOM node count below configured threshold regardless of total claim count
    - _Requirements: 7.1, 7.2_
  - [ ]\* 14.2 Write property test for virtualization keeps DOM node count bounded (Property 15)
    - **Property 15: Virtualization keeps DOM node count bounded**
    - **Validates: Requirements 7.2**

- [x] 15. Create the `/claims` Next.js page
  - Create `frontend/src/app/claims/page.tsx` as a lightweight server component
  - Render `ClaimsBoard` client component; pass no sensitive data from server to client
  - _Requirements: 1.1, 4.4_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (add as dev dependency); tag each test with `// Feature: claims-board, Property N: <text>`
- Unit tests use Jest with React Testing Library
- Property test files: `frontend/src/components/claims/__tests__/claims-board.property.test.ts` and `frontend/src/lib/hooks/__tests__/`
