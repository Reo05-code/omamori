import { test, expect } from '@playwright/test';

import {
  getWorkLogsUrl,
  loginAsAdmin,
  mockMemberships,
  mockOrganizations,
  mockSafetyLogs,
} from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('作業ログ（Work Logs）/タブ', () => {
  test('安全ログ（移動履歴）タブが表示できる', async ({ page }) => {
    // 1. 管理者ユーザーでログイン済み状態を用意する
    await loginAsAdmin(page);

    // 2. 組織一覧
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. memberships: active session がある状態（これが無いと safety_logs API が呼ばれない）
    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: true, id: MOCK_SESSION_ID },
      },
    ]);

    // 4. 安全ログ取得 API が成功する状況を用意する
    await mockSafetyLogs(page, MOCK_SESSION_ID, () => [
      {
        id: 1,
        work_session_id: MOCK_SESSION_ID,
        battery_level: 80,
        trigger_type: 'heartbeat',
        latitude: 35.0,
        longitude: 139.0,
        logged_at: new Date(0).toISOString(),
      },
    ]);

    // 5. /dashboard/organizations/:id/work_logs?userId=:userId&tab=safety_logs を開く
    await page.goto(getWorkLogsUrl(MOCK_ORG_ID, MOCK_WORKER_ID, 'safety_logs'));

    // Expected: タブ/見出しが表示される
    await expect(page.getByRole('heading', { name: '移動履歴' })).toBeVisible();
    await expect(page.getByRole('button', { name: '移動履歴' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // Expected: セッションIDが表示される
    await expect(page.getByText(`作業セッションID: ${MOCK_SESSION_ID}`)).toBeVisible();

    // Expected: テーブルが表示される（内容は最小限）
    await expect(page.getByRole('columnheader', { name: '記録日時' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });
});
