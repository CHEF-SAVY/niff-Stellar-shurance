# Implementation Plan: Delegate Authorization

## Overview

Implement scoped, time-bounded delegate authorization across the Soroban contract, Node/TypeScript
backend, and Next.js frontend. Tasks build incrementally: types → storage → core delegate logic →
contract entrypoints → adversarial tests → backend indexer/API → frontend UI.

## Tasks

- [ ] 1. Add delegate types to `types.rs`
  - Add `DelegateScope` enum (`None`, `Renew`, `FileClaim`, `RenewAndFileClaim`) with `#[contracttype]`
  - Add `DelegateAction` enum (`Set`, `Revoked`) with `#[contracttype]`
  - Add `DelegateRecord` struct (`expiry_ledger: u32`, `scope: DelegateScope`) with `#[contracttype]`
  - _Requirements: 1.1_

- [ ] 2. Extend `storage.rs` with delegate persistence
  - Add `Delegate(Address, u32, Address)` variant to `DataKey` enum
  - Implement `set_delegate`, `get_delegate`, `remove_delegate` helpers using `env.storage().persistent()`
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 3. Add new error variants to `validate.rs`
  - Add `DelegateExpiredWindow`, `DelegateExpired`, `UnauthorizedDelegate`, `DelegateScopeViolation`, `NotAVoter`, `InvalidPayoutAddress` to the `Error` enum
  - _Requirements: 1.3, 2.4, 2.5, 3.2, 4.2, 5.1, 5.2, 5.3_

- [ ] 4. Create `delegate.rs` module with auth check and event emission
  - [ ] 4.1 Implement `check_delegate_auth(env, holder, policy_id, caller, required_scope) -> Result<(), Error>`
    - Short-circuit `Ok(())` when `caller == holder`
    - Load `DelegateRecord`; return `UnauthorizedDelegate` if absent
    - Return `DelegateExpired` if `current_ledger >= record.expiry_ledger`
    - Return `DelegateScopeViolation` if scope does not cover `required_scope`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4_
  - [ ] 4.2 Implement `emit_delegate_updated(env, holder, policy_id, delegate, expiry_ledger, scope, action)`
    - Emit contract event with all six fields per the `DelegateUpdated` schema
    - _Requirements: 1.6, 8.1, 8.2_
  - [ ]* 4.3 Write property test: Property 1 — `set_delegate` round-trip
    - **Property 1: set_delegate round-trip**
    - **Validates: Requirements 1.1**
  - [ ]* 4.4 Write property test: Property 4 — `DelegateUpdated` event fields
    - **Property 4: DelegateUpdated event fields**
    - **Validates: Requirements 1.6, 8.1, 8.2**

- [ ] 5. Implement `set_delegate` and `revoke_delegate` entrypoints in `lib.rs`
  - [ ] 5.1 Add `mod delegate;` to `lib.rs` and expose `set_delegate` and `revoke_delegate` in `#[contractimpl]`
    - `set_delegate(env, holder, policy_id, delegate, expiry_ledger, scope)`: call `require_auth(&holder)`, validate `expiry_ledger > current_ledger`, write record, emit event
    - `revoke_delegate(env, holder, policy_id, delegate)`: call `require_auth(&holder)`, remove record, emit event with `expiry_ledger=0` and `scope=None`
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 5.5_
  - [ ]* 5.2 Write property test: Property 2 — `set_delegate` rejects past expiry
    - **Property 2: set_delegate rejects past or current expiry_ledger**
    - **Validates: Requirements 1.3**
  - [ ]* 5.3 Write property test: Property 3 — `revoke_delegate` removes record
    - **Property 3: revoke_delegate removes the record**
    - **Validates: Requirements 1.4**
  - [ ]* 5.4 Write unit test: `set_delegate_requires_holder_auth`
    - Call `set_delegate` without holder auth; expect panic
    - _Requirements: 1.2_
  - [ ]* 5.5 Write unit test: `revoke_delegate_requires_holder_auth`
    - Call `revoke_delegate` without holder auth; expect panic
    - _Requirements: 1.4_
  - [ ]* 5.6 Write unit test: `multisig_holder_can_set_delegate`
    - Use `mock_all_auths` to simulate multisig holder setting a delegate
    - _Requirements: 6.1, 6.2_

- [ ] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Wire delegate checks into `renew_policy` in `policy.rs` and `lib.rs`
  - Add `caller: Address` parameter to `renew_policy`
  - Call `require_auth(&caller)` then `check_delegate_auth(holder, policy_id, caller, DelegateScope::Renew)`
  - Ensure `policy.holder` remains unchanged after a delegate renew (premium payer = holder)
  - _Requirements: 2.1, 2.3, 2.6_
  - [ ]* 7.1 Write property test: Property 5 — delegate with Renew scope can renew
    - **Property 5: Delegate with Renew scope can renew_policy**
    - **Validates: Requirements 2.1**
  - [ ]* 7.2 Write property test: Property 9 — holder remains owner after delegate renew
    - **Property 9: Holder remains policy owner after delegate renew**
    - **Validates: Requirements 2.6**
  - [ ]* 7.3 Write property test: Property 15 — holder bypasses delegate lookup
    - **Property 15: Holder always bypasses delegate lookup**
    - **Validates: Requirements 5.4**

