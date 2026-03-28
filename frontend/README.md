# NiffyInsur Frontend

Next.js 15 frontend for the NiffyInsur decentralised insurance protocol.

## Getting started

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_API_URL at minimum
npm install
npm run dev
```

## Environment variables

See `.env.example` for the full list with ownership notes.

## Running unit tests

```bash
npm test
```

## Running e2e tests (Playwright)

### Prerequisites

Install Playwright browsers once after `npm install`:

```bash
npx playwright install --with-deps chromium
```

### Local run (against dev server)

The `webServer` config in `playwright.config.ts` starts `next dev` automatically:

```bash
npm run test:e2e
```

Interactive UI mode (great for debugging):

```bash
npm run test:e2e:ui
```

### Local run (against production build)

```bash
npm run build
npx next start &
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
```

### Viewing reports

```bash
npx playwright show-report
```

### Test structure

```
e2e/
  fixtures/
    api.ts          — API route mocks (no real backend needed)
    wallet.ts       — Freighter wallet stub
  landing.spec.ts
  quote.spec.ts
  wallet-connect.spec.ts
  claims-dashboard.spec.ts
  quarantine/       — flaky tests pending fix (see flake policy below)
```

### Flake policy

- Tests retry up to **2 times** in CI (`retries: 2` in `playwright.config.ts`).
- Hard waits (`page.waitForTimeout`) are **forbidden**; use `expect` polling.
- A test that fails consistently after 2 retries must be moved to `e2e/quarantine/`
  and a GitHub issue opened within **48 hours**.
- Quarantined tests are excluded from the required CI check until fixed.

### CI artifacts

On failure, the Playwright job uploads traces and screenshots to the
`playwright-artifacts-<sha>` artifact (retained 7 days). Download and open:

```bash
npx playwright show-report path/to/downloaded/playwright-report
```

## Analytics

Analytics uses [Plausible](https://plausible.io) (cookieless, no PII).
Disabled by default in local dev. See `src/lib/analytics.ts` for the event
catalog and `src/app/privacy/page.tsx` for the privacy policy.

To enable locally:

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_DOMAIN=your-domain.com
```
