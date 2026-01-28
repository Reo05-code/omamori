import { test, expect } from '@playwright/test';

import { getWorkLogsUrl, loginAsAdmin, mockMemberships, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('作業ログ（Work Logs）/タブ', () => {
  test('リスク判定タブが表示できる', async ({ page }) => {
    // 1. 管理者ユーザーでログイン済み状態を用意する
    await loginAsAdmin(page);

    // 2. 組織一覧
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. memberships: active session あり
    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: true, id: MOCK_SESSION_ID },
      },
    ]);

    // 4. リスク判定取得 API
    await page.route(
      new RegExp(`/api/v1/work_sessions/${MOCK_SESSION_ID}/risk_assessments`),
      async (route) => {
        if (route.request().method() !== 'GET') return route.continue();

        const data = [
          {
            id: 1,
            logged_at: new Date(0).toISOString(),
            score: 60,
            level: 'danger',
            details: { reasons: ['sos_trigger'] },
          },
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      },
    );

    // 5. /dashboard/organizations/:id/work_logs?userId=:userId&tab=risk_assessments を開く
    await page.goto(getWorkLogsUrl(MOCK_ORG_ID, MOCK_WORKER_ID, 'risk_assessments'));

    // Expected: タブ/見出しが表示される
    await expect(page.getByRole('heading', { name: 'リスク判定' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'リスク判定' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // Expected: 1件表示される
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // Expected: リスクレベルが表示される
    await expect(page.getByText('危険')).toBeVisible(); // level: 'danger' → '危険'
  });
});
