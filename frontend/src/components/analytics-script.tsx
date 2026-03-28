/**
 * AnalyticsScript — injects the Plausible script only when analytics is
 * configured and the environment is not local dev.
 *
 * Rendered inside <head> from the root layout. The nonce from the CSP
 * middleware is forwarded so the script satisfies the nonce-based policy.
 *
 * Environment variables:
 *   NEXT_PUBLIC_ANALYTICS_ENABLED  — set to "true" in staging/production
 *   NEXT_PUBLIC_ANALYTICS_DOMAIN   — your Plausible site domain, e.g. "niffyinsur.com"
 *   NEXT_PUBLIC_ANALYTICS_SRC      — optional self-hosted Plausible URL
 *                                    defaults to "https://plausible.io/js/script.js"
 *
 * CSP: the Plausible script origin must be added to script-src and
 * connect-src in middleware.ts when using the cloud-hosted version.
 */

interface AnalyticsScriptProps {
  nonce?: string
}

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
const DOMAIN = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN ?? ''
const SRC =
  process.env.NEXT_PUBLIC_ANALYTICS_SRC ??
  'https://plausible.io/js/script.js'

export function AnalyticsScript({ nonce }: AnalyticsScriptProps) {
  // Disabled in local dev (env var absent) or when domain is not configured
  if (!ENABLED || !DOMAIN) return null

  return (
    // defer keeps the script out of the critical rendering path (LCP safe)
    // data-domain scopes events to this site in the Plausible dashboard
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script
      defer
      data-domain={DOMAIN}
      src={SRC}
      nonce={nonce}
    />
  )
}
