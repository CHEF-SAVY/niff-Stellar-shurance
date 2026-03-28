import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // Default locale has no prefix: / instead of /en/
  localePrefix: 'as-needed',
})
