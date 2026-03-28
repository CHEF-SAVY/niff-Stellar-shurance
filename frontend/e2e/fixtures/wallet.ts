/**
 * Wallet mock fixture.
 *
 * Injects a minimal window.freighter / window.xBull stub before each test so
 * wallet-dependent flows work without a real browser extension.
 *
 * The mock address is a valid-format Stellar G-address that will never hold
 * real funds on mainnet.
 */

import { Page } from '@playwright/test'

export const MOCK_WALLET_ADDRESS =
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'

/**
 * Inject a Freighter-compatible wallet stub into the page context.
 * Call this before navigating to any page that uses wallet APIs.
 */
export async function injectWalletMock(page: Page): Promise<void> {
  await page.addInitScript((address) => {
    // Minimal Freighter API surface used by the app
    const freighter = {
      isConnected: () => Promise.resolve(true),
      getPublicKey: () => Promise.resolve(address),
      getNetwork: () => Promise.resolve('TESTNET'),
      getNetworkDetails: () =>
        Promise.resolve({
          network: 'TESTNET',
          networkUrl: 'https://soroban-testnet.stellar.org',
          networkPassphrase: 'Test SDF Network ; September 2015',
        }),
      signTransaction: (_xdr: string) =>
        Promise.resolve(`mock-signed-xdr-${Date.now()}`),
    }
    // @ts-expect-error injecting into window
    window.freighter = freighter
    // @ts-expect-error injecting into window
    window.freighterApi = freighter
  }, MOCK_WALLET_ADDRESS)
}

/**
 * Inject a stub that simulates a disconnected wallet (no extension present).
 */
export async function injectNoWalletMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // @ts-expect-error injecting into window
    delete window.freighter
    // @ts-expect-error injecting into window
    delete window.freighterApi
  })
}
