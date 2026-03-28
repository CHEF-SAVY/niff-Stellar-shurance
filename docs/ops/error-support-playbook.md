# Error & Support Playbook

## Overview

Every API error response includes a `requestId` (correlation ID) that links the
user-facing error to a specific backend log entry. Support agents should always
ask users for this reference before escalating.

---

## 1. Finding a Correlation ID

### From the UI
Users see the reference in error toasts and inline error messages:
> "Something went wrong. (Ref: `req_abc123`)"

### From the API response body
```json
{
  "statusCode": 500,
  "requestId": "req_abc123",
  "error": "SERVER_ERROR",
  "message": "Internal server error"
}
```

### From response headers
```
x-request-id: req_abc123
```

---

## 2. Log Lookup

### NestJS backend (structured JSON logs)
```bash
# Grep by requestId in production logs
grep '"requestId":"req_abc123"' /var/log/app/app.log

# Or with jq
cat /var/log/app/app.log | jq 'select(.requestId == "req_abc123")'
```

### Grafana / Loki
```logql
{app="niffyinsur-backend"} |= "req_abc123"
```

---

## 3. Error Code Reference

| Code | HTTP | Meaning | Action |
|------|------|---------|--------|
| `UNAUTHORIZED` | 401 | Session expired | Ask user to reconnect wallet |
| `FORBIDDEN` | 403 | Insufficient role | Verify user permissions |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry; check for abuse |
| `TRANSACTION_FAILED` | 400 | Stellar tx rejected | Check Stellar explorer with tx hash |
| `SIGNATURE_INVALID` | 400 | Bad wallet signature | Ask user to retry signing |
| `INSUFFICIENT_BALANCE` | 400 | Not enough XLM/token | User needs to fund wallet |
| `LEDGER_CLOSED` | 400 | Tx missed ledger window | Resubmit transaction |
| `SOROBAN_RPC_ERROR` | 502 | RPC node issue | Check RPC node health; retry |
| `OPEN_CLAIM_EXISTS` | 409 | Duplicate claim attempt | Explain existing open claim |
| `SERVER_ERROR` | 500 | Unhandled exception | Escalate with requestId |

---

## 4. Stellar Transaction Debugging

1. Extract `transactionHash` from the error details or user report.
2. Look up on Stellar Expert:
   - Testnet: `https://stellar.expert/explorer/testnet/tx/<hash>`
   - Mainnet: `https://stellar.expert/explorer/public/tx/<hash>`
3. Check the result code (e.g. `tx_failed`, `op_underfunded`).
4. Map to the error code table above.

> **Security**: Never ask users to share private keys, seed phrases, or signed
> XDR outside of a verified secure developer tool. These are never required for
> support escalation.

---

## 5. Escalation Path

1. **Tier 1** — User self-service: retry button in UI, reconnect wallet.
2. **Tier 2** — Support agent: collect `requestId`, look up logs, check Stellar explorer.
3. **Tier 3** — Engineering: provide `requestId` + full log context + Stellar tx hash.

---

## 6. PII Policy for Error Events

Anonymized error events forwarded to observability tools **must not** include:
- Wallet addresses (truncate to first 6 + last 4 chars if needed for grouping)
- Email addresses
- IP addresses (hash or omit)
- Private keys, seeds, or signed XDR (never, under any circumstances)

See `backend/src/maintenance/privacy.service.ts` for the data-scrubbing implementation.
