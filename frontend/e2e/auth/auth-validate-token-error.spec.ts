import { test, expect } from '@playwright/test';

import { fulfillJson, getDashboardUrl } from '../helpers';

test.describe('認証・ナビゲーション', () => {
  test('トークン検証 API が失敗した場合のエラー表示', async ({ page }) => {
    await page.route('**/api/v1/auth/validate_token', async (route) => {
      await fulfillJson(route, 500, { status: 'error', errors: ['Internal Server Error'] });
    });

    await page.goto(getDashboardUrl());

    const authErrorAlert = page
      .locator('[role="alert"]')
      .filter({ hasText: '認証の確認に失敗しました' });

    await expect(authErrorAlert).toBeVisible();
    await expect(page.getByRole('button', { name: '再読み込み' })).toBeVisible();
  });
});
