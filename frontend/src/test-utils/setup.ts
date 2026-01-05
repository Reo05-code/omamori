/**
 * テスト用の共通セットアップユーティリティ
 */

/**
 * Promise を解決してレンダリングを完了させる
 */
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

/**
 * 指定時間待機
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
