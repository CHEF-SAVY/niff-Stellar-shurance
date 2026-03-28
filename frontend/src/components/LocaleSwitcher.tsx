'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { routing } from '@/i18n/routing'
import { usePathname, useRouter } from '@/i18n/navigation'

const LABELS: Record<string, string> = { en: 'English', es: 'Español' }

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => {
      router.replace(pathname, { locale: e.target.value })
    })
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      disabled={isPending}
      aria-label="Select language"
      className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LABELS[l] ?? l.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
