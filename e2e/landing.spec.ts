import { test, expect } from './fixtures';

test('landing page renders and navigation links exist', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Soroban');
  await expect(page.locator('a[href="/bridge"]').first()).toBeVisible();
  await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible();
});

test('Start Bridging link navigates to /bridge', async ({ page }) => {
  await page.goto('/');
  await page.locator('text=Start Bridging').first().click();
  await expect(page).toHaveURL('/bridge');
});
