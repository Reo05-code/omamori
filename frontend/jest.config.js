const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // TypeScript を使用し、baseUrl をルートに設定している場合にエイリアスを解決するための設定
  moduleDirectories: ['node_modules', '<rootDir>/'],

  testEnvironment: 'jest-environment-jsdom',

  // テストファイルのパターン
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  // E2E テストは Playwright で実行するため Jest から除外する
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.next/'],

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// createJestConfig をこのようにエクスポートすることで next/jest が async な Next.js の設定をロードできます
module.exports = createJestConfig(customJestConfig);
