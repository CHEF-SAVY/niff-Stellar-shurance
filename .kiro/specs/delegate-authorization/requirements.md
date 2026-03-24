# Requirements Document

## Introduction

The delegate authorization feature allows a policyholder (cold holder key) to designate a trusted
address (hot wallet or service account) to perform a limited set of actions on their behalf within
the NiffyInsure Soroban smart contract. Delegates may renew coverage and file claims within an
explicit authorization window; they may never vote on claims, redirect payouts, or modify delegate
assignments. The feature is scoped to the on-chain contract, the Node/TypeScript backend, and the
Next.js frontend.

## Glossary

- **Holder**: The Address that owns a Policy; the only party that may set or revoke delegates for
  that policy.
- **Delegate**: An Address authorized by a Holder to perform a restricted set of actions on one or
  more of the Holder's policies.
- **Delegate_Registry**: The on-chain component responsible for storing, validating, and expiring
  delegate authorizations.
- **Delegate_Record**: A single authorization entry mapping a Delegate address to an
  `expiry_ledger` and a `DelegateScope` for a specific (Holder, policy_id) pair.
- **DelegateScope**: A bitmask or enum set that enumerates which actions a Delegate is permitted to
  perform (e.g., `Renew`, `FileClaim`).
- **expiry_ledger**: The Soroban ledger sequence number after which a Delegate_Record is no longer
  valid; the Delegate_Registry treats `current_ledger >= expiry_ledger` as expired.
- **Policy**: An on-chain insurance policy record as defined in `types.rs`.
- **Claim**: An on-chain claim record as defined in `types.rs`.
- **Contract**: The NiffyInsure Soroban smart contract.
- **Frontend**: The Next.js application at `frontend/src/`.
- **Backend**: The Node/TypeScript service at `backend/src/`.
- **require_auth**: The Soroban SDK call that enforces that a given Address has signed the current
  transaction.

---

## Requirements

### Requirement 1: Delegate Storage and Lifecycle

**User Story:** As a Holder, I want to register a Delegate address with an expiry ledger and a
scope, so that a hot wallet can act on my behalf for a bounded time without holding my cold key.

#### Acceptance Criteria

1. THE Delegate_Registry SHALL store Delegate_Records keyed by `(holder, policy_id, delegate)`
   containing `expiry_ledger` and `DelegateScope`.
2. WHEN a Holder calls `set_delegate(policy_id, delegate, expiry_ledger, scope)`, THE
   Delegate_Registry SHALL require `require_auth` on the Holder's address before writing the
   Delegate_Record.
3. WHEN a Holder calls `set_delegate` with an `expiry_ledger` less than or equal to the current
   ledger sequence, THE Delegate_Registry SHALL reject the call with `Error::DelegateExpiredWindow`.
4. WHEN a Holder calls `revoke_delegate(policy_id, delegate)`, THE Delegate_Registry SHALL require
   `require_auth` on the Holder's address and remove the Delegate_Record.
5. IF a Delegate_Record does not exist for a given `(holder, policy_id, delegate)` triple, THEN
   THE Delegate_Registry SHALL treat the Delegate as unauthorized for all actions on that policy.
6. THE Delegate_Registry SHALL emit a `DelegateUpdated` event on every successful `set_delegate`
   and `revoke_delegate` call containing fields: `holder`, `policy_id`, `delegate`,
   `expiry_ledger`, `scope`, and `action` (`Set` or `Revoked`).

---

### Requirement 2: Delegate Authentication in Renew and File Paths

**User Story:** As a Delegate, I want to renew a policy or file a claim on behalf of a Holder, so
that the Holder's cold key does not need to be online for routine operations.

#### Acceptance Criteria

1. WHEN `renew_policy` is called with a `caller` address that is not the Holder, THE Contract SHALL
   verify that a valid, non-expired Delegate_Record exists for `(holder, policy_id, caller)` with
   `DelegateScope::Renew` before proceeding.
2. WHEN `file_claim` is called with a `caller` address that is not the Holder, THE Contract SHALL
   verify that a valid, non-expired Delegate_Record exists for `(holder, policy_id, caller)` with
   `DelegateScope::FileClaim` before proceeding.
3. THE Contract SHALL call `require_auth` on the `caller` address in both `renew_policy` and
   `file_claim` regardless of whether the caller is the Holder or a Delegate.
4. IF a Delegate_Record for the caller exists but `current_ledger >= expiry_ledger`, THEN THE
   Contract SHALL reject the call with `Error::DelegateExpired` without modifying any state.
5. IF no valid Delegate_Record exists for the caller on the target policy, THEN THE Contract SHALL
   reject the call with `Error::UnauthorizedDelegate` without modifying any state.
6. WHILE a Delegate is performing `renew_policy`, THE Contract SHALL use the Holder's address as
   the premium payer and policy owner; the Delegate address SHALL NOT become the policy owner.
7. WHILE a Delegate is performing `file_claim`, THE Contract SHALL set `claimant` to the Holder's
   address; the Delegate address SHALL NOT appear as the claimant.

---

### Requirement 3: Payout Integrity Under Delegate-Filed Claims

**User Story:** As a Holder, I want to ensure that a Delegate filing a claim on my behalf cannot
redirect the payout to themselves or any address other than the Holder, so that my funds remain
secure.

#### Acceptance Criteria

