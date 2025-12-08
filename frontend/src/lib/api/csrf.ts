// CSRF ユーティリティ
// - GET /api/v1/auth/csrf からトークンを取得し、クッキーと返却 JSON からトークンを取得します。
// - 取得後は返り値の関数 `withCsrf` を使って fetch に自動で `X-CSRF-Token` を付与できます。

export async function fetchCsrf(baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001') {
  const url = `${baseUrl}/api/v1/auth/csrf`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error(`failed to fetch csrf: ${res.status}`);
  }

  const json = await res.json();
  // サーバは XSRF-TOKEN クッキーをセットしている。
  // 返却 JSON にも csrf_token を含めているので、JS 側はそれを使うことができます。
  return json.csrf_token;
}

// withCsrf: 与えられた fetch オプションに X-CSRF-Token ヘッダを追加して fetch を実行するヘルパ
export async function withCsrf(input: RequestInfo, init?: RequestInit) {
  const token = await fetchCsrf();

  const headers = new Headers(init?.headers || {});
  if (token) headers.set('X-CSRF-Token', token);

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers
  });
}
