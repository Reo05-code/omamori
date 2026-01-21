import { test, expect } from '@playwright/test';

import { getWorkLogsUrl, loginAsAdmin, mockMemberships, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('作業ログ（Work Logs）/タブ', () => {
  test('安全ログ/リスク判定 API が失敗した場合のエラーハンドリング（切替で復帰できる）', async ({
    page,
  }) => {
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

    // 4. safety_logs: 1回目は403、2回目は成功（タブ切替で復帰）
    let safetyCalls = 0;
    await page.route(`**/api/v1/work_sessions/${MOCK_SESSION_ID}/safety_logs**`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();

      safetyCalls += 1;
      if (safetyCalls === 1) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ errors: ['Forbidden'] }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            work_session_id: MOCK_SESSION_ID,
            battery_level: 80,
            trigger_type: 'heartbeat',
            latitude: 35.0,
            longitude: 139.0,
            logged_at: new Date(0).toISOString(),
          },
        ]),
      });
    });

    // 5. risk_assessments: 1回目は404、2回目は成功（再試行で復帰）
    let riskCalls = 0;
    await page.route(
      `**/api/v1/work_sessions/${MOCK_SESSION_ID}/risk_assessments**`,
      async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();

        riskCalls += 1;
        if (riskCalls === 1) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ errors: ['Not Found'] }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'x-total-count': '1',
            'x-total-pages': '1',
            'access-control-expose-headers': 'x-total-count, x-total-pages',
          },
          body: JSON.stringify([
            {
              id: 1,
              logged_at: new Date(0).toISOString(),
              score: 10,
              level: 'safe',
              details: { reasons: [] },
            },
          ]),
        });
      },
    );

    // 6. safety_logs タブで 403 エラーが出る
    await page.goto(getWorkLogsUrl(MOCK_ORG_ID, MOCK_WORKER_ID, 'safety_logs'));
    await expect(page.getByRole('heading', { name: '移動履歴' })).toBeVisible();
    await expect(page.getByText('権限がありません')).toBeVisible();

    // 7. タブ切替で復帰できる（basic → safety_logs）
    await page.getByRole('button', { name: '基本情報' }).click();
    await expect(page.getByRole('heading', { name: '基本情報' })).toBeVisible();

    await page.getByRole('button', { name: '移動履歴' }).click();
    await expect(page.getByRole('heading', { name: '移動履歴' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // 8. risk_assessments タブで 404 エラーが出る
    await page.getByRole('button', { name: 'リスク判定' }).click();
    await expect(page.getByRole('heading', { name: 'リスク判定' })).toBeVisible();
    await expect(page.getByText('見つかりません')).toBeVisible();

    // 9. 再試行で復帰できる
    await page.getByRole('button', { name: '再試行' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    expect(safetyCalls).toBeGreaterThanOrEqual(2);
    expect(riskCalls).toBeGreaterThanOrEqual(2);
  });
});