1. THE Contract SHALL derive the payout recipient for every approved claim exclusively from
   `policy.holder`; the payout recipient SHALL NOT be a parameter supplied by the caller.
2. IF a `file_claim` call includes a payout address field that differs from `policy.holder`, THEN
   THE Contract SHALL reject the call with `Error::InvalidPayoutAddress`.
3. THE Contract SHALL NOT expose any entrypoint that allows a Delegate to modify the `claimant`
   field of an existing Claim after it has been filed.

---

### Requirement 4: Delegate Voting Prohibition

**User Story:** As a product owner, I want delegates to be prohibited from voting on claims by
default, so that governance integrity is preserved and legal risk is minimized.

#### Acceptance Criteria

1. THE Contract SHALL restrict `vote_on_claim` to addresses that are the direct Holder of an active
   policy; Delegate addresses SHALL NOT cast votes.
2. WHEN `vote_on_claim` is called by an address that holds no active policy as a direct Holder, THE
   Contract SHALL reject the call with `Error::NotAVoter`.
3. THE Contract SHALL NOT grant voting rights to a Delegate even when the Delegate holds a
   `DelegateScope` that includes `Renew` or `FileClaim`.
4. WHERE a future product requirement explicitly enables delegate voting, THE Contract SHALL require
   a separate `DelegateScope::Vote` flag that is absent from all default scope values.

---

### Requirement 5: Adversarial and Edge-Case Rejection

**User Story:** As a security engineer, I want the contract to reject all unauthorized or
out-of-window delegate actions at the earliest possible point, so that no partial state changes
occur.

#### Acceptance Criteria

1. IF a Delegate_Record exists but `current_ledger >= expiry_ledger`, THEN THE Contract SHALL
   revert the entire transaction with `Error::DelegateExpired` before any storage write.
2. IF the caller address does not match the Holder and no Delegate_Record exists for the caller,
   THEN THE Contract SHALL revert with `Error::UnauthorizedDelegate` before any storage write.
3. IF the caller is a valid Delegate but the requested action is not in the Delegate_Record's
   `DelegateScope`, THEN THE Contract SHALL revert with `Error::DelegateScopeViolation` before any
   storage write.
4. WHEN the Holder calls any entrypoint directly, THE Contract SHALL bypass delegate lookup and
   apply only Holder-level authorization checks.
5. THE Contract SHALL NOT allow a Delegate to call `set_delegate` or `revoke_delegate` on any
   policy; only the Holder may modify delegate assignments.

---

### Requirement 6: Multisig Holder Compatibility

**User Story:** As a Holder using a multisig or composite signer, I want delegate operations to
remain compatible with my signing setup, so that I can manage delegates without breaking my
existing security model.

#### Acceptance Criteria

1. THE Contract SHALL treat a multisig Address as a standard Holder Address; `require_auth` on a
   multisig Address SHALL follow Soroban's native multisig resolution rules without special-casing
   in the Contract.
2. THE Contract SHALL NOT impose a single-key assumption on the Holder address in any delegate
   management entrypoint.
3. THE Backend SHALL document in its API response for `get_delegate_info` that callers using
   composite signers must collect all required signatures before submitting `set_delegate` or
   `revoke_delegate` transactions.

---

### Requirement 7: Frontend Risk Disclosure and Revocation UI

**User Story:** As a Holder interacting with the Frontend, I want clear warnings about delegate
risks and an accessible revocation flow, so that I can make informed decisions and quickly remove
compromised delegates.

#### Acceptance Criteria

1. THE Frontend SHALL display a risk-disclosure notice before a Holder submits a `set_delegate`
   transaction, stating that delegates can act on the Holder's behalf and that phishing attacks may
   target delegate credentials.
2. THE Frontend SHALL present a delegate management panel listing all active Delegate_Records for
   the connected Holder, including `delegate` address, `expiry_ledger`, and `scope`.
3. WHEN a Holder initiates revocation from the delegate management panel, THE Frontend SHALL
   require explicit confirmation before submitting the `revoke_delegate` transaction.
4. THE Frontend SHALL display the current ledger sequence alongside each `expiry_ledger` value so
   the Holder can assess remaining authorization time.
5. IF a Delegate_Record's `expiry_ledger` is within 1000 ledgers of the current ledger sequence,
   THEN THE Frontend SHALL display a visual expiry warning on that record.

---

### Requirement 8: Event Schema and Observability

**User Story:** As a backend operator, I want structured `DelegateUpdated` events emitted on every
delegate change, so that off-chain systems can maintain an accurate delegate index without polling
storage.

#### Acceptance Criteria

1. THE Contract SHALL emit a `DelegateUpdated` event for every `set_delegate` call with the
   following fields: `holder: Address`, `policy_id: u32`, `delegate: Address`,
   `expiry_ledger: u32`, `scope: DelegateScope`, `action: DelegateAction::Set`.
2. THE Contract SHALL emit a `DelegateUpdated` event for every `revoke_delegate` call with the
   following fields: `holder: Address`, `policy_id: u32`, `delegate: Address`,
   `expiry_ledger: 0`, `scope: DelegateScope::None`, `action: DelegateAction::Revoked`.
3. THE Backend SHALL index `DelegateUpdated` events and expose a `GET /delegates/:holder` endpoint
   returning the current active delegate set for a Holder.
4. WHEN a `DelegateUpdated` event with `action: Revoked` is received, THE Backend SHALL remove the
   corresponding entry from its delegate index.
