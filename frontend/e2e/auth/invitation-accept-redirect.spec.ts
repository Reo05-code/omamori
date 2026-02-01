import { test, expect } from '@playwright/test';
import { MOCK_WORKER } from '../fixtures/users';
import { fulfillJson, mockValidateToken } from '../helpers';

const TOKEN = '11111111-2222-3333-4444-555555555555';

test('招待受諾の既存メンバー時にメッセージ表示とリダイレクトが行われる', async ({ page }) => {
  await mockValidateToken(page, MOCK_WORKER);

  await page.route('**/api/v1/invitations/*/preview', async (route) => {
    await fulfillJson(route, 200, {
      status: 'pending',
      organization_name: 'テスト組織',
      organization_id: 1,
      role: 'worker',
      invited_email: 'worker@example.com',
    });
  });

  await page.route('**/api/v1/invitations/accept', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await fulfillJson(route, 409, {
      error: 'あなたは既にこの組織のメンバーです',
    });
  });

  await page.goto(`/accept-invitation?token=${TOKEN}`);

  await page.getByRole('button', { name: '招待を受け入れる' }).click();

  await expect(
    page.getByText('あなたは既にこの組織のメンバーです。ダッシュボードへ遷移します。'),
  ).toBeVisible();

  await expect(page).toHaveURL(/\/worker/, { timeout: 5000 });
});
