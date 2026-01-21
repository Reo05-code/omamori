import type { Page, Route } from '@playwright/test';

// ------------------------
// 共通ユーティリティ
// ------------------------

export async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

// ------------------------
// ドメインモック
// ------------------------

/**
 * 認証トークン検証 (GET /api/v1/auth/validate_token)
 * @param user MOCK_ADMIN / MOCK_WORKER 等を利用
 */
export async function mockValidateToken(page: Page, user: unknown) {
  await page.route('**/api/v1/auth/validate_token', async (route) => {
    await fulfillJson(route, 200, { status: 'success', data: user });
  });
}

export async function mockOrganizations(page: Page, organizations: unknown[]) {
  await page.route('**/api/v1/organizations', async (route) => {
    await fulfillJson(route, 200, organizations);
  });
}

/**
 * @param getMemberships 実行中に動的に値を変更できるよう関数で渡す
 */
export async function mockMemberships(page: Page, orgId: number, getMemberships: () => unknown) {
  await page.route(`**/api/v1/organizations/${orgId}/memberships`, async (route) => {
    await fulfillJson(route, 200, getMemberships());
  });
}

export async function mockWorkSessionStart(page: Page, handler: () => unknown) {
  await page.route('**/api/v1/work_sessions', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await fulfillJson(route, 201, handler());
  });
}

export async function mockWorkSessionFinish(page: Page, sessionId: number, handler: () => unknown) {
  await page.route(`**/api/v1/work_sessions/${sessionId}/finish`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await fulfillJson(route, 200, handler());
  });
}

// ------------------------
// ログ関連
// ------------------------

export async function mockSafetyLogs(page: Page, workSessionId: number, handler: () => unknown) {
  await page.route(`**/api/v1/work_sessions/${workSessionId}/safety_logs**`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await fulfillJson(route, 200, handler());
  });
}

/**
 * リスクアセスメント一覧取得
 * x-total-count 等のページング用ヘッダーを含めて返却します
 */
export async function mockRiskAssessments(
  page: Page,
  workSessionId: number,
  handler: () => {
    data: unknown;
    totalCount?: number | null;
    totalPages?: number | null;
  },
) {
  await page.route(`**/api/v1/work_sessions/${workSessionId}/risk_assessments**`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();

    const { data, totalCount = null, totalPages = null } = handler();
    const headers: Record<string, string> = {};

    if (typeof totalCount === 'number') headers['x-total-count'] = String(totalCount);
    if (typeof totalPages === 'number') headers['x-total-pages'] = String(totalPages);

    // CORS 環境でもレスポンスヘッダーを読めるようにする（x-total-* を JS 側で参照する）
    // `Headers.get('x-total-pages')` 等が null になってページングUIが無効化されるのを防ぐ。
    if (headers['x-total-count'] || headers['x-total-pages']) {
      headers['access-control-expose-headers'] = 'x-total-count, x-total-pages';
    }

    await route.fulfill({
      status: 200,
      headers,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}
