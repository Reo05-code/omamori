import { test, expect } from '@playwright/test';

import {
  fulfillJson,
  getAlertsUrl,
  getMembersUrl,
  loginAsAdmin,
  mockMemberships,
  mockOrganizations,
} from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from '../fixtures/users';

function createGate() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const MEMBERSHIP_ID = 1;

test.describe('横断・回復性テスト', () => {
  test('ネットワーク遅延時にローディングが表示される', async ({ page }) => {
    await loginAsAdmin(page);
    await mockOrganizations(page, [MOCK_ORG]);

    // ---- Members: memberships を遅延させて「読み込み中です...」が出ることを確認 ----
    const membersGate = createGate();

    await page.route(`**/api/v1/organizations/${MOCK_ORG_ID}/memberships`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();

      await membersGate.promise;
      await fulfillJson(route, 200, [
        {
          id: MEMBERSHIP_ID,
          user_id: MOCK_WORKER_ID,
          email: 'worker@example.com',
          role: 'worker',
          active_work_session: { active: false, id: null },
        },
      ]);
    });

    await page.goto(getMembersUrl(MOCK_ORG_ID));

    await expect(page.getByText('読み込み中です...')).toBeVisible();
    await expect(page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`)).toHaveCount(0);

    membersGate.resolve();

    await expect(page.getByText('読み込み中です...')).toHaveCount(0);
    await expect(page.getByText('待機中')).toBeVisible();
    await expect(page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`)).toBeVisible();

    // ---- Alerts: role=status(読み込み中) の Skeleton が出ることを確認 ----
    const alertsGate = createGate();

    await page.route(`**/api/v1/organizations/${MOCK_ORG_ID}/alerts**`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();

      const url = new URL(route.request().url());
      if (url.pathname !== `/api/v1/organizations/${MOCK_ORG_ID}/alerts`) return route.fallback();

      await alertsGate.promise;
      await fulfillJson(route, 200, []);
    });

    await page.goto(getAlertsUrl(MOCK_ORG_ID));

    await expect(page.getByRole('status', { name: '読み込み中' })).toBeVisible();

    alertsGate.resolve();

    await expect(page.getByRole('heading', { name: 'アラート一覧' })).toBeVisible();
    await expect(page.getByText('アラートはありません。')).toBeVisible();
  });

  test('API 401/403 時にセッション再開画面/ログイン導線が出る', async ({ page }) => {
    // Cookieだけ付与して、validate_token を 401 にする（セッション失効相当）
    await page.context().addCookies([
      {
        name: 'omamori_auth_token',
        value: 'expired-token',
        url: 'http://localhost:3000',
      },
    ]);

    await page.route('**/api/v1/auth/validate_token', async (route) => {
      await fulfillJson(route, 401, { status: 'error', errors: ['Unauthorized'] });
    });

    // 画面側の想定外のAPI呼び出しがあっても壊れないように、最低限モック
    await page.route('**/api/v1/organizations', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await fulfillJson(route, 200, []);
    });

    await page.goto(getAlertsUrl(MOCK_ORG_ID));

    // Alertsページは未ログインの場合「ログインしてください」を表示する
    await expect(page.getByText('ログインしてください')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'アラート一覧' })).toHaveCount(0);
  });

  test('メインアクション（見守り開始/ステータス更新）の二重送信が防止される', async ({ page }) => {
    await loginAsAdmin(page);
    await mockOrganizations(page, [MOCK_ORG]);

    let isSessionActive = false;

    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: {
          active: isSessionActive,
          id: isSessionActive ? MOCK_SESSION_ID : null,
        },
      },
    ]);

    const startGate = createGate();
    let startCallCount = 0;

    await page.route('**/api/v1/work_sessions', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      startCallCount += 1;

      // 1回目のリクエストだけ遅延させて、連打できそうな状況を作る
      await startGate.promise;

      isSessionActive = true;
      await fulfillJson(route, 201, { id: MOCK_SESSION_ID, status: 'in_progress' });
    });

    await page.goto(getMembersUrl(MOCK_ORG_ID));
    await expect(page.getByText('待機中')).toBeVisible();

    const toggle = page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`);
    await toggle.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const startButton = modal.getByRole('button', { name: '開始' });
    await expect(startButton).toBeVisible();

    const startResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/work_sessions') && resp.request().method() === 'POST',
    );
    const refetchResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/memberships') && resp.request().method() === 'GET',
    );

    // 1回目クリック
    await startButton.click();

    // in-flight中は二重送信できない状態になっていること
    await expect(toggle).toBeDisabled();
    await expect(page.getByText('処理中...')).toBeVisible();

    // 2回目クリックを試みる（UI側で二重送信が防止されること）
    await startButton.click({ timeout: 200 }).catch(() => undefined);
    await toggle.click({ timeout: 200 }).catch(() => undefined);
    await expect.poll(() => startCallCount, { timeout: 500 }).toBe(1);

    // レスポンスを解放
    startGate.resolve();

    const startResponse = await startResponsePromise;
    const refetchResponse = await refetchResponsePromise;

    expect(startResponse.status()).toBe(201);
    expect(refetchResponse.status()).toBe(200);

    await expect(modal).not.toBeVisible();
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('見守り中')).toBeVisible();
  });
});
