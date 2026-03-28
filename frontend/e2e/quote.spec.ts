/**
 * e2e: Quote submission flow
 *
 * Mocks the backend API so tests are deterministic and fast.
 * Does not require a running backend or testnet connection.
 */

import { test, expect } from '@playwright/test'
import { mockQuoteApi } from './fixtures/api'

test.describe('Quote flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockQuoteApi(page)
  })

  test('quote page renders the form', async ({ page }) => {
    await page.goto('/quote')

    await expect(page.getByRole('heading', { name: /get insurance quote/i })).toBeVisible()
    await expect(page.getByLabel(/contract address/i)).toBeVisible()
    await expect(page.getByLabel(/coverage amount/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /get quote/i })).toBeVisible()
  })

  test('submitting the form shows a quote preview', async ({ page }) => {
    await page.goto('/quote')

    // Fill in required fields
    await page.getByLabel(/contract address/i).fill(
      'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    )

    // Submit
    await page.getByRole('button', { name: /get quote/i }).click()

    // Quote preview should appear with premium
    await expect(page.getByText(/12\.5.*xlm|xlm.*12\.5/i)).toBeVisible({ timeout: 10_000 })
  })

  test('purchase policy link navigates to policy page with quoteId', async ({ page }) => {
    await page.goto('/quote')

    await page.getByLabel(/contract address/i).fill(
      'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    )
    await page.getByRole('button', { name: /get quote/i }).click()

    // Wait for quote to appear
    await expect(page.getByText(/12\.5.*xlm|xlm.*12\.5/i)).toBeVisible({ timeout: 10_000 })

    const purchaseLink = page.getByRole('link', { name: /purchase policy/i })
    await expect(purchaseLink).toBeVisible()
    await expect(purchaseLink).toHaveAttribute('href', /\/policy\?quoteId=/)
  })
})
