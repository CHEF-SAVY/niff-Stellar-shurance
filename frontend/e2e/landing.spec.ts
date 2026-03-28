/**
 * e2e: Landing page
 *
 * Verifies the landing page renders key content and navigation links work.
 */

import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders hero section and CTA links', async ({ page }) => {
    await page.goto('/')

    // Hero heading should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Navigation to quote page
    const quoteLink = page.getByRole('link', { name: /get.*quote|quote/i }).first()
    await expect(quoteLink).toBeVisible()
  })

  test('privacy policy link is present', async ({ page }) => {
    await page.goto('/')
    const privacyLink = page.getByRole('link', { name: /privacy policy/i })
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', '/privacy')
  })

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible()
    // Must mention Plausible
    await expect(page.getByText(/plausible/i)).toBeVisible()
  })
})
