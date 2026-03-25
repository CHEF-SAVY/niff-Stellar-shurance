#![no_std]

mod admin;
mod claim;
mod policy;
mod premium;
mod storage;
mod token;
pub mod types;
pub mod validate;

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

#[contract]
pub struct NiffyInsure;

#[contractimpl]
impl NiffyInsure {
    /// One-time initialisation: store admin, token, and treasury addresses,
    /// and seed the default premium table.
    pub fn initialize(env: Env, admin: Address, token: Address, treasury: Address) {
        if env.storage().instance().has(&storage::DataKey::Admin) {
            panic!("already initialized");
        }
        storage::set_admin(&env, &admin);
        storage::set_token(&env, &token);
        storage::set_treasury(&env, &treasury);
        storage::set_multiplier_table(&env, &premium::default_multiplier_table(&env));
        storage::set_allowed_asset(&env, &token, true);
    }

    // ── Premium Engine ───────────────────────────────────────────────────

    /// Pure quote path: reads config and computes premium only.
    pub fn generate_premium(
        env: Env,
        region: types::RegionTier,
        age_band: types::AgeBand,
        coverage_type: types::CoverageType,
        safety_score: u32,
        base_amount: i128,
        include_breakdown: bool,
    ) -> Result<types::PremiumQuote, validate::Error> {
        policy::generate_premium(&env, region, age_band, coverage_type, safety_score, base_amount, include_breakdown)
    }

    pub fn update_multiplier_table(
        env: Env,
        new_table: types::MultiplierTable,
    ) -> Result<(), validate::Error> {
        admin::require_admin(&env);
        premium::update_multiplier_table(&env, &new_table)
    }

    pub fn get_multiplier_table(env: Env) -> types::MultiplierTable {
        storage::get_multiplier_table(&env)
    }

    // ── Policy Domain ────────────────────────────────────────────────────

    pub fn initiate_policy(
        env: Env,
        holder: Address,
        policy_type: types::PolicyType,
        region: types::RegionTier,
        age_band: types::AgeBand,
        coverage_type: types::CoverageType,
        safety_score: u32,
        base_amount: i128,
    ) -> Result<types::Policy, policy::PolicyError> {
        policy::initiate_policy(&env, holder, policy_type, region, age_band, coverage_type, safety_score, base_amount)
    }

    pub fn renew_policy(
        env: Env,
        holder: Address,
        policy_id: u32,
    ) -> Result<types::Policy, policy::PolicyError> {
        policy::renew_policy(&env, holder, policy_id)
    }

    pub fn get_policy(env: Env, holder: Address, policy_id: u32) -> Option<types::Policy> {
        storage::get_policy(&env, &holder, policy_id)
    }

    pub fn get_policy_counter(env: Env, holder: Address) -> u32 {
        storage::get_policy_counter(&env, &holder)
    }

    pub fn get_active_policy_count(env: Env, holder: Address) -> u32 {
        storage::get_active_policy_count(&env, &holder)
    }

    // ── Claims Domain ────────────────────────────────────────────────────

    pub fn file_claim(
        env: Env,
        holder: Address,
        policy_id: u32,
        amount: i128,
        details: String,
        image_urls: Vec<String>,
    ) -> Result<u64, validate::Error> {
        claim::file_claim(&env, holder, policy_id, amount, details, image_urls)
    }

    pub fn vote_on_claim(
        env: Env,
        voter: Address,
        claim_id: u64,
        option: types::VoteOption,
    ) -> Result<(), validate::Error> {
        claim::vote_on_claim(&env, voter, claim_id, option)
    }

    pub fn process_claim(env: Env, claim_id: u64) -> Result<(), validate::Error> {
        admin::require_admin(&env);
        claim::process_claim(&env, claim_id)
    }

    pub fn get_claim(env: Env, claim_id: u64) -> Result<types::Claim, validate::Error> {
        claim::get_claim(&env, claim_id)
    }

    // ── Admin ────────────────────────────────────────────────────────────

    pub fn propose_admin(env: Env, new_admin: Address) {
        admin::propose_admin(&env, new_admin);
    }

    pub fn accept_admin(env: Env) {
        admin::accept_admin(&env);
    }

    pub fn set_token(env: Env, new_token: Address) {
        admin::set_token(&env, new_token);
    }

    pub fn set_treasury(env: Env, new_treasury: Address) {
        admin::set_treasury(&env, new_treasury);
    }

    pub fn pause(env: Env) {
        admin::pause(&env);
    }

    pub fn unpause(env: Env) {
        admin::unpause(&env);
    }

    pub fn is_paused(env: Env) -> bool {
        storage::is_paused(&env)
    }

    pub fn drain(env: Env, recipient: Address, amount: i128) {
        admin::drain(&env, recipient, amount);
    }

    pub fn set_allowed_asset(env: Env, asset: Address, allowed: bool) {
        admin::require_admin(&env);
        storage::set_allowed_asset(&env, &asset, allowed);
    }
}
