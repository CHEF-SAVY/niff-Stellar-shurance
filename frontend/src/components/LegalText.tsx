/**
 * LegalText — wraps insurance legal copy rendered via next-intl Trans.
 *
 * TRANSLATION REVIEW: strings rendered through this component require
 * legal sign-off before shipping to a new locale. Tag new locales with
 * `// [LEGAL-REVIEW-PENDING]` in the corresponding messages JSON until
 * reviewed.
 */
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

export function LegalTermsNotice() {
  const t = useTranslations('common.legal')

  return (
    <p className="text-xs text-muted-foreground">
      {t.rich('termsNotice', {
        termsLink: (chunks) => (
          <Link href="/terms" className="underline hover:text-foreground">
            {chunks}
          </Link>
        ),
        privacyLink: (chunks) => (
          <Link href="/privacy" className="underline hover:text-foreground">
            {chunks}
          </Link>
        ),
      })}
    </p>
  )
}
