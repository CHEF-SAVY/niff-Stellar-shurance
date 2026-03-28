import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'en' | 'es')) {
    locale = routing.defaultLocale
  }

  const [common, policy, claims, wallet] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/policy.json`),
    import(`../messages/${locale}/claims.json`),
    import(`../messages/${locale}/wallet.json`),
  ])

  return {
    locale,
    messages: {
      common: common.default,
      policy: policy.default,
      claims: claims.default,
      wallet: wallet.default,
    },
  }
})
