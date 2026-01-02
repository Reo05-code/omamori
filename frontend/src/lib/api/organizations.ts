import type { Organization } from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

// 組織一覧を取得する
export async function fetchOrganizations(): Promise<Organization[]> {
  const res = await api.get<Organization[]>(API_PATHS.ORGANIZATIONS.BASE);

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch organizations: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}
