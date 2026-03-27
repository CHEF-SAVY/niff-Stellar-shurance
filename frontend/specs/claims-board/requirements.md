# Requirements Document

## Introduction

The Claims Board is a frontend feature that aggregates insurance claims from backend APIs, enabling exploratory browsing and voter action. It visualizes quorum progress, surfaces deadlines from server-provided data, highlights claims requiring the authenticated user's vote, and keeps tallies fresh via real-time updates or resilient polling. The board must remain accessible, keyboard-navigable, and performant on large datasets.

## Glossary

- **Claims_Board**: The paginated, filterable list view of all claims.
- **Claim**: A single insurance claim record returned by the API, containing status, policy reference, deadline, tally data, and quorum threshold.
- **Quorum**: The minimum number of votes required for a claim decision to be considered valid.
- **Tally**: The current vote counts (approve/reject/abstain) for a given Claim.
- **Deadline**: The server-provided timestamp after which a Claim is no longer open for voting.
- **JWT**: A JSON Web Token issued after wallet authentication, used to identify the current voter.
- **Voter**: An authenticated user who holds a JWT and may cast votes on Claims.
- **SSE**: Server-Sent Events, a unidirectional server-push protocol for real-time updates.
- **Polling_Hook**: A client-side hook that periodically fetches fresh data when SSE/websocket is unavailable.
- **Indexer_Lag**: The delay between an on-chain event being finalized and the indexer reflecting it in the API response.
- **Filter_Bar**: The UI component containing status, policy, and date range filter controls.
- **Quorum_Indicator**: The UI component that visualizes quorum progress for a single Claim.
- **Deadline_Display**: The UI component that shows the remaining time or absolute date for a Claim's deadline.
- **Vote_Action**: The user interaction of casting a vote (approve/reject/abstain) on a Claim.

---

## Requirements

### Requirement 1: Claim Aggregation and Display

**User Story:** As a visitor, I want to browse all claims in a paginated board, so that I can explore the current state of the insurance pool.

#### Acceptance Criteria

1. THE Claims_Board SHALL fetch claims from the backend API on initial load.
2. WHEN the API returns a paginated response, THE Claims_Board SHALL display claims in pages and provide navigation controls to move between pages.
3. WHEN the API request fails, THE Claims_Board SHALL display a descriptive error message and a retry control.
4. WHEN the API returns an empty result set, THE Claims_Board SHALL display an empty-state message indicating no claims match the current filters.
5. THE Claims_Board SHALL display for each Claim: its identifier, policy reference, current status, Tally summary, quorum threshold, and Deadline.

---

### Requirement 2: Quorum Visualization

**User Story:** As a voter, I want to see quorum progress for each claim, so that I can understand how close a decision is to being finalized.

#### Acceptance Criteria

1. THE Quorum_Indicator SHALL render the current vote count relative to the quorum threshold for each Claim.
2. THE Quorum_Indicator SHALL convey quorum progress using both a visual indicator and a textual summary (e.g., "12 of 20 votes cast") so that status is not communicated by color alone.
3. WHEN a Claim has reached its quorum threshold, THE Quorum_Indicator SHALL display a distinct reached-quorum state using a non-color-only cue (e.g., icon or label).
4. THE Quorum_Indicator SHALL meet WCAG 2.1 AA contrast requirements for all text and meaningful graphical elements.

---

### Requirement 3: Deadline Display

**User Story:** As a voter, I want to see accurate deadlines for each claim, so that I know how much time I have to cast my vote.

#### Acceptance Criteria

1. THE Deadline_Display SHALL derive all deadline values exclusively from server-provided timestamp fields; THE Deadline_Display SHALL NOT compute deadlines client-side from block numbers or other heuristics.
2. WHEN a Claim's deadline is in the future, THE Deadline_Display SHALL show the remaining time as a human-readable countdown alongside the absolute deadline date and time.
3. WHEN a Claim's deadline has passed, THE Deadline_Display SHALL display a clear "Voting closed" label.
4. THE Deadline_Display SHALL render an Indexer_Lag disclaimer in proximity to the countdown, informing the user that finality and indexer lag may cause a delay of up to a configured number of seconds between on-chain events and displayed data.

---

### Requirement 4: Personalized Vote Filters for Authenticated Users

**User Story:** As a voter, I want to see which claims still need my vote, so that I can act on the most relevant items without scanning the entire board.

#### Acceptance Criteria

1. WHEN a valid JWT is present in the session, THE Claims_Board SHALL offer a "Needs my vote" filter that restricts the displayed claims to those where the authenticated Voter has not yet cast a Vote_Action.
2. WHEN no JWT is present, THE Claims_Board SHALL hide the "Needs my vote" filter and display no authentication-dependent UI elements.
3. WHEN the "Needs my vote" filter is active and the JWT expires, THE Claims_Board SHALL deactivate the filter, clear authentication-dependent UI, and prompt the user to re-authenticate.
4. THE Claims_Board SHALL NOT expose JWT contents or voter identity information in rendered HTML attributes or client-accessible storage beyond what is required for API authorization headers.

