import type { Metadata } from 'next'
import { SettingsPanel } from '@/components/settings/settings-panel'

export const metadata: Metadata = {
  title: 'Settings — NiffyInsur',
}

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <SettingsPanel />
    </main>
  )
}
