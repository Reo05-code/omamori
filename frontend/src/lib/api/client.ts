/**
 * APIクライアント設定
 * BaseURL、ヘッダー、共通エラーハンドリングを提供
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * 認証ヘッダーを取得
 */
//  フロントでの localStorage によるトークン保持や
// レスポンスヘッダからのヘッダ保存は廃止。認証はブラウザの Cookie 自動送信
// (`credentials: 'include'`) のみを利用する。

/**
 * APIリクエストを実行
 */
export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      // ブラウザに Cookie を自動送信させる
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.errors?.[0] || `エラーが発生しました (${response.status})`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, error: null, status: response.status };
  } catch (error) {
    return {
      data: null,
      error: "ネットワークエラーが発生しました",
      status: 0,
    };
  }
}

// 便利メソッド
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>("DELETE", path, options),
};
