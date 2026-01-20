import type { Page, Route } from '@playwright/test';

export async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

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
