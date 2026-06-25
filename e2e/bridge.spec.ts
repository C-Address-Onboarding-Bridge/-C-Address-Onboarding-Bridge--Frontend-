import { test, expect } from './fixtures';

const C_ADDRESS = 'CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A';

test('bridge page shows form', async ({ page }) => {
  await page.goto('/bridge');
  await expect(page.locator('h1')).toContainText('G');
  await expect(page.locator('input').first()).toBeVisible();
});

test('bridge form shows validation error for invalid C-address', async ({ page }) => {
  await page.goto('/bridge');
  const inputs = page.locator('input');
  await inputs.nth(0).fill('GABC123456789012345678901234567890123456789012345678901234');
  await inputs.nth(1).fill('INVALID');
  await expect(page.locator('text=Invalid C-address')).toBeVisible();
});

test('bridge form proceed button disabled when empty', async ({ page }) => {
  await page.goto('/bridge');
  await expect(page.locator('button:has-text("Review Bridge Transaction")')).toBeDisabled();
});

test('bridge form advances to review when valid', async ({ page }) => {
  await page.goto('/bridge');
  const inputs = page.locator('input');
  await inputs.nth(0).fill('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN');
  await inputs.nth(1).fill(C_ADDRESS);
  await inputs.nth(2).fill('10');
  await page.locator('button:has-text("Review Bridge Transaction")').click();
  await expect(page.locator('text=Review Transaction')).toBeVisible();
});
