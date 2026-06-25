import { test as base, Page } from '@playwright/test';

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).freighter = {
        isConnected: () => Promise.resolve(false),
        getPublicKey: () => Promise.resolve(''),
        signTransaction: () => Promise.resolve(''),
        getNetwork: () => Promise.resolve('TESTNET'),
        getNetworkDetails: () => Promise.resolve({ networkPassphrase: 'Test SDF Network ; September 2015' }),
      };
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
