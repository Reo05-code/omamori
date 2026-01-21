import { test, expect } from '@playwright/test';

import { getWorkLogsUrl, loginAsAdmin, mockMemberships, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('作業ログ（Work Logs）/タブ', () => {
  test('リスク判定タブが表示できる（ページング含む）', async ({ page }) => {
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

    // 4. リスク判定取得 API（page に応じて返す内容を変える）
    let requestCount = 0;
    await page.route(
      `**/api/v1/work_sessions/${MOCK_SESSION_ID}/risk_assessments**`,
      async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();

        requestCount += 1;

        const url = new URL(route.request().url());
        const pageParam = url.searchParams.get('page') ?? '1';

        const data =
          pageParam === '2'
            ? [
                {
                  id: 2,
                  logged_at: new Date(1_000).toISOString(),
                  score: 20,
                  level: 'caution',
                  details: { reasons: [] },
                },
              ]
            : [
                {
                  id: 1,
                  logged_at: new Date(0).toISOString(),
                  score: 10,
                  level: 'safe',
                  details: { reasons: [] },
                },
              ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'x-total-count': '2',
            'x-total-pages': '2',
            'access-control-expose-headers': 'x-total-count, x-total-pages',
          },
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

    // Expected: 1件表示（最初のページ）
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText('page: 1')).toBeVisible();

    // Expected: 次へを押すと page=2 を取得して UI が更新される
    const nextButton = page.getByRole('button', { name: '次へ' });
    await expect(nextButton).toBeEnabled();

    await nextButton.click();
    await expect(page.getByText('page: 2')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // 2回以上APIが呼ばれている（ページングで再取得）
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });
});
