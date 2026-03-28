import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — NiffyInsur',
  description: 'How NiffyInsur collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 prose prose-gray">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: March 2026</p>

      <h2>1. Overview</h2>
      <p>
        NiffyInsur (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a decentralised insurance protocol on the
        Stellar blockchain. This policy explains what data we collect, why, and
        your rights regarding that data.
      </p>

      <h2>2. Data We Collect</h2>
      <h3>2.1 On-chain data</h3>
      <p>
        All policy, claim, and vote transactions are recorded on the public
        Stellar ledger. Wallet addresses and transaction details are inherently
        public. We do not control or store this data separately.
      </p>
      <h3>2.2 Analytics data</h3>
      <p>
        When analytics is enabled in production, we use{' '}
        <a href="https://plausible.io" target="_blank" rel="noopener noreferrer">
          Plausible Analytics
        </a>{' '}
        to measure aggregate usage of the application. Plausible is a
        privacy-first, cookieless analytics tool. It does not use cookies, does
        not track individuals across sites, and does not store IP addresses or
        any personally identifiable information (PII).
      </p>
      <p>We collect the following coarse funnel events:</p>
      <ul>
        <li>
          <strong>landing_view</strong> — a visitor loaded the landing page
        </li>
        <li>
          <strong>quote_started / quote_received</strong> — a visitor interacted
          with the quote form; props include only the risk category and contract
          type (e.g. &ldquo;MEDIUM&rdquo;, &ldquo;DEFI_PROTOCOL&rdquo;)
        </li>
        <li>
          <strong>bind_started / bind_wallet_connected / bind_completed</strong>{' '}
          — steps in the policy purchase flow; no wallet address or financial
          amount is included
        </li>
        <li>
          <strong>vote_cast</strong> — a user submitted a governance vote; prop
          is only the direction (&ldquo;approve&rdquo; or &ldquo;reject&rdquo;)
        </li>
      </ul>
      <p>
        Wallet addresses, contract addresses, coverage amounts, and any other
        identifying information are <strong>never</strong> included in analytics
        event properties.
      </p>
      <h3>2.3 Server logs</h3>
      <p>
        Our backend API may log request metadata (timestamps, HTTP method, path,
        response status) for operational purposes. Logs are retained for 30 days
        and are not shared with third parties.
      </p>

      <h2>3. Opt-Out</h2>
      <p>
        Because Plausible does not use cookies or fingerprinting, standard
        browser &ldquo;Do Not Track&rdquo; signals and ad-blockers that block{' '}
        <code>plausible.io</code> will automatically prevent any analytics data
        from being sent. No additional opt-out action is required for most users.
      </p>
      <p>
        If you are located in a jurisdiction that requires an explicit opt-out
        mechanism beyond the cookieless baseline (e.g. certain US state laws),
        please contact us at the address below and we will honour your request.
      </p>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell, rent, or share personal data with third parties for
        marketing purposes. Aggregate, anonymised analytics data may be reviewed
        internally to improve the product.
      </p>

      <h2>5. Regional Regulations</h2>
      <p>
        We aim to comply with applicable privacy regulations including GDPR
        (EU/EEA), UK GDPR, and relevant US state privacy laws. If you have
        questions about your rights under a specific regulation, please contact
        us. We recommend consulting qualified legal counsel for jurisdiction-specific
        compliance questions.
      </p>

      <h2>6. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        announced via the application. Continued use after changes constitutes
        acceptance of the updated policy.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy-related enquiries, please open an issue on our public
        repository or reach out via our{' '}
        <a href="/support">support page</a>.
      </p>
    </main>
  )
}
