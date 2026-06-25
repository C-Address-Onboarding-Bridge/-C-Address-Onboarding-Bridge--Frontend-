import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Bridge', path: '/bridge' },
  { name: 'CEX', path: '/cex' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Onramp', path: '/onramp' }
];

test.describe('Visual Regression Tests', () => {
  for (const { name, path } of pages) {
    test(`Visual test for ${name}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await percySnapshot(page, name);
    });
  }
});
