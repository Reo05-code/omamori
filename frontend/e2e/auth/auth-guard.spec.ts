import { test, expect } from '@playwright/test';

import { fulfillJson, getDashboardUrl } from '../helpers';

test.describe('認証・ナビゲーション', () => {
  test('未認証でダッシュボードにアクセスした場合の挙動', async ({ page }) => {
    await page.route('**/api/v1/auth/validate_token', async (route) => {
      await fulfillJson(route, 401, { status: 'error', errors: ['Unauthorized'] });
    });

    // 画面側の想定外のAPI呼び出しがあっても壊れないようモック
    await page.route('**/api/v1/organizations', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await fulfillJson(route, 200, []);
    });

    await page.goto(getDashboardUrl());

    const loginMessage = page.getByText('ログインしてください');
    const loginHeading = page.getByRole('heading', { name: 'Omamoriログイン' });

    await expect
      .poll(async () => {
        const messageVisible = await loginMessage.isVisible().catch(() => false);
        const headingVisible = await loginHeading.isVisible().catch(() => false);
        return messageVisible || headingVisible;
      })
      .toBe(true);

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
