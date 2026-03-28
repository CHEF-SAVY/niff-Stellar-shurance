'use client'

import { useEffect } from 'react'
import { trackLandingView } from '@/lib/analytics'

/** Fires the landing_view analytics event once on mount. */
export function LandingTracker() {
  useEffect(() => {
    trackLandingView()
  }, [])
  return null
}
