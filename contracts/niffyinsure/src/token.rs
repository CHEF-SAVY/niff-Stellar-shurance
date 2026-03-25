/// Token interaction helpers.
///
/// # Trust model
/// Only allowlisted asset contract IDs may be used in payment paths.
/// `transfer_from_contract` reads the policy's stored asset — no caller-supplied
/// token address enters the payment path without an allowlist check upstream.
/// See SECURITY.md for the full trust model and reentrancy analysis.
use soroban_sdk::{Address, Env};

use crate::storage;

/// Transfer `amount` of the contract's default treasury token from this contract to `to`.
/// Used for admin drain operations; reads the token address from storage.
pub fn transfer_from_contract(env: &Env, to: &Address, amount: i128) {
    let token = storage::get_token(env);
    let from = env.current_contract_address();
    transfer(env, &token, &from, to, amount);
}

/// Low-level SEP-41 `transfer` invocation.
///
/// Defence-in-depth: verifies `token` is on the allowlist before invoking.
/// Callers in the policy/claim path must have already validated the asset,
/// but this provides a second layer of protection.
/// `pub(crate)` — external callers must go through `transfer_from_contract`
/// or the policy/claim modules which enforce allowlist checks.
pub(crate) fn transfer(env: &Env, token: &Address, from: &Address, to: &Address, amount: i128) {
    // Defence-in-depth: asset must be allowlisted.
    if !storage::is_allowed_asset(env, token) {
        panic!("token not allowlisted");
    }
    let args = soroban_sdk::vec![
        env,
        soroban_sdk::IntoVal::<Env, soroban_sdk::Val>::into_val(from, env),
        soroban_sdk::IntoVal::<Env, soroban_sdk::Val>::into_val(to, env),
        soroban_sdk::IntoVal::<Env, soroban_sdk::Val>::into_val(&amount, env),
    ];
    env.invoke_contract::<()>(token, &soroban_sdk::Symbol::new(env, "transfer"), args);
}
