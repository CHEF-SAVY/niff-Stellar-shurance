import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { routing } from '@/i18n/routing'
import { inter, ibmPlexMono } from '@/lib/fonts'

import '../globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'NiffyInsur - Decentralized Insurance for Stellar Network',
  description:
    'Parametric insurance powered by DAO governance. Get coverage for smart contract risks with transparent, community-driven claim voting on the Stellar blockchain.',
  metadataBase: new URL('https://niffyinsur.com'),
}

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'es')) {
    notFound()
  }

  const messages = await getMessages()
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang={locale} className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <head nonce={nonce}>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="system" storageKey="niffyinsur-theme">
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
