/**
 * API エラーハンドリングのユーティリティ
 */

import { ApiError } from './client';
import { COMMON } from '@/constants/ui-messages/common';

/**
 * 通知を抑制するための特殊なステータスコード
 * AbortErrorや401エラーなど、ユーザーに通知すべきでないエラーに使用
 */
export const SUPPRESS_NOTIFICATION_STATUS = -1;

export type NormalizedError = {
  message: string;
  status?: number;
  shouldNotify: boolean;
};

/**
 * AbortError かどうかを判定する
 * リクエストがキャンセルされた場合に発生するエラー
 */
export function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') {
    return true;
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return true;
  }
  return false;
}

/**
 * エラーオブジェクトを正規化して、統一されたエラーメッセージと
 * ステータスコードを返す
 *
 * AbortErrorや401エラーの場合は、shouldNotify: false を返して
 * ユーザーへの通知を抑制する
 *
 * @param err - キャッチされたエラーオブジェクト
 * @returns 正規化されたエラー情報
 */
export function normalizeErrorMessage(err: unknown): NormalizedError {
  // AbortError（リクエストキャンセル）はユーザーに表示しない
  if (isAbortError(err)) {
    return {
      message: '',
      status: SUPPRESS_NOTIFICATION_STATUS,
      shouldNotify: false,
    };
  }

  if (err instanceof ApiError) {
    // 認証エラー: AuthContextでのリダイレクト処理に任せる
    if (err.status === 401) {
      return {
        message: '認証が必要です',
        status: 401,
        shouldNotify: false,
      };
    }

    // 権限エラー
    if (err.status === 403) {
      return {
        message: COMMON.FALLBACK_ERRORS.FORBIDDEN,
        status: 403,
        shouldNotify: true,
      };
    }

    // ネットワークエラー
    if (err.status === 0) {
      return {
        message: COMMON.FALLBACK_ERRORS.NETWORK_ERROR,
        status: 0,
        shouldNotify: true,
      };
    }

    return {
      message: err.message,
      status: err.status,
      shouldNotify: true,
    };
  }

  // 一般的なError: 長すぎる場合は汎用メッセージでサニタイズ
  if (err instanceof Error) {
    const safeMessage =
      err.message.length > 200 ? COMMON.FALLBACK_ERRORS.GENERIC_ERROR : err.message;
    return {
      message: safeMessage,
      shouldNotify: true,
    };
  }

  return {
    message: COMMON.FALLBACK_ERRORS.GENERIC_ERROR,
    shouldNotify: true,
  };
}
