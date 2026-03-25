/// Token interaction helpers using SEP-41 Token interface.
///
/// # Trust model
/// Only the allowlisted token stored at DataKey::Token is used in payment paths.
/// `transfer_from_contract` and `collect_premium` read the stored address directly.
use soroban_sdk::{token, Address, Env};

use crate::storage;

/// Collect `amount` of the allowlisted premium token from `from` to the contract's treasury.
/// This uses `transfer_from`, so the user must have set an allowance for this contract.
pub fn collect_premium(env: &Env, from: &Address, amount: i128) {
    let token_addr = storage::get_token(env);
    let treasury = storage::get_treasury(env);
    let client = token::TokenClient::new(env, &token_addr);
    
    // Perform the transfer. This will panic if allowance is insufficient or balance is low.
    client.transfer_from(&env.current_contract_address(), from, &treasury, &amount);
}

/// Transfer `amount` of the allowlisted treasury token from this contract to `to`.
/// Used for claim payouts.
pub fn transfer_from_contract(env: &Env, to: &Address, amount: i128) {
    let token_addr = storage::get_token(env);
    let client = token::TokenClient::new(env, &token_addr);
    
    client.transfer(&env.current_contract_address(), to, &amount);
}

/// Check if the contract has enough balance for a payout.
pub fn check_balance(env: &Env, amount: i128) -> bool {
    let token_addr = storage::get_token(env);
    let client = token::TokenClient::new(env, &token_addr);
    
    client.balance(&env.current_contract_address()) >= amount
}
