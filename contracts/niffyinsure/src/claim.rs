// Claim lifecycle and DAO voting will be implemented here.
//
// Planned public functions:
//   file_claim(env, policy_id, amount, details, image_urls)
//   vote_on_claim(env, voter, claim_id, vote)
//
// Open claim accounting: `storage::OpenClaimCount(holder, policy_id)` must be
// incremented when a claim enters `Processing` and decremented when it reaches
// a terminal status (`Approved` / `Rejected`), so policy termination can block
// or audit in-flight claims. Until `file_claim` ships, admins may use
// `admin_set_open_claim_count` in tests or break-glass ops only.
use crate::{
    ledger, storage,
    types::{Claim, ClaimProcessed, ClaimStatus, VoteOption},
    validate::Error,
};
use soroban_sdk::{contractevent, Address, Env, String, Vec};

#[contractevent(topics = ["niffyinsure", "claim_filed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct ClaimFiled {
    #[topic]
    pub claim_id: u64,
    pub holder: Address,
}

// ── file_claim ────────────────────────────────────────────────────────────────

/// File a new claim against an active policy.
///
/// Window checks (all via `ledger` helpers):
/// - Policy must be active: `now` in `[start_ledger, end_ledger)`.
/// - Rate-limit: `now >= last_filed_at + RATE_LIMIT_WINDOW_LEDGERS` (or first claim).
///
/// Returns the new `claim_id`.
pub fn file_claim(
    env: &Env,
    holder: &Address,
    policy_id: u32,
    amount: i128,
    details: &String,
    image_urls: &Vec<String>,
) -> Result<u64, Error> {
    // Check pause: claims are blocked if claims_paused is true
    storage::assert_claims_not_paused(env);

    let policy = storage::get_policy(env, holder, policy_id).ok_or(Error::PolicyNotFound)?;

    // Policy active window check using ledger helper.
    let now = env.ledger().sequence();
    if !ledger::is_within_window(now, policy.start_ledger, policy.end_ledger) {
        return if ledger::is_expired(now, policy.end_ledger) {
            Err(Error::PolicyExpired)
        } else {
            Err(Error::PolicyInactive)
        };
    }
    if !policy.is_active {
        return Err(Error::PolicyInactive);
    }

    if storage::has_open_claim(env, holder, policy_id) {
        return Err(Error::DuplicateOpenClaim);
    }

    // Rate-limit check.
    if let Some(last) = storage::get_last_claim_ledger(env, holder) {
        if !ledger::is_rate_limit_elapsed(now, last, ledger::RATE_LIMIT_WINDOW_LEDGERS) {
            return Err(Error::RateLimitExceeded);
        }
    }

    crate::validate::check_claim_fields(env, amount, policy.coverage, details, image_urls)?;

    let claim_id = storage::next_claim_id(env);
    let claim = Claim {
        claim_id,
        policy_id,
        claimant: holder.clone(),
        amount,
        details: details.clone(),
        image_urls: image_urls.clone(),
        status: ClaimStatus::Processing,
        voting_deadline_ledger: now.saturating_add(ledger::VOTE_WINDOW_LEDGERS),
        approve_votes: 0,
        reject_votes: 0,
        filed_at: now,
    };

    storage::set_claim(env, &claim);
    storage::set_open_claim(env, holder, policy_id, true);
    storage::snapshot_claim_voters(env, claim_id);
    storage::set_last_claim_ledger(env, holder, now);

    ClaimFiled {
        claim_id,
        holder: holder.clone(),
    }
    .publish(env);

    Ok(claim_id)
}

// ── vote_on_claim ─────────────────────────────────────────────────────────────