- [ ] 8. Wire delegate checks into `file_claim` in `claim.rs` and `lib.rs`
  - Add `caller: Address` parameter to `file_claim`
  - Call `require_auth(&caller)` then `check_delegate_auth(holder, policy_id, caller, DelegateScope::FileClaim)`
  - Derive `claimant` and payout recipient exclusively from `policy.holder`; reject any explicit payout address != `policy.holder` with `Error::InvalidPayoutAddress`
  - _Requirements: 2.2, 2.3, 2.7, 3.1, 3.2, 3.3_
  - [ ]* 8.1 Write property test: Property 6 — delegate with FileClaim scope can file_claim
    - **Property 6: Delegate with FileClaim scope can file_claim**
    - **Validates: Requirements 2.2**
  - [ ]* 8.2 Write property test: Property 10 — claimant is holder after delegate file_claim
    - **Property 10: Claimant is always the Holder after delegate file_claim**
    - **Validates: Requirements 2.7**
  - [ ]* 8.3 Write property test: Property 11 — payout recipient is policy.holder
    - **Property 11: Payout recipient is always policy.holder**
    - **Validates: Requirements 3.1**
  - [ ]* 8.4 Write property test: Property 12 — file_claim rejects mismatched payout address
    - **Property 12: file_claim rejects mismatched payout address**
    - **Validates: Requirements 3.2**

- [ ] 9. Add voter restriction to `vote_on_claim` in `claim.rs` and `lib.rs`
  - Add check that `voter` is a direct Holder of at least one active policy; reject with `Error::NotAVoter` otherwise
  - Ensure delegate addresses are rejected even when they hold a valid `DelegateRecord`
  - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 9.1 Write property test: Property 13 — vote restricted to direct holders
    - **Property 13: vote_on_claim is restricted to direct Holders of active policies**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 10. Write adversarial integration tests in `contracts/niffyinsure/tests/delegate.rs`
  - [ ]* 10.1 Write property test: Property 7 — expired delegate rejected before state change
    - **Property 7: Expired delegate is rejected before any state change**
    - **Validates: Requirements 2.4, 5.1**
  - [ ]* 10.2 Write property test: Property 8 — unknown delegate rejected before state change
    - **Property 8: Unknown delegate is rejected before any state change**
    - **Validates: Requirements 2.5, 5.2**
  - [ ]* 10.3 Write property test: Property 14 — scope violation rejected before state change
    - **Property 14: Scope violation is rejected before any state change**
    - **Validates: Requirements 5.3**
  - [ ]* 10.4 Write property test: Property 16 — delegate cannot modify assignments
    - **Property 16: Delegate cannot modify delegate assignments**
    - **Validates: Requirements 5.5**

- [ ] 11. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement backend event indexer and REST endpoint in `backend/src/index.ts`
  - [ ] 12.1 Add in-memory `DelegateIndex` map and `DelegateIndexEntry` interface
    - Implement `handleDelegateUpdated(event)`: upsert on `Set`, remove on `Revoked`
    - _Requirements: 8.3, 8.4_
  - [ ] 12.2 Add `GET /delegates/:holder` route returning the active delegate array for a holder (empty array for unknown holders)
    - _Requirements: 8.3_
  - [ ] 12.3 Add Soroban RPC polling loop that feeds `DelegateUpdated` events into `handleDelegateUpdated`
    - Log and skip malformed events; do not crash the indexer
    - _Requirements: 8.3, 8.4_
  - [ ]* 12.4 Write property test: Property 18 — backend removes revoked delegate from index
    - **Property 18: Backend removes revoked delegate from index**
    - **Validates: Requirements 8.4**
  - [ ]* 12.5 Write unit test: `backend_get_delegates_returns_empty_for_unknown_holder`
    - _Requirements: 8.3_

- [ ] 13. Implement frontend `DelegatePanel` and `RiskDisclosure` components
  - [ ] 13.1 Create `frontend/src/app/components/RiskDisclosure.tsx`
    - Modal component shown before `set_delegate` submission with phishing risk warning text
    - Requires explicit user confirmation before proceeding
    - _Requirements: 7.1, 7.3_
  - [ ] 13.2 Create `frontend/src/app/components/DelegatePanel.tsx`
    - List active delegates for connected holder (fetched from `GET /delegates/:holder`)
    - Display `delegate` address, `expiry_ledger`, `scope`, and current ledger sequence per record
    - Show visual expiry warning when `expiry_ledger - current_ledger < 1000`
    - Revoke button triggers `RiskDisclosure` confirmation then submits `revoke_delegate` transaction
    - Disable panel and prompt wallet connection when wallet is not connected
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  - [ ] 13.3 Export `isNearExpiry(currentLedger: number, expiryLedger: number): boolean` helper from `DelegatePanel.tsx`
    - Returns `true` when `expiryLedger - currentLedger < 1000` and `expiryLedger > currentLedger`
    - _Requirements: 7.5_
  - [ ]* 13.4 Write property test: Property 17 — expiry warning threshold
    - **Property 17: Expiry warning threshold**
    - **Validates: Requirements 7.5**
  - [ ]* 13.5 Write snapshot tests for `DelegatePanel` and `RiskDisclosure` using React Testing Library
    - _Requirements: 7.1, 7.2_

- [ ] 14. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `proptest` (Rust contract) and `fast-check` (TypeScript backend/frontend)
- Add `proptest = "1"` to `contracts/niffyinsure/Cargo.toml` dev-dependencies before running property tests
- All authorization checks must occur before any storage write (fail-fast per Requirements 5.1–5.3)
- `policy.holder` is the single source of truth for payout recipient; never a caller-supplied parameter
