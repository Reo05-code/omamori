import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  /* テストファイルを並列で実行する */
  fullyParallel: true,

  /* CI 上で test.only が残っているとビルドを失敗させる */
  forbidOnly: !!process.env.CI,

  /* CI 上のみリトライを有効にする */
  retries: process.env.CI ? 2 : 0,

  /* CI 上ではワーカー数を抑制する */
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  /* プロジェクト共通の設定 */
  use: {
    /* ページ遷移で使用するベース URL */
    baseURL: 'http://localhost:3000',

    /* 失敗時のリトライでトレースを収集する設定（トレースビューア参照） */
    trace: 'on-first-retry',

    /* 失敗時にスクリーンショットを取得する */
    screenshot: 'only-on-failure',
  },

  /* 主要ブラウザごとのプロジェクト設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
