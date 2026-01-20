import type { Page } from '@playwright/test';

import { MOCK_ADMIN, MOCK_WORKER } from '../fixtures/users';
import { mockValidateToken } from './api';

const DEFAULT_COOKIE_URL = 'http://localhost:3000';

async function setAuthCookie(page: Page, token: string) {
  await page.context().addCookies([
    {
      name: 'omamori_auth_token',
      value: token,
      url: DEFAULT_COOKIE_URL,
    },
  ]);
}

export async function loginAsAdmin(page: Page) {
  await setAuthCookie(page, 'admin-token');
  await mockValidateToken(page, MOCK_ADMIN);
}

export async function loginAsWorker(page: Page) {
  await setAuthCookie(page, 'worker-token');
  await mockValidateToken(page, MOCK_WORKER);
}
