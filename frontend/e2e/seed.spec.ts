import { test, expect } from '@playwright/test';

test('seed', async ({ page }) => {
  // Generate code here.
  await expect(page).toBeDefined();
});
