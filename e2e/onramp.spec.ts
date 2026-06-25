import { test, expect } from './fixtures';

test('onramp page shows provider selection', async ({ page }) => {
  await page.goto('/onramp');
  await expect(page.locator('h1')).toContainText('Fiat Onramp');
  await expect(page.locator('text=Moonpay')).toBeVisible();
  await expect(page.locator('text=Transak')).toBeVisible();
});

test('onramp selecting Transak highlights it', async ({ page }) => {
  await page.goto('/onramp');
  await page.locator('button:has-text("Transak")').click();
  await expect(page.locator('button:has-text("Continue with Transak")')).toBeVisible();
});
