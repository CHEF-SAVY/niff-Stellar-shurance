# Rate Limiting

All API endpoints are protected by a Redis-backed sliding-window rate limiter.
Limits are applied **per wallet address** when a valid JWT is present, or **per IP address** otherwise.
This means authenticated users behind a shared corporate NAT are not penalised collectively.

## Default Limits

| Endpoint group | Limit | Window |
|---|---|---|
| All endpoints (global default) | 120 requests | 60 seconds |
| `POST /api/auth/challenge` | 20 requests | 5 minutes |
| `POST /api/auth/verify` | 20 requests | 5 minutes |
| `POST /api/quote/generate-premium` | 20 requests | 60 seconds |
| `POST /api/ipfs/upload` | 10 requests | 60 seconds |
| `POST /api/claims/build-transaction` | 10 requests | 60 seconds |

> These are approximate values and may be tuned based on observed traffic patterns.
> Limits for claim submission (`POST /api/claims/submit`) are additionally governed by
> a per-policy ledger-window counter (see claim rate limiting docs).

## Response Headers

Every response includes:

```
X-RateLimit-Limit: <limit>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <unix timestamp>
```

When a limit is exceeded, the API returns **HTTP 429 Too Many Requests** with:

```
Retry-After: <seconds until window resets>
```

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

## CDN / WAF Coordination

If a CDN or WAF sits in front of the API, ensure it forwards the real client IP via
`X-Forwarded-For`. The backend trusts the first value in that header.
Avoid double-counting at the CDN layer for the same limits — either enforce at CDN
**or** at the API, not both, to prevent false positives for large NATs.

## Ops Monitoring

Throttle hits are logged as structured `WARN` entries under the `ThrottleHit` logger:

```json
{
  "level": "warn",
  "message": "Throttle limit hit",
  "tracker": "wallet:GABC...",
  "key": "default",
  "totalHits": 121,
  "limit": 120,
  "retryAfterSec": 42,
  "method": "POST",
  "path": "/api/quote/generate-premium"
}
```

Alert on sustained `ThrottleHit` volume from a single tracker to detect abuse patterns.
