import { test, expect } from '@playwright/test';

// 共通のレスポンスデータ定義
const MOCK_USER = {
  id: 1,
  email: 'admin@example.com',
  name: 'Admin',
};

const ORG_ID = 1;
const WORKER_ID = 10;
const SESSION_ID = 123;

test.describe('Admin リモート開始/終了トグル', () => {
  // テスト間で共有する状態変数を定義
  let isSessionActive = false;

  test.beforeEach(async ({ page }) => {
    // 状態を初期化 (テスト間の干渉を防ぐ)
    isSessionActive = false;

    // 1. 認証トークン検証
    await page.route('**/api/v1/auth/validate_token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: MOCK_USER }),
      });
    });

    // 2. 組織一覧
    await page.route('**/api/v1/organizations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: ORG_ID, name: 'Org' }]),
      });
    });

    // 3. メンバー一覧
    await page.route(`**/api/v1/organizations/${ORG_ID}/memberships`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            user_id: WORKER_ID,
            email: 'worker@example.com',
            role: 'worker',
            // ここで動的な変数を参照してレスポンスを決定
            active_work_session: {
              active: isSessionActive,
              id: isSessionActive ? SESSION_ID : null,
            },
          },
        ]),
      });
    });
  });

  test('開始→状態更新→終了のフロー', async ({ page }) => {
    // 開始API
    await page.route('**/api/v1/work_sessions', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      // サーバー側の状態変化をシミュレート
      isSessionActive = true;

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SESSION_ID,
          status: 'in_progress',
        }),
      });
    });

    // 終了API (POST)
    await page.route(`**/api/v1/work_sessions/${SESSION_ID}/finish`, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      // サーバー側の状態変化をシミュレート
      isSessionActive = false;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SESSION_ID,
          status: 'completed',
        }),
      });
    });

    await page.goto(`/dashboard/organizations/${ORG_ID}/members`);

    // 初期状態確認
    await expect(page.getByText('停止')).toBeVisible();

    // 開始操作
    await page.getByTestId(`remote-toggle-${1}`).click(); // IDは適宜調整
    await page.getByRole('button', { name: '開始' }).click();

    // 状態更新確認 (Re-fetchが走り、membershipsモックが active=true を返す)
    await expect(page.getByText('稼働中')).toBeVisible();

    // 終了操作
    await page.getByTestId(`remote-toggle-${1}`).click();
    await page.getByRole('button', { name: '終了' }).click();

    // 終了確認
    await expect(page.getByText('停止')).toBeVisible();
  });

  test('開始APIが失敗した場合はエラーが出る', async ({ page }) => {
    // エラー時のモック (memberships等はbeforeEachで定義済み)
    await page.route('**/api/v1/work_sessions', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      // 失敗するため isSessionActive は true にしない
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: ['Internal Server Error'] }),
      });
    });

    await page.goto(`/dashboard/organizations/${ORG_ID}/members`);
    await expect(page.getByText('停止')).toBeVisible();

    await page.getByTestId(`remote-toggle-${1}`).click();
    await page.getByRole('button', { name: '開始' }).click();

    // エラーメッセージの確認
    await expect(
      page.getByText('開始に失敗しました。時間をおいて再度お試しください。'),
    ).toBeVisible();

    await expect(page.getByText('停止')).toBeVisible();
  });
});
