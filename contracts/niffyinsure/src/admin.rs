/// Privileged administration: admin rotation, token update, pause toggle, drain.
///
/// # Centralization disclosure (for users / auditors)
///
/// Community policyholders govern claim outcomes via DAO voting — no admin
/// override exists on individual claims. However, the following protocol
/// parameters remain admin-controlled in the MVP:
///   - Token contract address, pause state, admin key, treasury drain.
///
/// Production deployments SHOULD use a Stellar multisig account as admin.
/// See SECURITY.md for the full threat matrix and multisig setup guidance.
use soroban_sdk::{contracterror, contractevent, panic_with_error, Address, Env};

use crate::storage;

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, PartialOrd, Ord, Eq)]
#[repr(u32)]
pub enum AdminError {
    /// Caller is not the current admin.
    Unauthorized = 100,
    /// initialize() has already been called.
    AlreadyInitialized = 101,
    /// No pending admin proposal exists.
    NoPendingAdmin = 102,
    /// Caller is not the pending admin.
    NotPendingAdmin = 103,
    /// Supplied address failed validation (e.g. non-allowlisted token).
    InvalidAddress = 104,
    /// Drain amount must be > 0.
    InvalidDrainAmount = 105,
}

#[contractevent(topics = ["niffyinsure", "admin_proposed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct AdminProposed {
    pub old_admin: Address,
    pub new_admin: Address,
}

#[contractevent(topics = ["niffyinsure", "admin_accepted"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct AdminAccepted {
    pub old_admin: Address,
    pub new_admin: Address,
}

#[contractevent(topics = ["niffyinsure", "admin_cancelled"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct AdminCancelled {
    pub current_admin: Address,
    pub cancelled_pending: Address,
}

#[contractevent(topics = ["niffyinsure", "token_updated"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct TokenUpdated {
    pub old_token: Address,
    pub new_token: Address,
}

#[contractevent(topics = ["niffyinsure", "treasury_updated"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct TreasuryUpdated {
    pub old_treasury: Address,
    pub new_treasury: Address,
}

#[contractevent(topics = ["niffyinsure", "admin_paused"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct AdminPaused {
    pub admin: Address,
}

#[contractevent(topics = ["niffyinsure", "admin_unpaused"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct AdminUnpaused {
    pub admin: Address,
}

#[contractevent(topics = ["niffyinsure", "treasury_drained"])]
#[derive(Clone, Debug, Eq, PartialEq)]
struct TreasuryDrained {
    pub admin: Address,
    pub recipient: Address,
    pub amount: i128,
}

/// Load the stored admin address and call `require_auth()` on it.
/// Auth is against the *stored* address — parameter spoofing cannot satisfy it.
pub fn require_admin(env: &Env) -> Address {
    let admin = env
        .storage()
        .instance()
        .get::<_, Address>(&storage::DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, AdminError::Unauthorized));
    admin.require_auth();
    admin
}

/// Propose a new admin (step 1 of two-step rotation). Current admin must authorize.
/// Emits: ("admin", "proposed") → (old_admin, new_admin)
pub fn propose_admin(env: &Env, new_admin: Address) {
    let current = require_admin(env);
    storage::set_pending_admin(env, &new_admin);
    AdminProposed {
        old_admin: current,
        new_admin,
    }
    .publish(env);
}

/// Accept a pending admin proposal. The *pending* admin must authorize.
/// `pending` is read from storage — cannot be spoofed via parameter.
/// Emits: ("admin", "accepted") → (old_admin, new_admin)
pub fn accept_admin(env: &Env) {
    let pending = storage::get_pending_admin(env)
        .unwrap_or_else(|| panic_with_error!(env, AdminError::NoPendingAdmin));
    pending.require_auth();
    let old_admin = storage::get_admin(env);
    storage::set_admin(env, &pending);
    storage::clear_pending_admin(env);
    AdminAccepted {
        old_admin,
        new_admin: pending,
    }
    .publish(env);
}

/// Cancel a pending admin proposal. Current admin must authorize.
/// Emits: ("admin", "cancelled") → (current_admin, cancelled_pending)
pub fn cancel_admin(env: &Env) {
    let current = require_admin(env);
    let pending = storage::get_pending_admin(env)
        .unwrap_or_else(|| panic_with_error!(env, AdminError::NoPendingAdmin));
    storage::clear_pending_admin(env);
    AdminCancelled {
        current_admin: current,
        cancelled_pending: pending,
    }
    .publish(env);
}

/// Update the treasury token contract address. Admin must authorize.
/// Emits: ("admin", "token") → (old_token, new_token)
pub fn set_token(env: &Env, new_token: Address) {
    let _admin = require_admin(env);
    let old_token = storage::get_token(env);
    storage::set_token(env, &new_token);
    TokenUpdated {
        old_token,
        new_token,
    }
    .publish(env);
}

/// Update the treasury address. Admin must authorize.
/// Emits: ("admin", "treasury") → (old_treasury, new_treasury)
pub fn set_treasury(env: &Env, new_treasury: Address) {
    let _admin = require_admin(env);
    let old_treasury = storage::get_treasury(env);
    storage::set_treasury(env, &new_treasury);
    TreasuryUpdated {
        old_treasury,
        new_treasury,
    }
    .publish(env);
}

/// Pause the contract. Admin must authorize.
/// Emits: ("admin", "paused") → (admin)
pub fn pause(env: &Env) {
    let admin = require_admin(env);
    storage::set_paused(env, true);
    AdminPaused { admin }.publish(env);
}

/// Unpause the contract. Admin must authorize.
/// Emits: ("admin", "unpaused") → (admin)
pub fn unpause(env: &Env) {
    let admin = require_admin(env);
    storage::set_paused(env, false);
    AdminUnpaused { admin }.publish(env);
}

/// Drain `amount` stroops from the contract treasury to `recipient`.
/// Admin must authorize. Amount must be > 0.
/// Emits: ("admin", "drained") → (admin, recipient, amount)
pub fn drain(env: &Env, recipient: Address, amount: i128) {
    let admin = require_admin(env);
    if amount <= 0 {
        panic_with_error!(env, AdminError::InvalidDrainAmount);
    }
    crate::token::transfer_from_contract(env, &recipient, amount);
    TreasuryDrained {
        admin,
        recipient,
        amount,
    }
    .publish(env);
}
