/**
 * Axe accessibility checks for targeted routes.
 * Fails CI on any critical violations.
 *
 * Requires: @axe-core/playwright, @playwright/test
 * Install:  npm install -D @axe-core/playwright @playwright/test
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const ROUTES = [
  { name: 'home',   path: '/' },
  { name: 'quote',  path: '/quote' },
  { name: 'policy', path: '/policy' },
  { name: 'claims', path: '/claims' },
];

for (const route of ROUTES) {
  test(`no critical axe violations on ${route.name} page`, async ({ page }) => {
    await page.goto(`${BASE_URL}${route.path}`);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');

    expect(
      critical,
      `Critical axe violations on ${route.path}:\n` +
        critical
          .map((v) => `  [${v.id}] ${v.description}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
          .join('\n'),
    ).toHaveLength(0);
  });
}

test('claim wizard is keyboard operable', async ({ page }) => {
  await page.goto(`${BASE_URL}/policy/1/claim`);

  // Tab to the first interactive element and verify focus is visible
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});

test('vote page has no critical axe violations', async ({ page }) => {
  await page.goto(`${BASE_URL}/claims`);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical).toHaveLength(0);
});
