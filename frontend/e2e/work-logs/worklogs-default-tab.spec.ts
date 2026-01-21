// 作業ログ画面を開いたとき、最初から『基本情報』タブが選ばれていることを確認する

import { test, expect } from '@playwright/test';

import { getWorkLogsUrl, loginAsAdmin, mockMemberships, mockOrganizations } from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('作業ログ（Work Logs）/タブ', () => {
  test('タブのデフォルトは basic（クエリ無し）', async ({ page }) => {
    // 1. 管理者ユーザーでログイン済み状態を用意する
    await loginAsAdmin(page);

    // 2. 組織一覧（レイアウト等で参照される）
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. memberships（対象ユーザーが存在しないと userId がリセットされるため必須）
    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: false, id: null },
      },
    ]);

    // 4. /dashboard/organizations/:id/work_logs?userId=:userId を開く
    await page.goto(getWorkLogsUrl(MOCK_ORG_ID, MOCK_WORKER_ID));

    // 5. タブ表示が安定するまで待つ（見出しで判定）
    await expect(page.getByRole('heading', { name: '基本情報' })).toBeVisible();

    // Expected: basic が選択状態
    await expect(page.getByRole('button', { name: '基本情報' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: '移動履歴' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: 'リスク判定' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );

    // Expected: userIdがあるので基本情報が表示される
    await expect(page.getByText('メールアドレス: worker@example.com')).toBeVisible();
  });
});
