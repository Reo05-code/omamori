import { test, expect } from '@playwright/test';

import {
  getMembersUrl,
  getWorkLogsUrl,
  loginAsAdmin,
  mockMemberships,
  mockOrganizations,
  mockWorkSessionFinish,
  mockWorkSessionStart,
} from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from '../fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('メンバー一覧・運用機能', () => {
  // テスト間で共有する状態変数を定義
  let isSessionActive = false;

  test.beforeEach(async ({ page }) => {
    // 状態を初期化 (テスト間の干渉を防ぐ)
    isSessionActive = false;

    // 1. 認証トークン検証（Cookie + validate_token のモック）
    await loginAsAdmin(page);

    // 2. 組織一覧（Dashboard レイアウト等で参照されるため）
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. メンバー一覧（members/work_logs 両方で参照される）
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
  });

  test('見守りトグル ON/OFF のフロー', async ({ page }) => {
    // 開始API
    await mockWorkSessionStart(page, () => {
      isSessionActive = true;
      return { id: MOCK_SESSION_ID, status: 'in_progress' };
    });

    // 終了API
    await mockWorkSessionFinish(page, MOCK_SESSION_ID, () => {
      isSessionActive = false;
      return { id: MOCK_SESSION_ID, status: 'completed' };
    });

    await page.goto(getMembersUrl(MOCK_ORG_ID));

    // 初期状態
    await expect(page.getByText('待機中')).toBeVisible();

    const toggle = page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`);

    // 開始: トグルクリック→モーダル→開始
    await toggle.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const startButton = page.getByRole('button', { name: '開始' });
    await expect(startButton).toBeVisible();

    const [startResponse, refetchResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/work_sessions') && resp.request().method() === 'POST',
      ),
      page.waitForResponse(
        (resp) => resp.url().includes('/memberships') && resp.request().method() === 'GET',
      ),
      startButton.click(),
    ]);

    expect(startResponse.status()).toBe(201);
    expect(refetchResponse.status()).toBe(200);

    await expect(modal).not.toBeVisible();
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('見守り中')).toBeVisible();

    // 終了: トグルクリック→モーダル→終了
    await toggle.click();
    await expect(modal).toBeVisible();

    const finishButton = page.getByRole('button', { name: '終了' });
    await expect(finishButton).toBeVisible();

    const [finishResponse, refetchAfterFinish] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/finish') && resp.request().method() === 'POST',
      ),
      page.waitForResponse(
        (resp) => resp.url().includes('/memberships') && resp.request().method() === 'GET',
      ),
      finishButton.click(),
    ]);

    expect(finishResponse.status()).toBe(200);
    expect(refetchAfterFinish.status()).toBe(200);

    await expect(modal).not.toBeVisible();
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('待機中')).toBeVisible();
  });

  test('見守り開始 API が失敗した場合のエラー表示', async ({ page }) => {
    await page.route('**/api/v1/work_sessions', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: ['Internal Server Error'] }),
      });
    });

    await page.goto(getMembersUrl(MOCK_ORG_ID));
    await expect(page.getByText('待機中')).toBeVisible();

    const toggle = page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`);

    await toggle.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const startButton = page.getByRole('button', { name: '開始' });
    await expect(startButton).toBeVisible();

    const errorResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/work_sessions') && resp.request().method() === 'POST',
    );

    await startButton.click();

    const errorResponse = await errorResponsePromise;
    expect(errorResponse.status()).toBe(500);

    await expect(modal).not.toBeVisible();
    await expect(
      page.getByText('開始に失敗しました。時間をおいて再度お試しください。'),
    ).toBeVisible();

    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('待機中')).toBeVisible();
  });

  test('管理機能（ロール変更・削除・招待）が表示されない', async ({ page }) => {
    await page.goto(getMembersUrl(MOCK_ORG_ID));

    await expect(page.getByRole('heading', { name: 'メンバー一覧' })).toBeVisible();

    // 招待ボタン（管理 UI）が存在しない
    await expect(page.getByRole('button', { name: '招待' })).toHaveCount(0);

    // ロール変更 UI（select 等）が存在しない
    await expect(page.locator('select')).toHaveCount(0);

    // 削除ボタンが存在しない
    await expect(page.getByRole('button', { name: '削除' })).toHaveCount(0);
  });

  test('メンバー行から作業ログ導線へ遷移できる', async ({ page }) => {
    await page.goto(getMembersUrl(MOCK_ORG_ID));

    // Sidebar にも「作業ログ」リンクが存在するため、メンバー行内のリンクを明示的にクリックする
    const workerRow = page.getByRole('row', { name: /worker@example\.com/ });
    await workerRow.getByRole('link', { name: '作業ログ' }).click();

    await expect(page).toHaveURL(getWorkLogsUrl(MOCK_ORG_ID, MOCK_WORKER_ID));

    // tab= が無い場合は basic がデフォルト
    expect(page.url()).not.toContain('tab=');

    await expect(page.getByRole('button', { name: '基本情報' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: '基本情報' })).toBeVisible();

    // userId が指定されているため、基本情報が表示される
    await expect(page.getByText('メールアドレス: worker@example.com')).toBeVisible();
  });
});
