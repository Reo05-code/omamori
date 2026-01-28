import { test, expect } from '@playwright/test';

import {
  getAlertsUrl,
  loginAsAdmin,
  loginAsWorker,
  mockOrganizations,
  mockOrganizationAlerts,
  mockUpdateOrganizationAlertStatus,
} from '../helpers';
import { MOCK_ORG } from '../fixtures/organizations';
import { MOCK_ORG_ID } from '../fixtures/users';

import type { AlertResponse } from '../../src/lib/api/types';

function buildAlert(overrides: Partial<AlertResponse> = {}): AlertResponse {
  return {
    id: 100,
    work_session_id: 200,
    alert_type: 'sos',
    severity: 'critical',
    status: 'open',
    created_at: '2026-01-21T00:00:00.000Z',
    updated_at: '2026-01-21T00:00:00.000Z',
    work_session: {
      id: 200,
      user: {
        id: 10,
        name: 'Worker',
        email: 'worker@example.com',
      },
    },
    ...overrides,
  };
}

test.describe('管理者アラート管理', () => {
  test('アラート一覧が表示される（正常系）', async ({ page }) => {
    // 1. 管理者ユーザーでログイン済み状態を用意する
    await loginAsAdmin(page);

    // 2. 組織一覧（Dashboard レイアウト等で参照される）
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. アラート取得 API が成功する状況を用意する
    let alerts: AlertResponse[] = [
      buildAlert({
        id: 1,
        work_session_id: 101,
        alert_type: 'sos',
        severity: 'critical',
        status: 'open',
      }),
      buildAlert({
        id: 2,
        work_session_id: 102,
        alert_type: 'battery_low',
        severity: 'medium',
        status: 'in_progress',
        work_session: {
          id: 102,
          user: { id: 11, name: 'Worker B', email: 'worker-b@example.com' },
        },
      }),
    ];

    await mockOrganizationAlerts(page, MOCK_ORG_ID, () => alerts);

    // 4. アラート一覧ページへ遷移する
    await page.goto(getAlertsUrl(MOCK_ORG_ID));

    // Expected: 見出し
    await expect(page.getByRole('heading', { name: 'アラート一覧' })).toBeVisible();

    // Expected: テーブルヘッダ（最低限の列）
    await expect(page.getByRole('columnheader', { name: '対応状況' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '重要度' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '種別' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '発生時刻' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '作業者' })).toBeVisible();

    // Expected: 表示内容（種別/重要度/ステータス）
    // 最初のアラート行（SOS発信・緊急）
    const rows = page.locator('tbody tr');
    const row1 = rows.first();
    await expect(row1).toContainText('未対応');
    await expect(row1).toContainText('緊急');
    await expect(row1).toContainText('SOS発信');

    // 2番目のアラート行（バッテリー低下・中程度）
    const row2 = rows.nth(1);
    await expect(row2).toContainText('対応中');
    await expect(row2).toContainText('中');
    await expect(row2).toContainText('バッテリー低下');

    // 0件の空状態も確認（同一テスト内で再取得）
    alerts = [];
    await page.reload();
    await expect(page.getByText('アラートはありません。')).toBeVisible();
  });

  test('アラートのステータスを更新できる', async ({ page }) => {
    // 1. 管理者ユーザーでログイン済み状態を用意する
    await loginAsAdmin(page);

    // 2. 組織一覧（Dashboard レイアウト等で参照される）
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. 一覧と更新のモック（更新後もリロードで維持されるように状態を保持する）
    let alerts: AlertResponse[] = [
      buildAlert({
        id: 10,
        work_session_id: 110,
        alert_type: 'risk_high',
        severity: 'high',
        status: 'open',
      }),
    ];

    await mockOrganizationAlerts(page, MOCK_ORG_ID, () => alerts);

    await mockUpdateOrganizationAlertStatus(page, MOCK_ORG_ID, ({ alertId, status }) => {
      const idx = alerts.findIndex((a) => a.id === alertId);
      if (idx >= 0) {
        alerts = alerts.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status,
                resolved_at: status === 'resolved' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }
            : a,
        );
      }
      return alerts.find((a) => a.id === alertId) ?? buildAlert({ id: alertId, status });
    });

    // 4. アラート一覧ページへ遷移する
    await page.goto(getAlertsUrl(MOCK_ORG_ID));

    await expect(page.getByRole('heading', { name: 'アラート一覧' })).toBeVisible();

    // Expected: 更新前は未対応
    // テーブル内の最初のアラート行を取得
    const rows = page.locator('tbody tr');
    const row = await rows.first();
    await expect(row).toContainText('未対応');

    // 5. ステータスを更新（ConfirmDialog で 確認 ボタンをクリック）
    const [patchResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/v1/organizations/${MOCK_ORG_ID}/alerts/`) &&
          resp.request().method() === 'PATCH',
      ),
      (async () => {
        await page.getByRole('button', { name: '対応済にする' }).click();
        // ConfirmDialog が表示されるので「確認」をクリック（COMMON.BUTTONS.CONFIRM）
        await page.getByRole('button', { name: '確認', exact: true }).click();
      })(),
    ]);

    expect(patchResponse.status()).toBe(200);

    // Expected: 一覧上のステータス表示が更新される
    await expect(row).toContainText('解決済み');

    // Expected: 解決済みの場合、更新ボタンが出ない
    await expect(row.getByRole('button', { name: '対応済にする' })).toHaveCount(0);

    // Expected: 再読み込みしても更新が保持される
    await page.reload();
    // セッション ID カラム削除後は ID 10 で特定
    await expect(page.locator('tbody tr').first()).toContainText('解決済み');
  });

  test('Worker ユーザーはアラート管理画面にアクセスできない', async ({ page }) => {
    // 1. 非管理者（worker）でログイン済み状態を用意する
    await loginAsWorker(page);

    // 2. 組織一覧（Dashboard レイアウト等で参照される）
    await mockOrganizations(page, [MOCK_ORG]);

    // 3. 直URLでアクセス
    await page.goto(getAlertsUrl(MOCK_ORG_ID));

    // Expected: 権限エラー表示
    await expect(page.getByText('権限がありません')).toBeVisible();

    // Expected: ステータス更新操作が表示されない
    await expect(page.getByRole('button', { name: '対応済にする' })).toHaveCount(0);
  });
});
