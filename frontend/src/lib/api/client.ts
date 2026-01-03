/**
 * APIクライアント設定
 * - BaseURL の統一
 * - Cookie 認証 (credentials: 'include')
 * - JSON/非JSON/204 の扱いを安全に処理
 */

// - 常に `NEXT_PUBLIC_API_BASE_URL` を参照する
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

import { fetchCsrf } from './csrf';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  errorBody?: unknown | null;
  status: number;
}

/**
 * API 呼び出しで発生したエラー
 * - status: HTTP ステータス（ネットワークエラー時は 0）
 * - errorBody: サーバが返したエラーJSON（可能な場合）
 */
export class ApiError extends Error {
  status: number;
  errorBody?: unknown | null;

  constructor(message: string, status: number, errorBody?: unknown | null) {
    super(message);

    Object.setPrototypeOf(this, ApiError.prototype);

    this.name = 'ApiError';
    this.status = status;
    this.errorBody = errorBody;
  }
}

/**
 * API のコア実行関数
 * - fetch の共通設定
 * - JSON / NoContent / 非JSON を安全に処理
 * - エラーメッセージを統一
 */
export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;

  // ★共通ヘッダー（現状 JSON 固定）
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers, // 呼び出し側で上書き可能
  };

  try {
    // CSRF トークンは不要（Origin チェックで保護）
    // 以下のコードは互換性のためコメントアウト
    /*
    if (method !== "GET") {
      try {
        const csrfToken = await fetchCsrf(API_BASE_URL);
        if (csrfToken) {
          headers["X-CSRF-Token"] = csrfToken;
        }
      } catch (e) {
        console.warn("failed to fetch csrf token", e);
      }
    }
    */

    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include', // ★httpOnly Cookie 認証の要
      signal: options.signal,
    });

    // レスポンスの JSON 判定（204 や HTMLを安全に扱う）
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // ======== エラーレスポンス ========
    if (!response.ok) {
      const errorData = isJson ? await response.json() : null;

      return {
        data: null,
        error: errorData?.errors?.[0] || `エラーが発生しました (${response.status})`,
        errorBody: errorData,
        status: response.status,
      };
    }

    // ======== 成功レスポンス ========
    // 204 No Content 対策 → data には null を入れる
    const data = isJson ? await response.json() : null;

    return { data, error: null, status: response.status };
  } catch (_error) {
    return {
      data: null,
      error: 'ネットワークエラーが発生しました',
      status: 0,
    };
  }
}

/**
 * HTTP メソッド別の薄いラッパー
 * - 呼び出し側のコードを簡潔に保つための実務的パターン
 */
export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>('GET', path, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>('POST', path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>('PUT', path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>('PATCH', path, { ...options, body }),

  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>('DELETE', path, options),
};