/// Cast a vote on a pending claim.
///
/// Window check: `now < filed_at + VOTE_WINDOW_LEDGERS` (via `ledger::is_vote_open`).
/// Returns the updated `ClaimStatus` after tallying.
pub fn vote_on_claim(
    env: &Env,
    voter: &Address,
    claim_id: u64,
    vote: &VoteOption,
) -> Result<ClaimStatus, Error> {
    // Check pause: voting is blocked if claims_paused is true
    storage::assert_claims_not_paused(env);

    let mut claim = storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)?;

    if claim.status.is_terminal() {
        return Err(Error::ClaimAlreadyTerminal);
    }

    // Voting window check.
    let now = env.ledger().sequence();
    if !ledger::is_vote_open(now, claim.filed_at, ledger::VOTE_WINDOW_LEDGERS) {
        return Err(Error::VotingWindowClosed);
    }

    // Voter must be in the claim's snapshot electorate.
    let snapshot = storage::get_claim_voters(env, claim_id);
    let eligible = snapshot.iter().any(|v| v == *voter);
    if !eligible {
        return Err(Error::NotEligibleVoter);
    }

    // Duplicate vote check.
    if storage::get_vote(env, claim_id, voter).is_some() {
        return Err(Error::DuplicateVote);
    }

    storage::set_vote(env, claim_id, voter, vote);

    match vote {
        VoteOption::Approve => claim.approve_votes += 1,
        VoteOption::Reject => claim.reject_votes += 1,
    }

    // Auto-finalize on majority.
    let total = snapshot.len();
    let majority = total / 2 + 1;
    if claim.approve_votes >= majority {
        claim.status = ClaimStatus::Approved;
    } else if claim.reject_votes >= majority {
        claim.status = ClaimStatus::Rejected;
    }

    if claim.status.is_terminal() {
        storage::set_open_claim(env, &claim.claimant, claim.policy_id, false);
    }

    let status = claim.status.clone();
    storage::set_claim(env, &claim);
    Ok(status)
}

// ── finalize_claim ────────────────────────────────────────────────────────────

/// Finalize a claim after the voting deadline has passed.
///
/// Window check: `now >= filed_at + VOTE_WINDOW_LEDGERS` (via `ledger::is_vote_deadline_passed`).
/// Plurality wins; tie resolves to Rejected.
pub fn finalize_claim(env: &Env, claim_id: u64) -> Result<ClaimStatus, Error> {
    // Check pause: finalization is blocked if claims_paused is true
    storage::assert_claims_not_paused(env);

    let mut claim = storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)?;

    if claim.status.is_terminal() {
        return Err(Error::ClaimAlreadyTerminal);
    }

    let now = env.ledger().sequence();
    if !ledger::is_vote_deadline_passed(now, claim.filed_at, ledger::VOTE_WINDOW_LEDGERS) {
        return Err(Error::VotingWindowStillOpen);
    }

    claim.status = if claim.approve_votes > claim.reject_votes {
        ClaimStatus::Approved
    } else {
        // Tie or reject plurality → Rejected (insurer wins tie).
        ClaimStatus::Rejected
    };

    storage::set_open_claim(env, &claim.claimant, claim.policy_id, false);
    let status = claim.status.clone();
    storage::set_claim(env, &claim);
    Ok(status)
}

// ── process_claim (admin payout trigger) ─────────────────────────────────────

pub fn process_claim(env: &Env, claim_id: u64) -> Result<(), Error> {
    let mut claim = storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)?;

    if claim.status == ClaimStatus::Paid {
        return Err(Error::AlreadyPaid);
    }
    if claim.status != ClaimStatus::Approved {
        return Err(Error::ClaimNotApproved);
    }

    payout(env, &claim)?;
    claim.status = ClaimStatus::Paid;
    storage::set_open_claim(env, &claim.claimant, claim.policy_id, false);
    storage::set_claim(env, &claim);
    Ok(())
}

// ── Internal helpers ──────────────────────────────────────────────────────────

fn payout(env: &Env, claim: &Claim) -> Result<(), Error> {
    let policy =
        storage::get_policy(env, &claim.claimant, claim.policy_id).ok_or(Error::PolicyNotFound)?;

    if !storage::is_allowed_asset(env, &policy.asset) {
        return Err(Error::InvalidAsset);
    }

    if !crate::token::check_balance(env, &policy.asset, claim.amount) {
        return Err(Error::InsufficientTreasury);
    }

    crate::token::transfer(
        env,
        &policy.asset,
        &env.current_contract_address(),
        &claim.claimant,
        claim.amount,
    );

    ClaimProcessed {
        claim_id: claim.claim_id,
        recipient: claim.claimant.clone(),
        amount: claim.amount,
    }
    .publish(env);

    Ok(())
}

pub fn get_claim(env: &Env, claim_id: u64) -> Result<Claim, Error> {
    storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)
}

pub fn is_allowed_asset(env: &Env, asset: &Address) -> bool {
    storage::is_allowed_asset(env, asset)
}

pub fn set_allowed_asset(env: &Env, asset: &Address, allowed: bool) {
    storage::set_allowed_asset(env, asset, allowed);
}
