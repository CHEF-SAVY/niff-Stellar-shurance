/**
 * Typed, validated environment configuration.
 *
 * All NEXT_PUBLIC_* variables are validated at module load time using zod.
 * A missing or malformed required variable throws at build time (or on first
 * import in dev), preventing silent undefined values from reaching production.
 *
 * Variable ownership:
 *   NEXT_PUBLIC_API_URL          — backend team, updated on each deployment
 *   NEXT_PUBLIC_SOROBAN_RPC_URL  — infra team, per-network
 *   NEXT_PUBLIC_HORIZON_URL      — infra team, per-network
 *   NEXT_PUBLIC_CONTRACT_ID      — contracts team, updated after each deploy
 *   NEXT_PUBLIC_IPFS_GATEWAY     — infra team
 *   NEXT_PUBLIC_NETWORK          — set per environment (testnet | public)
 *   NEXT_PUBLIC_CAPTCHA_SITE_KEY — security team
 *   NEXT_PUBLIC_CAPTCHA_PROVIDER — security team (turnstile | hcaptcha)
 *
 * Rotation: when backend deployment-registry.json changes contract addresses,
 * update NEXT_PUBLIC_CONTRACT_ID and redeploy the frontend.
 */

import { z } from 'zod'

const envSchema = z.object({
  /** Backend REST API base URL — no trailing slash */
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),

  /** Soroban RPC endpoint for the active network */
  NEXT_PUBLIC_SOROBAN_RPC_URL: z
    .string()
    .url('NEXT_PUBLIC_SOROBAN_RPC_URL must be a valid URL')
    .default('https://soroban-testnet.stellar.org'),

  /** Horizon REST endpoint for the active network */
  NEXT_PUBLIC_HORIZON_URL: z
    .string()
    .url('NEXT_PUBLIC_HORIZON_URL must be a valid URL')
    .default('https://horizon-testnet.stellar.org'),

  /** Deployed niffyinsure contract ID for the active network */
  NEXT_PUBLIC_CONTRACT_ID: z
    .string()
    .min(1, 'NEXT_PUBLIC_CONTRACT_ID must not be empty')
    .default(''),

  /** IPFS gateway base URL used to resolve CIDs — no trailing slash */
  NEXT_PUBLIC_IPFS_GATEWAY: z
    .string()
    .url('NEXT_PUBLIC_IPFS_GATEWAY must be a valid URL')
    .default('https://ipfs.io/ipfs'),

  /**
   * Active Stellar network.
   * - "testnet" → testnet RPC / Horizon / explorer
   * - "public"  → mainnet RPC / Horizon / explorer
   */
  NEXT_PUBLIC_NETWORK: z.enum(['testnet', 'public']).default('testnet'),

  /** Captcha site key (public, safe to expose) */
  NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().default(''),

  /** Captcha provider */
  NEXT_PUBLIC_CAPTCHA_PROVIDER: z.enum(['turnstile', 'hcaptcha']).default('turnstile'),
})

type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
    NEXT_PUBLIC_HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL,
    NEXT_PUBLIC_CONTRACT_ID: process.env.NEXT_PUBLIC_CONTRACT_ID,
    NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    NEXT_PUBLIC_CAPTCHA_PROVIDER: process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER,
  })

  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${messages}`)
  }

  // Dev-time consistency warning: mainnet contract ID looks like testnet config
  if (
    process.env.NODE_ENV === 'development' &&
    result.data.NEXT_PUBLIC_NETWORK === 'public' &&
    result.data.NEXT_PUBLIC_SOROBAN_RPC_URL.includes('testnet')
  ) {
    console.warn(
      '[env] Warning: NEXT_PUBLIC_NETWORK=public but NEXT_PUBLIC_SOROBAN_RPC_URL points at testnet.',
    )
  }

  return result.data
}

const env = parseEnv()

/**
 * Returns the validated, typed environment configuration.
 * Use this instead of accessing process.env directly in hooks and API clients.
 *
 * @example
 * import { getConfig } from '@/config/env'
 * const { apiUrl, network } = getConfig()
 */
export function getConfig() {
  return {
    /** Backend REST API base URL */
    apiUrl: env.NEXT_PUBLIC_API_URL,

    /** Soroban RPC URL for the active network */
    sorobanRpcUrl: env.NEXT_PUBLIC_SOROBAN_RPC_URL,

    /** Horizon REST URL for the active network */
    horizonUrl: env.NEXT_PUBLIC_HORIZON_URL,

    /** Deployed contract ID for the active network */
    contractId: env.NEXT_PUBLIC_CONTRACT_ID,

    /** IPFS gateway base URL */
    ipfsGateway: env.NEXT_PUBLIC_IPFS_GATEWAY,

    /** Active Stellar network */
    network: env.NEXT_PUBLIC_NETWORK,

    /** Captcha site key */
    captchaSiteKey: env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,

    /** Captcha provider */
    captchaProvider: env.NEXT_PUBLIC_CAPTCHA_PROVIDER,

    /** Stellar block explorer base URL for the active network */
    explorerBase:
      env.NEXT_PUBLIC_NETWORK === 'public'
        ? 'https://stellar.expert/explorer/public/tx'
        : 'https://stellar.expert/explorer/testnet/tx',
  } as const
}
