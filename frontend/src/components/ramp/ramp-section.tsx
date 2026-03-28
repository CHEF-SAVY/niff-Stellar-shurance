import { getConfig } from '@/config/env'
import { RampButton } from './ramp-button'
import { headers } from 'next/headers'

async function fetchRampUrl(apiUrl: string, region: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiUrl}/ramp/config`, {
      headers: { 'x-region': region },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { url?: string }
    return data.url ?? null
  } catch {
    // ramp failure must not block core flows
    return null
  }
}

export async function RampSection() {
  const { rampEnabled, apiUrl } = getConfig()
  if (!rampEnabled) return null

  const headersList = await headers()
  const region = headersList.get('x-region') ?? headersList.get('cf-ipcountry') ?? ''

  const rampUrl = await fetchRampUrl(apiUrl, region)
  if (!rampUrl) return null

  return <RampButton rampUrl={rampUrl} />
}
