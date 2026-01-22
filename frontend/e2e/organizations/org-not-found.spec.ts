import { test, expect } from '@playwright/test';

import { fulfillJson, getMembersUrl, loginAsAdmin, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';

const NOT_FOUND_ORG_ID = 999999;

test.describe('組織管理', () => {
  test('存在しない組織IDにアクセスした場合、エラー表示が出る', async ({ page }) => {
    await loginAsAdmin(page);
    await mockOrganizations(page, [MOCK_ORG]);

    await page.route(`**/api/v1/organizations/${NOT_FOUND_ORG_ID}/memberships`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await fulfillJson(route, 404, { status: 'error', errors: ['Not Found'] });
    });

    await page.goto(getMembersUrl(NOT_FOUND_ORG_ID));

    // ページがクラッシュせず、ユーザーに分かるエラーが表示される
    await expect(
      page.getByText('読み込みに失敗しました。時間をおいて再度お試しください。'),
    ).toBeVisible();
  });
});
