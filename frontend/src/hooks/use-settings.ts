'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from '@/lib/settings-store'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  // Sync to localStorage on every change
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      // Emit privacy-safe telemetry event (no PII, no secrets)
      if (prev.telemetryEnabled && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('niffyinsur:settings_change', {
            detail: { key, network: next.network },
          })
        )
      }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem('niffyinsur-settings-v1')
    setSettings(loadSettings())
  }, [])

  return { settings, update, reset }
}
