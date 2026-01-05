import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('ページが正常にロードされる', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');

    // タイトルに「Omamori」と表示されていることを確認
    await expect(page).toHaveTitle(/Omamori/);
  });

  test('認証が必要なページはログインページにリダイレクトされる', async ({ page }) => {
    // 認証が必要なページにアクセス
    await page.goto('/dashboard');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/(login|$)/);
  });
});
