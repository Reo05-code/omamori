import { test, expect } from '@playwright/test';

import { getDashboardUrl, loginAsAdmin, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';

test.describe('組織管理', () => {
  test('組織一覧が表示される（1件以上）', async ({ page }) => {
    await loginAsAdmin(page);
    await mockOrganizations(page, [MOCK_ORG]);

    await page.goto(getDashboardUrl());

    // 組織がある場合、オンボーディング（組織作成モーダル）は開かれない
    await expect(page.getByRole('dialog', { name: '組織を作成' })).toHaveCount(0);

    // サイドバーが組織取得を完了し、メニューが表示される
    const sidebarNav = page.getByRole('navigation', { name: 'サイドバー ナビゲーション' });
    await expect(sidebarNav.getByRole('link', { name: 'メンバー' })).toBeVisible();
  });

  test('組織一覧が0件の場合、作成導線（モーダル）が表示される', async ({ page }) => {
    await loginAsAdmin(page);
    await mockOrganizations(page, []);

    await page.goto(getDashboardUrl());

    const dialog = page.getByRole('dialog', { name: '組織を作成' });
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel('組織名')).toBeVisible();
    await expect(dialog.getByRole('button', { name: '作成する' })).toBeVisible();
  });
});
