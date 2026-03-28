/**
 * e2e: Claims dashboard (read-only rendering)
 *
 * Verifies the claims board renders correctly with mocked API data.
 * No wallet connection required for read-only view.
 */

import { test, expect } from '@playwright/test'
import { mockClaimsApi } from './fixtures/api'

test.describe('Claims dashboard (read-only)', () => {
  test.beforeEach(async ({ page }) => {
    await mockClaimsApi(page)
  })

  test('claims page renders the board heading', async ({ page }) => {
    await page.goto('/claims')

    await expect(page.getByRole('heading', { name: /claims board/i })).toBeVisible()
  })

  test('claims list renders mocked claims', async ({ page }) => {
    await page.goto('/claims')

    // Wait for claims to load (loading spinner disappears)
    await expect(page.getByRole('status', { name: /loading claims/i })).not.toBeVisible({
      timeout: 10_000,
    })

    // At least one claim should be visible
    await expect(page.getByText(/smart contract exploit/i)).toBeVisible({ timeout: 10_000 })
  })

  test('filter bar is present', async ({ page }) => {
    await page.goto('/claims')

    // FilterBar should render — look for a status filter or search input
    await expect(page.locator('[data-testid="filter-bar"], form, [role="search"]').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('no PII visible in claims list', async ({ page }) => {
    await page.goto('/claims')

    await expect(page.getByRole('status', { name: /loading claims/i })).not.toBeVisible({
      timeout: 10_000,
    })

    const content = await page.textContent('body')
    // Wallet addresses (G... 56 chars) should not appear in the read-only board
    expect(content).not.toMatch(/G[A-Z2-7]{55}/)
  })
})
