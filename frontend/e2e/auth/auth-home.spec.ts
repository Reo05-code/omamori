import { test, expect } from '@playwright/test';

import { fulfillJson } from '../helpers';

test.describe('認証・ナビゲーション', () => {
  test('ホームが表示される', async ({ page }) => {
    await page.route('**/health', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();

      await fulfillJson(route, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: 'test',
      });
    });

    await page.goto('/');

    await expect(page).toHaveTitle(/Omamori/);
    await expect(page.getByRole('heading', { name: 'Rails + Next.js' })).toBeVisible();
  });
});
