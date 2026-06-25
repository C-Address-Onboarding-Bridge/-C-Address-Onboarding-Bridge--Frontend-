import { test, expect } from './fixtures';

test('dashboard shows wallet connection prompt when not connected', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('text=Connect Your Wallet')).toBeVisible();
  await expect(page.locator('button:has-text("Connect Freighter")')).toBeVisible();
});
