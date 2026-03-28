'use client'

import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    // Initialise from current state (SSR-safe)
    setOffline(!navigator.onLine)

    const handleOffline = () => setOffline(true)
    const handleOnline = () => setOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-[200] flex items-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-yellow-950 pt-safe"
      style={{ paddingTop: `calc(0.5rem + env(safe-area-inset-top, 0px))` }}
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You&apos;re offline. Some features may be unavailable.</span>
    </div>
  )
}
