import type { Organization } from './types';
import { api } from './client';
import { API_PATHS } from './paths';

// 組織一覧を取得する
export async function fetchOrganizations(): Promise<Organization[]> {
  const res = await api.get<Organization[]>(API_PATHS.ORGANIZATIONS.BASE);

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to fetch organizations: status=${res.status}`);
  }

  return res.data;
}