---

### Requirement 5: Claim Filters with Query-Parameter Sync

**User Story:** As a user, I want to filter claims by status, policy, and date range, so that I can narrow the board to claims relevant to my interests.

#### Acceptance Criteria

1. THE Filter_Bar SHALL provide controls for filtering claims by: status (open, closed, pending), policy reference, and date range (submitted after / submitted before).
2. WHEN a filter value changes, THE Claims_Board SHALL update the displayed claims to reflect the new filter state without requiring a full page reload.
3. WHEN filter state changes, THE Claims_Board SHALL synchronize the active filter values to URL query parameters so that the filtered view is bookmarkable and shareable.
4. WHEN the page loads with query parameters present, THE Filter_Bar SHALL initialize its controls to reflect those parameter values and apply the corresponding filters immediately.
5. THE Filter_Bar SHALL be fully operable via keyboard, with all controls reachable by Tab and activatable by Enter or Space.

---

### Requirement 6: Real-Time Tally Updates

**User Story:** As a voter, I want to see updated vote tallies shortly after casting my vote, so that I can confirm my action was recorded.

#### Acceptance Criteria

1. WHEN the backend provides an SSE or websocket endpoint, THE Claims_Board SHALL subscribe to it on mount and update Tally and Quorum_Indicator values upon receiving a relevant event.
2. WHEN SSE/websocket is unavailable, THE Polling_Hook SHALL fetch updated claim data at a configured base interval using exponential backoff on consecutive failures.
3. WHILE the browser tab is hidden (document visibility state is "hidden"), THE Polling_Hook SHALL pause all polling requests and resume polling when the tab becomes visible again.
4. WHEN the Claims_Board component unmounts, THE Polling_Hook SHALL cancel all pending requests and clear all timers.
5. WHEN a Voter casts a Vote_Action, THE Claims_Board SHALL reflect the updated Tally within the configured maximum latency (default: 5 seconds).

---

### Requirement 7: Performance on Large Datasets

**User Story:** As a user, I want the board to remain responsive when many claims are loaded, so that I can browse without lag.

#### Acceptance Criteria

1. THE Claims_Board SHALL render without frame drops on datasets of at least 500 claims in staging performance tests.
2. WHERE list virtualization is enabled (configurable feature flag), THE Claims_Board SHALL render only the visible rows plus a configurable overscan buffer, keeping DOM node count below a configured threshold regardless of total claim count.
3. THE Claims_Board SHALL debounce filter input changes by at least 200ms before triggering a new API request.

---

### Requirement 8: Mobile-Friendly Layout

**User Story:** As a mobile user, I want to navigate the claims board and claim detail views on a small screen, so that I can participate in voting from any device.

#### Acceptance Criteria

1. THE Claims_Board SHALL adapt its layout to viewports as narrow as 320px without horizontal scrolling or content overflow.
2. WHEN a user selects a Claim on a mobile viewport, THE Claims_Board SHALL navigate to or reveal a detail view that displays full Tally, Quorum_Indicator, Deadline_Display, and Vote_Action controls.
3. THE Claims_Board SHALL render all interactive controls with a minimum touch target size of 44×44 CSS pixels on mobile viewports.

---

### Requirement 9: Keyboard Navigation and Accessibility

**User Story:** As a keyboard user, I want to navigate all board controls without a mouse, so that the feature is usable with assistive technologies.

#### Acceptance Criteria

1. THE Claims_Board SHALL ensure all interactive elements (filters, pagination, claim rows, vote actions) are reachable via sequential Tab navigation.
2. THE Claims_Board SHALL manage focus correctly when dialogs or detail panels open and close, returning focus to the triggering element on close.
3. THE Claims_Board SHALL provide ARIA labels or visible text labels for all icon-only controls.
4. WHEN a Tally or Quorum_Indicator updates in real time, THE Claims_Board SHALL announce the change to screen readers using an ARIA live region with an appropriate politeness level.

---

### Requirement 10: Notification Restraint

**User Story:** As a user, I want to receive notifications only for claims relevant to me, so that I am not overwhelmed by activity on the board.

#### Acceptance Criteria

1. THE Claims_Board SHALL NOT emit a notification for every incoming real-time claim update by default.
2. WHEN a Voter has an active "Needs my vote" filter, THE Claims_Board SHALL notify the Voter only when a new Claim matching that filter becomes available.
3. WHERE a notification preference setting is available, THE Claims_Board SHALL respect the user's configured notification scope and frequency limits.
