# Emergency Token Sweep - Quick Start Guide

## What is Emergency Token Sweep?

The emergency token sweep function allows authorized administrators to recover tokens that were mistakenly sent to the NiffyInsure smart contract. This is a high-risk, admin-only function with strict ethical and legal constraints.

## ⚠️ Critical Constraints

**This function MUST NEVER be used to:**
- Confiscate user premium payments
- Avoid paying approved claims
- Seize funds belonging to policyholders

**Misuse will result in:**
- Irreparable reputational damage
- Legal liability
- Loss of user trust

## Quick Reference

### When to Use Sweep

✅ **Legitimate Use Cases:**
- User accidentally sends tokens to contract address
- Test tokens sent to mainnet contract
- Unsolicited airdrop tokens
- Deprecated asset migration

❌ **Never Use Sweep For:**
- User premium payments
- Approved claim payouts
- Protocol treasury reserves
- Disputed or unclear ownership

### Reason Codes

| Code | Meaning |
|------|---------|
| 1 | Accidental user transfer |
| 2 | Test tokens |
| 3 | Unsolicited airdrop |
| 4 | Deprecated asset migration |
| 100+ | Custom organizational codes |

## Quick Start

### 1. Pre-Sweep Checklist

- [ ] Identify token source (transaction hash)
- [ ] Verify tokens are NOT user funds
- [ ] Check no approved claims affected
- [ ] Calculate protected balance
- [ ] Obtain 3-of-5 multisig approval
- [ ] Document justification

### 2. Execute Sweep

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_MULTISIG> \
  --network mainnet \
  -- \
  sweep_token \
  --asset <ASSET_ADDRESS> \
  --recipient <DESTINATION> \
  --amount <AMOUNT_IN_STROOPS> \
  --reason_code <CODE>
```

### 3. Post-Sweep

- [ ] Verify transfer completed
- [ ] Update audit log
- [ ] Notify stakeholders (if material)
- [ ] Confirm remaining balance adequate

## Safety Features

### Automatic Protections

1. **Admin-Only Access:** Only authorized multisig can execute
2. **Asset Allowlist:** Only sweep allowlisted tokens
3. **Protected Balance Check:** Ensures approved claims can be paid
4. **Per-Transaction Cap:** Optional limit on sweep amount
5. **Comprehensive Events:** Full audit trail

### Manual Protections

1. **Multisig Requirement:** 3-of-5 signers minimum
2. **Pre-Sweep Checklist:** Procedural safeguards
3. **Safety Buffer:** Leave 10-20% above protected balance
4. **Legal Review:** Required for material amounts

## Protected Balance

**What is Protected:**
- All approved (unpaid) claims

**What is NOT Protected:**
- Premium reserves (operational float)
- Processing claims (not yet approved)
- Future obligations (not yet filed)

**Operators MUST maintain adequate reserves beyond the protected balance.**

## Configuration

### Set Sweep Cap (Optional but Recommended)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_MULTISIG> \
  --network mainnet \
  -- \
  set_sweep_cap \
  --cap 100000000000  # 100,000 tokens (7 decimals)
```

### Disable Sweep Cap

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_MULTISIG> \
  --network mainnet \
  -- \
  set_sweep_cap \
  --cap null
```

### Query Current Cap

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network mainnet \
  -- \
  get_sweep_cap
```

## Documentation

### For Operators
📖 **[SWEEP_RUNBOOK.md](./SWEEP_RUNBOOK.md)** - Detailed operational procedures
- Step-by-step execution guide
- Protected balance calculation
- Monitoring and alerting
- Incident response

### For Legal/Compliance
⚖️ **[SWEEP_LEGAL_COMPLIANCE.md](./SWEEP_LEGAL_COMPLIANCE.md)** - Legal framework
- Custody implications
- Regulatory considerations
- Terms of Service requirements
- Dispute resolution

### For Developers
🔧 **[SWEEP_IMPLEMENTATION_SUMMARY.md](./SWEEP_IMPLEMENTATION_SUMMARY.md)** - Technical details
- Implementation overview
- Test coverage
- Security model
- API reference

