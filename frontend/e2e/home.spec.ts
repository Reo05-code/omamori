import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('ページが正常にロードされる', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');

    // タイトルに「Omamori」と表示されていることを確認
    await expect(page).toHaveTitle(/Omamori/);
  });

  test('ダッシュボードページにアクセスできる', async ({ page }) => {
    // ダッシュボードページにアクセス
    await page.goto('/dashboard');

    // ページが正常にロードされることを確認
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
