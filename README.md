# niffyInsur

> **Decentralized parametric insurance with community-governed claim resolution**

niffyInsur is a **blockchain-based insurance platform** that lets users **buy insurance policies**, pay premiums, file claims, and resolve claims via a **DAO-style community vote** by policyholders. Policyholders vote on claims; the majority decides, and payouts execute automatically on-chain. It is built on **Stellar Soroban** (Rust → WASM smart contracts).

### Why Insurance On-Chain?

| Problem (Traditional) | On-Chain Solution |
|----------------------|-------------------|
| **Opaque claims** | Rules and votes are public and auditable |
| **Delayed or disputed payouts** | Smart contracts pay automatically once vote passes—no middleman |
| **Centralized gatekeepers** | DAO of policyholders decides; no single company controls outcomes |
| **Trust in paper records** | Policies and claims live on immutable ledger |

On-chain insurance turns payouts into **programmable, trustless execution** instead of manual approval chains.

---

## Table of Contents

- [Why Insurance On-Chain?](#why-insurance-on-chain)
- [What niffyInsure Does](#what-niffyinsure-does)
- [Architecture Overview](#architecture-overview)
- [Smart Contract Components](#smart-contract-components)
- [User Flows](#user-flows)
- [Technology Stack](#technology-stack)
- [Soroban Architecture](#soroban-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)

---

## What niffyInsure Does

| Feature | Description |
|--------|-------------|
| **Premium calculation** | On-chain calculators apply risk factors (location, age, accidents, safety features) to compute premiums |
| **Policy lifecycle** | Generate quote → Pay premium (XLM/tokens) → Activate policy → Renew → Terminate |
| **Claims** | Policyholders file claims with amount, details, and IPFS image URLs |
| **Governance** | Policyholders vote on claims (approve/reject); majority decides; approved claims trigger token payout |
| **Tokenless DAO** | Voters = policyholders; no separate governance token |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React / Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Insurance    │  │ Insurance    │  │ Claims /     │  │ Proposals   │  │
│  │ Products     │  │ Policies     │  │ Vote UI      │  │ (DAO)       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                    Stellar SDK / WalletConnect + IPFS (image storage)    │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SOROBAN CONTRACTS (Rust)                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                     │
│  │ InsurancePolicy      │  │ PremiumCalculator    │                     │
│  │ - generate_premium   │  │ - compute_premium    │                     │
│  │ - initiate_policy    │  │   (risk factors)     │                     │
│  │ - renew / terminate  │  └──────────────────────┘                     │
│  │ - file_claim         │                                               │
│  │ - vote_on_claim      │                                               │
│  └──────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Components (Soroban)

### 1. Premium Calculator

Computes premiums from risk factors (location, age, coverage type, etc.) via configurable multipliers. Policy contracts call this module to quote and bind policies.

### 2. Policy Contract

- **Policy struct**: holder (`Address`), policy_id, premium, type-specific fields, is_active, timestamps, claim status
- **Claim struct**: policy_id, policyholder, claim_amount, claim_details, image URLs, status
- **Voting**: policyholders vote approve/reject; majority decides
- **Token payments**: premium via `pay()` or token transfer; claim payout via `Token::transfer`

### 3. Events

- `PremiumGenerated`, `PolicyInitiated`, `PolicyRenewed`, `PolicyTerminated`
- `VoteLogged`, `ClaimStatusChanged`, `ClaimProcessed`

---

## User Flows

### Quote & Buy Policy

1. User fills form (coverage type, risk factors).
2. Frontend uploads images to IPFS.
3. Call `generate_premium(...)` → Soroban contract returns premium.
4. User pays premium (XLM or token) → `initiate_policy(holder, policy_id)`.
5. Policy is active; holder becomes a voter.

### Renew / Terminate

- **Renew**: After renewal window, call `renew_policy(holder, id)` with premium payment.
- **Terminate**: `terminate_policy(holder, reason)`; if no active policies left, holder is removed from voters.

### File Claim

1. Call `file_claim(policy_id, claim_amount, claim_details, image_urls)`.
2. Claim status = `Processing`.
3. Policyholders call `vote_on_claim(claim_id, Approve|Reject)`.
4. On majority approval → token payout to claimant; on majority reject → policy deactivated.

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Smart contracts | Rust, Soroban SDK |
| Frontend | React / Next.js, Stellar SDK, Tailwind |
| Storage | IPFS (claim images) |
| Chain | Stellar (Soroban) |

---

## Soroban Architecture

### Why Stellar & Soroban?

- **Soroban** = Stellar’s smart contract platform (Rust → WASM).
- Lower fees, predictable costs, fast finality.
- Native multi-asset support (XLM, stablecoins).
- Strong ecosystem for payments and emerging markets.

### Contract Layout

```
niffyinsure-soroban/
├── src/
│   ├── lib.rs                    # Contract entry, init
│   ├── types.rs                  # Policy, Claim, VoteOption, ClaimStatus
│   ├── storage.rs                # DataKey patterns, read/write
│   ├── premium.rs                # Premium calculation logic (inline or module)
│   ├── policy.rs                 # generate, initiate, renew, terminate
│   ├── claim.rs                  # file_claim, vote, tally, finalize
│   └── token.rs                  # Token transfers (XLM or wrapped asset)
├── test/
│   └── ...
└── Cargo.toml
```

### Key Implementation Notes

1. **Token payments**  
   Use Stellar native token (XLM) or wrapped asset; premium and payouts use token transfers.

2. **Storage**  
   Soroban uses `Ledger` and `DataKey`; design keys for:
   - `policies[address][policy_id]`
   - `claims[claim_id]`
   - `votes[claim_id][address]`
   - `voters[]`, `total_voters`, `claim_id_counter`

3. **Strings and Arrays**  
   Prefer symbols / enums where possible; keep `Vec<String>` for IPFS URLs if needed.

4. **Voting**  
   Same logic: iterate voters, count approve/reject; on majority → finalize claim and pay.

5. **Admin / Owner**  
   Use `invoker` or stored `admin` address; gate sensitive operations (e.g. drain, add voter if needed).

### Target Soroban APIs

- `soroban_sdk::{contract, contractimpl, Env, Address, Map, Vec, Symbol, ...}`
- Token interface for premium/payout flows
- Events for `PremiumGenerated`, `PolicyInitiated`, `ClaimFiled`, `ClaimProcessed`, etc.

---

## Project Structure

```
niffyInsure/
├── contracts/                     # Soroban (Rust)
│   ├── niffyinsure/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── types.rs
│   │   │   ├── storage.rs
│   │   │   ├── premium.rs
│   │   │   ├── policy.rs
│   │   │   ├── claim.rs
│   │   │   └── token.rs
│   │   └── Cargo.toml
│   └── ...
├── frontend/                      # React / Next.js
│   ├── src/
│   └── package.json
└── README.md
```

---

## Getting Started

### Smart contracts (Soroban)

```bash
cd contracts/niffyinsure
cargo build --target wasm32-unknown-unknown
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/niffyinsure.wasm
```

### Frontend

```bash
cd frontend
npm install
# Configure .env (Stellar RPC, network passphrase, contract IDs)
npm run dev
```

---

## License

See individual package licenses in backend and frontend directories.
