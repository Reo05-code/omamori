import { test, expect } from '@playwright/test';

test.describe('Seed', () => {
  test('seed', async ({ page }) => {
    // Generate code here.
    await expect(page).toBeDefined();
  });
});
