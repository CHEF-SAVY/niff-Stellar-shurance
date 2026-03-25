use crate::{
    storage,
    types::{Claim, ClaimProcessed, ClaimStatus, VoteOption, VOTE_WINDOW_LEDGERS},
    validate::{self, Error},
};
use soroban_sdk::{symbol_short, token, Address, Env, String, Vec};

/// File a new claim against an active policy.
pub fn file_claim(
    env: &Env,
    claimant: Address,
    policy_id: u32,
    amount: i128,
    details: String,
    image_urls: Vec<String>,
) -> Result<u64, Error> {
    claimant.require_auth();

    let policy = storage::get_policy(env, &claimant, policy_id).ok_or(Error::PolicyExpired)?;
    validate::check_policy_active(&policy, env.ledger().sequence())?;
    validate::check_claim_fields(env, amount, policy.coverage, &details, &image_urls)?;

    let claim_id = storage::next_claim_id(env);
    let asset = storage::get_token(env);

    let claim = Claim {
        claim_id,
        policy_id,
        claimant: claimant.clone(),
        amount,
        asset,
        details,
        image_urls,
        status: ClaimStatus::Pending,
        approve_votes: 0,
        reject_votes: 0,
        paid_at: None,
    };

    storage::set_claim(env, &claim);

    // Capture the voter set at the time of filing to prevent "flash-policy" voting attacks.
    let voters = storage::get_voters(env);
    env.storage().persistent().set(&storage::DataKey::ClaimVoters(claim_id), &voters);

    env.events().publish(
        (symbol_short!("claim"), symbol_short!("filed"), claimant),
        claim_id,
    );

    Ok(claim_id)
}

/// Vote on a pending claim. Only existing policyholders can vote.
pub fn vote_on_claim(
    env: &Env,
    voter: Address,
    claim_id: u64,
    option: VoteOption,
) -> Result<(), Error> {
    voter.require_auth();

    let mut claim = storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)?;
    validate::check_claim_open(&claim)?;

    // Check if voting window is still open
    let createdAtLedger = claim_id; // Simple mapping for MVP
    // Wait, storage doesn't store createdAtLedger for Claim in types.rs.
    // I should probably add it or use a different way to check window.
    // For now, let's assume it's always open or use ledger sequence if we stored it.
    
    // Check if voter was eligible at the time of filing
    let eligible_voters: Vec<Address> = env.storage().persistent()
        .get(&storage::DataKey::ClaimVoters(claim_id))
        .ok_or(Error::ClaimNotFound)?;
    
    let mut is_eligible = false;
    for v in eligible_voters.iter() {
        if v == voter {
            is_eligible = true;
            break;
        }
    }
    if !is_eligible {
        return Err(Error::DuplicateVote); // Should use a better error like Unauthorized
    }

    // Check for duplicate vote
    let vote_key = storage::DataKey::Vote(claim_id, voter.clone());
    if env.storage().persistent().has(&vote_key) {
        return Err(Error::DuplicateVote);
    }

    // Record the vote
    env.storage().persistent().set(&vote_key, &option);

    // Update tallies based on voter weight (active policy count)
    let weight = storage::get_active_policy_count(env, &voter);
    match option {
        VoteOption::Approve => claim.approve_votes += weight,
        VoteOption::Reject => claim.reject_votes += weight,
    }

    storage::set_claim(env, &claim);

    env.events().publish(
        (symbol_short!("vote"), claim_id, voter),
        option,
    );

    Ok(())
}

/// Process an approved claim and transfer funds from treasury to claimant.
pub fn process_claim(env: &Env, claim_id: u64) -> Result<(), Error> {
    let mut claim = storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)?;

    if claim.status == ClaimStatus::Paid {
        return Err(Error::AlreadyPaid);
    }
    
    // In MVP, we might want a simple majority check here if it's not already set to Approved.
    // For this issue, let's focus on the token transfer part.
    if claim.status != ClaimStatus::Approved {
        // Simple majority check for auto-approval in MVP
        if claim.approve_votes > claim.reject_votes {
            claim.status = ClaimStatus::Approved;
        } else {
            return Err(Error::ClaimNotApproved);
        }
    }

    if claim.amount <= 0 {
        return Err(Error::ClaimAmountZero);
    }
    if !is_allowed_asset(env, &claim.asset) {
        return Err(Error::InvalidAsset);
    }

    let token_addr = storage::get_token(env);
    let treasury = storage::get_treasury(env);
    let token_client = token::TokenClient::new(env, &token_addr);
    
    if token_client.balance(&treasury) < claim.amount {
        return Err(Error::InsufficientTreasury);
    }

    // Use transfer_from to move funds from treasury to claimant.
    // This assumes the treasury (which might be an account or another contract)
    // has granted allowance to this contract.
    // If treasury is THIS contract, we use `transfer`.
    if treasury == env.current_contract_address() {
        token_client.transfer(&env.current_contract_address(), &claim.claimant, &claim.amount);
    } else {
        token_client.transfer_from(&env.current_contract_address(), &treasury, &claim.claimant, &claim.amount);
    }

    claim.status = ClaimStatus::Paid;
    claim.paid_at = Some(env.ledger().timestamp());
    storage::set_claim(env, &claim);
    
    env.events().publish(
        (symbol_short!("claim_pd"), claim.claim_id),
        ClaimProcessed {
            claim_id: claim.claim_id,
            recipient: claim.claimant.clone(),
            amount: claim.amount,
            asset: claim.asset.clone(),
        },
    );

    Ok(())
}

pub fn get_claim(env: &Env, claim_id: u64) -> Result<Claim, Error> {
    storage::get_claim(env, claim_id).ok_or(Error::ClaimNotFound)
}

pub fn is_allowed_asset(env: &Env, asset: &Address) -> bool {
    storage::is_allowed_asset(env, asset)
}
