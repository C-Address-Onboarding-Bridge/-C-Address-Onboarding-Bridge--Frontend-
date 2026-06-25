import { test, expect } from './fixtures';

test('cex page shows exchange selection', async ({ page }) => {
  await page.goto('/cex');
  await expect(page.locator('h1')).toContainText('CEX Withdrawal');
  await expect(page.locator('text=Binance')).toBeVisible();
});

test('cex network selection works', async ({ page }) => {
  await page.goto('/cex');
  await page.locator('button:has-text("Ethereum")').click();
  await expect(page.locator('button:has-text("Ethereum")').first()).toBeVisible();
});
