import { test, expect } from '@playwright/test';

import { getMembersUrl, loginAsAdmin, mockMemberships, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('組織管理', () => {
  test('組織を選択してメンバー一覧に遷移できる', async ({ page }) => {
    await loginAsAdmin(page);
    await mockOrganizations(page, [MOCK_ORG]);

    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: false, id: null },
      },
    ]);

    await page.goto(getMembersUrl(MOCK_ORG_ID));

    await expect(page).toHaveURL(getMembersUrl(MOCK_ORG_ID));
    await expect(page.getByRole('heading', { name: 'メンバー一覧' })).toBeVisible();

    // 一覧が描画されていること（最低限）
    await expect(page.getByText('待機中')).toBeVisible();
  });
});
