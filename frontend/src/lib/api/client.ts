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
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const accessToken = localStorage.getItem("access-token");
  const client = localStorage.getItem("client");
  const uid = localStorage.getItem("uid");

  if (accessToken && client && uid) {
    return {
      "access-token": accessToken,
      client: client,
      uid: uid,
    };
  }
  return {};
}

/**
 * 認証情報をレスポンスヘッダーから保存
 */
function saveAuthHeaders(headers: Headers): void {
  const accessToken = headers.get("access-token");
  const client = headers.get("client");
  const uid = headers.get("uid");

  if (accessToken && client && uid) {
    localStorage.setItem("access-token", accessToken);
    localStorage.setItem("client", client);
    localStorage.setItem("uid", uid);
  }
}

/**
 * 認証情報をクリア
 */
export function clearAuthHeaders(): void {
  localStorage.removeItem("access-token");
  localStorage.removeItem("client");
  localStorage.removeItem("uid");
}

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
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // 認証ヘッダーを保存
    saveAuthHeaders(response.headers);

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
