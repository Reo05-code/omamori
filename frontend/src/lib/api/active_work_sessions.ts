import { api, ApiError } from './client';
import { API_PATHS } from './paths';
import type { LatestLocationPin } from './types'; // ApiIdは削除。ここでは使わせない。

export async function fetchOrganizationLatestLocations(
  organizationId: number, // 明示的に number を指定
  signal?: AbortSignal,
): Promise<LatestLocationPin[]> {
  const path = API_PATHS.ORGANIZATIONS.ACTIVE_WORK_SESSIONS_LATEST_LOCATIONS(organizationId);
  const res = await api.get<LatestLocationPin[]>(path, { signal });

  if (res.error) {
    throw new ApiError(res.error, res.status, res.errorBody);
  }

  // 2. アプリケーション/スキーマレベルのバリデーション
  // 正常系(200)だが、Bodyが null または配列でない場合
  if (!Array.isArray(res.data)) {
    throw new ApiError(
      `Invalid response: expected array but got ${res.data === null ? 'null' : typeof res.data}`,
      res.status,
      // 必要であればここでレスポンスボディをログ用に含める
      { received: res.data },
    );
  }

  return res.data;
}
