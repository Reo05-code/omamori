/**
 * API エラーハンドリングのユーティリティ
 */

import { ApiError } from './client';

export type NormalizedError = {
  message: string;
  status?: number;
};

/**
 * エラーオブジェクトを正規化して、統一されたエラーメッセージと
 * ステータスコードを返す
 *
 * @param err - キャッチされたエラーオブジェクト
 * @returns 正規化されたエラー情報
 */
export function normalizeErrorMessage(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return { message: 'ネットワークエラーが発生しました', status: 0 };
    }
    if (err.status === 403) {
      return { message: '権限がありません', status: 403 };
    }
    return { message: err.message, status: err.status };
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: 'エラーが発生しました' };
}