## Example Scenarios

### Scenario 1: Accidental User Transfer

**Situation:** User sends 5,000 USDC to contract instead of their wallet.

**Steps:**
1. Verify transaction on explorer
2. Confirm not a premium payment
3. Get multisig approval
4. Execute sweep with reason_code=1
5. Return tokens to user
6. Update audit log

### Scenario 2: Unsolicited Airdrop

**Situation:** Marketing campaign airdrops 100,000 tokens to contract.

**Steps:**
1. Identify airdrop source
2. Verify not part of protocol operations
3. Get multisig approval
4. Execute sweep with reason_code=3
5. Transfer to treasury or dispose
6. Document in audit log

### Scenario 3: Test Tokens on Mainnet

**Situation:** Developer accidentally sends testnet tokens to mainnet contract.

**Steps:**
1. Confirm tokens are test tokens
2. Verify no value or user impact
3. Get multisig approval
4. Execute sweep with reason_code=2
5. Dispose of tokens
6. Update procedures to prevent recurrence

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Unauthorized` | Caller is not admin | Use multisig admin account |
| `InvalidSweepAmount` | Amount ≤ 0 | Provide positive amount |
| `AssetNotAllowlisted` | Asset not on allowlist | Allowlist asset first or verify address |
| `SweepCapExceeded` | Amount > configured cap | Reduce amount or increase cap |
| `ProtectedBalanceViolation` | Would leave insufficient funds | Reduce sweep amount or wait for claims to be paid |

## Monitoring

### Key Metrics to Track

1. **Sweep Frequency:** How often sweeps occur
2. **Sweep Amounts:** Total value swept per period
3. **Reason Code Distribution:** Most common scenarios
4. **Protected Balance Ratio:** Remaining balance / protected balance
5. **Time to Execute:** From detection to sweep completion

### Alerts to Configure

1. **Sweep Executed:** Notify all admins immediately
2. **Large Sweep:** Alert for amounts > threshold
3. **Protected Balance Violation Attempt:** Security alert
4. **Frequent Sweeps:** May indicate systemic issue

## FAQ

### Q: Can sweep be used to recover user funds sent by mistake?
**A:** Yes, if the user accidentally sent tokens to the contract address instead of their intended destination. This is reason_code=1.

### Q: What if we're not sure if tokens are user funds?
**A:** DO NOT SWEEP. Investigate thoroughly and consult legal counsel. When in doubt, don't sweep.

### Q: Can we sweep during a pause?
**A:** The sweep function is not blocked by pause flags, but should only be used during pause for emergency recovery, not routine operations.

### Q: What if a user disputes a sweep?
**A:** Follow the dispute resolution process in SWEEP_LEGAL_COMPLIANCE.md. Be prepared to return funds if sweep was improper.

### Q: How do we calculate the safety buffer?
**A:** Recommended 10-20% above protected balance. Example: If protected balance is 500K, leave at least 550K-600K in contract.

### Q: Can we sweep multiple assets at once?
**A:** No, sweep_token operates on one asset at a time. Execute multiple sweeps if needed.

### Q: What if multisig signers disagree?
**A:** Sweep requires 3-of-5 approval. If consensus cannot be reached, escalate to executive team or board.

## Support

### Emergency Contacts

- **Technical Issues:** [TECH_LEAD_EMAIL]
- **Legal Questions:** [LEGAL_EMAIL]
- **Compliance Concerns:** [COMPLIANCE_EMAIL]
- **Executive Escalation:** [EXEC_EMAIL]

### Reporting Issues

If you discover a security issue with the sweep function:

1. **DO NOT** disclose publicly
2. Email security@[DOMAIN] immediately
3. Include: description, impact, reproduction steps
4. Wait for response before taking action

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-27 | Initial implementation |

## License

This documentation is part of the NiffyInsure smart contract project.

---

**⚠️ IMPORTANT:** Read the full runbook and legal framework before using sweep in production.

**Last Updated:** 2024-03-27  
**Maintained By:** [TEAM/ROLE]
