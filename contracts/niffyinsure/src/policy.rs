use crate::{
    premium,
    storage,
    token,
    types::{AgeBand, CoverageType, Policy, PolicyType, PremiumQuote, RegionTier, RiskInput},
    validate,
};
use soroban_sdk::{contractevent, contracterror, contracttype, symbol_short, Address, Env, String};

/// How long a quote stays valid (in ledgers) from generation time.
pub const QUOTE_TTL_LEDGERS: u32 = 100;

/// Default policy duration in ledgers (~30 days at 5s/ledger ≈ 518_400).
pub const POLICY_DURATION_LEDGERS: u32 = 518_400;

/// Current event schema version.
pub const POLICY_EVENT_VERSION: u32 = 1;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PolicyError {
    /// Contract is paused by admin.
    ContractPaused = 100,
    /// A policy with this (holder, policy_id) already exists.
    DuplicatePolicyId = 101,
    /// Coverage must be > 0.
    InvalidCoverage = 102,
    /// Computed premium is zero or negative.
    InvalidPremium = 103,
    /// Premium computation overflowed.
    PremiumOverflow = 104,
    /// Policy duration would overflow ledger sequence.
    LedgerOverflow = 105,
    /// Policy struct failed internal validation.
    PolicyValidation = 106,
    /// Caller is not authorized.
    Unauthorized = 107,
    /// Age out of range (1..=120).
    InvalidAge = 108,
    /// Risk score out of range (0..=100).
    InvalidRiskScore = 109,
    /// Policy not found.
    NotFound = 110,
    /// Policy is already active.
    AlreadyActive = 111,
}

/// Versioned event emitted by `initiate_policy`.
#[contractevent]
#[derive(Clone, Debug)]
pub struct PolicyInitiated {
    #[topic]
    pub holder: Address,
    pub version: u32,
    pub policy_id: u32,
    pub premium: i128,
    pub asset: Address,
    pub policy_type: PolicyType,
    pub region: RegionTier,
    pub coverage: i128,
    pub start_ledger: u32,
    pub end_ledger: u32,
}

/// Event emitted by `renew_policy`.
#[contractevent]
#[derive(Clone, Debug)]
pub struct PolicyRenewed {
    #[topic]
    pub holder: Address,
    pub policy_id: u32,
    pub premium: i128,
    pub new_end_ledger: u32,
}

pub fn generate_premium(
    env: &Env,
    region: RegionTier,
    age_band: AgeBand,
    coverage_type: CoverageType,
    safety_score: u32,
    base_amount: i128,
    include_breakdown: bool,
) -> Result<PremiumQuote, validate::Error> {
    let input = RiskInput {
        region,
        age_band,
        coverage: coverage_type,
        safety_score,
    };
    
    validate::check_risk_input(&input)?;
    if base_amount <= 0 {
        return Err(validate::Error::InvalidBaseAmount);
    }

    let table = storage::get_multiplier_table(env);
    let computation = premium::compute_premium(&input, base_amount, &table)?;
    let line_items = if include_breakdown {
        Some(premium::build_line_items(env, &computation))
    } else {
        None
    };

    let current_ledger = env.ledger().sequence();
    let valid_until_ledger = current_ledger
        .checked_add(QUOTE_TTL_LEDGERS)
        .ok_or(validate::Error::Overflow)?;

    Ok(PremiumQuote {
        total_premium: computation.total_premium,
        line_items,
        valid_until_ledger,
        config_version: computation.config_version,
    })
}

/// Turns an accepted quote into an enforceable on-chain policy.
pub fn initiate_policy(
    env: &Env,
    holder: Address,
    policy_type: PolicyType,
    region: RegionTier,
    age_band: AgeBand,
    coverage_type: CoverageType,
    safety_score: u32,
    base_amount: i128,
) -> Result<Policy, PolicyError> {
    if storage::is_paused(env) {
        return Err(PolicyError::ContractPaused);
    }

    holder.require_auth();

    let input = RiskInput {
        region: region.clone(),
        age_band: age_band.clone(),
        coverage: coverage_type,
        safety_score,
    };

    if safety_score > 100 {
        return Err(PolicyError::InvalidRiskScore);
    }
    if base_amount <= 0 {
        return Err(PolicyError::InvalidCoverage);
    }

    let table = storage::get_multiplier_table(env);
    let computation = premium::compute_premium(&input, base_amount, &table)
        .map_err(|_| PolicyError::PremiumOverflow)?;
    
    let premium_amount = computation.total_premium;
    if premium_amount <= 0 {
        return Err(PolicyError::InvalidPremium);
    }

    // Allocate unique per-holder policy_id
    let policy_id = storage::next_policy_id(env, &holder);

    // Premium transfer: holder → treasury address (via contract)
    // Done BEFORE any durable writes so failure leaves no partial state.
    token::collect_premium(env, &holder, premium_amount);

    let current_ledger = env.ledger().sequence();
    let end_ledger = current_ledger
        .checked_add(POLICY_DURATION_LEDGERS)
        .ok_or(PolicyError::LedgerOverflow)?;

    let policy = Policy {
        holder: holder.clone(),
        policy_id,
        policy_type: policy_type.clone(),
        region: region.clone(),
        premium: premium_amount,
        coverage: base_amount,
        is_active: true,
        start_ledger: current_ledger,
        end_ledger,
    };

    validate::check_policy(&policy).map_err(|_| PolicyError::PolicyValidation)?;

    storage::set_policy(env, &holder, policy_id, &policy);
    storage::add_voter(env, &holder);

    PolicyInitiated {
        version: POLICY_EVENT_VERSION,
        policy_id,
        holder: holder.clone(),
        premium: premium_amount,
        asset: storage::get_token(env),
        policy_type,
        region,
        coverage: base_amount,
        start_ledger: current_ledger,
        end_ledger,
    }
    .publish(env);

    Ok(policy)
}

/// Renews an existing policy by paying the premium for another period.
pub fn renew_policy(
    env: &Env,
    holder: Address,
    policy_id: u32,
) -> Result<Policy, PolicyError> {
    if storage::is_paused(env) {
        return Err(PolicyError::ContractPaused);
    }

    holder.require_auth();

    let mut policy = storage::get_policy(env, &holder, policy_id)
        .ok_or(PolicyError::NotFound)?;

    // Only active policies can be renewed (mvp constraint)
    if !policy.is_active {
        return Err(PolicyError::AlreadyActive);
    }

    // Premium transfer
    token::collect_premium(env, &holder, policy.premium);

    let current_ledger = env.ledger().sequence();
    
    // Extend from current end_ledger if not expired, otherwise from current_ledger
    let start_point = if current_ledger < policy.end_ledger {
        policy.end_ledger
    } else {
        current_ledger
    };

    let new_end_ledger = start_point
        .checked_add(POLICY_DURATION_LEDGERS)
        .ok_or(PolicyError::LedgerOverflow)?;

    policy.end_ledger = new_end_ledger;

    storage::set_policy(env, &holder, policy_id, &policy);

    env.events().publish(
        (symbol_short!("policy"), symbol_short!("renewed")),
        PolicyRenewed {
            holder: holder.clone(),
            policy_id,
            premium: policy.premium,
            new_end_ledger,
        },
    );

    Ok(policy)
}
