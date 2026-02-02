import { test, expect } from '@playwright/test';

import { fulfillJson } from '../helpers';

test.describe('認証・ナビゲーション', () => {
  test('未認証でルートにアクセスするとログインへ遷移する', async ({ page }) => {
    await page.route('**/api/v1/auth/validate_token', async (route) => {
      await fulfillJson(route, 401, { status: 'error', errors: ['Unauthorized'] });
    });

    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Omamori' })).toBeVisible();
  });
});
