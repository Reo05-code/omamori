import { test, expect } from '@playwright/test';

import {
  getMembersUrl,
  loginAsAdmin,
  mockMemberships,
  mockOrganizations,
  mockWorkSessionFinish,
  mockWorkSessionStart,
} from './helpers';
import { MOCK_ORG } from './fixtures/organizations';
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_WORKER_ID } from './fixtures/users';

const MEMBERSHIP_ID = 1;

test.describe('Admin リモート開始/終了トグル', () => {
  // テスト間で共有する状態変数を定義
  let isSessionActive = false;

  test.beforeEach(async ({ page }) => {
    // 状態を初期化 (テスト間の干渉を防ぐ)
    isSessionActive = false;

    // 1. 認証トークン検証（Cookie + validate_token のモック）
    await loginAsAdmin(page);

    // 2. 組織一覧
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. メンバー一覧
    await mockMemberships(page, MOCK_ORG_ID, () => [
      {
        id: MEMBERSHIP_ID,
        user_id: MOCK_WORKER_ID,
        email: 'worker@example.com',
        role: 'worker',
        // ここで動的な変数を参照してレスポンスを決定
        active_work_session: {
          active: isSessionActive,
          id: isSessionActive ? MOCK_SESSION_ID : null,
        },
      },
    ]);
  });

  test('開始→状態更新→終了のフロー', async ({ page }) => {
    // 開始API
    await mockWorkSessionStart(page, () => {
      // サーバー側の状態変化をシミュレート
      isSessionActive = true;
      return {
        id: MOCK_SESSION_ID,
        status: 'in_progress',
      };
    });

    // 終了API (POST)
    await mockWorkSessionFinish(page, MOCK_SESSION_ID, () => {
      // サーバー側の状態変化をシミュレート
      isSessionActive = false;
      return {
        id: MOCK_SESSION_ID,
        status: 'completed',
      };
    });

    await page.goto(getMembersUrl(MOCK_ORG_ID));

    // 初期状態確認
    await expect(page.getByText('待機中')).toBeVisible();

    const toggle = page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`);

    // 開始操作: トグルクリック→ConfirmModal表示待ち
    await toggle.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 開始ボタンクリック→トグル処理中（disabled）→API完了→refetch→enabled復帰を待つ
    const startButton = page.getByRole('button', { name: '開始' });
    await expect(startButton).toBeVisible();

    // APIレスポンスとrefetchを並行して待つ
    const [startResponse, refetchResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/work_sessions') && resp.request().method() === 'POST',
      ),
      page.waitForResponse(
        (resp) => resp.url().includes('/memberships') && resp.request().method() === 'GET',
      ),
      startButton.click(),
    ]);

    // API成功を確認
    expect(startResponse.status()).toBe(201);
    expect(refetchResponse.status()).toBe(200);

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    // トグルがenabledに戻り、aria-checkedがtrueになることを確認
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    // 状態更新確認（見守り中表示）
    await expect(page.getByText('見守り中')).toBeVisible();

    // 終了操作: トグルクリック→ConfirmModal表示待ち
    await toggle.click();
    await expect(modal).toBeVisible();

    // 終了ボタンクリック→API完了→refetch→enabled復帰を待つ
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

    // API成功を確認
    expect(finishResponse.status()).toBe(200);
    expect(refetchAfterFinish.status()).toBe(200);

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    // トグルがenabledに戻り、aria-checkedがfalseになることを確認
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // 終了確認（待機中表示）
    await expect(page.getByText('待機中')).toBeVisible();
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

    await page.goto(getMembersUrl(MOCK_ORG_ID));
    await expect(page.getByText('待機中')).toBeVisible();

    const toggle = page.getByTestId(`remote-toggle-${MEMBERSHIP_ID}`);

    // 開始操作: トグルクリック→ConfirmModal表示待ち
    await toggle.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 開始ボタンクリック→API失敗レスポンス待ち
    const startButton = page.getByRole('button', { name: '開始' });
    await expect(startButton).toBeVisible();

    // エラー時はrefetchが走らない可能性があるため、APIレスポンスのみ待つ
    const errorResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/work_sessions') && resp.request().method() === 'POST',
    );

    await startButton.click();

    const errorResponse = await errorResponsePromise;

    // API失敗を確認
    expect(errorResponse.status()).toBe(500);

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();

    // エラーメッセージの確認
    await expect(
      page.getByText('開始に失敗しました。時間をおいて再度お試しください。'),
    ).toBeVisible();

    // トグルがenabledに戻り、aria-checkedがfalseのまま（開始失敗のため）
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // 待機中状態を維持
    await expect(page.getByText('待機中')).toBeVisible();
  });
});
