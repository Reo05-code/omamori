import { test, expect } from '@playwright/test';

import { getWorkLogsUrl, loginAsAdmin, mockMemberships, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('作業ログ（Work Logs）/タブ', () => {
  test('タブ指定が不正値の場合は basic にフォールバック', async ({ page }) => {
    // 1. 管理者ユーザーでログイン済み状態を用意する
    await loginAsAdmin(page);

    // 2. 組織一覧
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. memberships
    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: false, id: null },
      },
    ]);

    // 4. /dashboard/organizations/:id/work_logs?userId=:userId&tab=invalid を開く
    await page.goto(getWorkLogsUrl(MOCK_ORG_ID, MOCK_WORKER_ID, 'invalid'));

    // Expected: basic が選択状態になり、エラー表示にならない
    await expect(page.getByRole('heading', { name: '基本情報' })).toBeVisible();
    await expect(page.getByRole('button', { name: '基本情報' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // 想定されるエラー文言が出ていないこと（主要4種）
    await expect(page.getByText('権限がありません')).toHaveCount(0);
    await expect(page.getByText('見つかりません')).toHaveCount(0);
    await expect(page.getByText('ネットワークエラーが発生しました')).toHaveCount(0);
    await expect(
      page.getByText('読み込みに失敗しました。時間をおいて再度お試しください。'),
    ).toHaveCount(0);
  });
});
