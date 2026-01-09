// 指定した組織のメンバー似菅するAPI クライアント関数
import type { Membership } from '../api/types';
import { api } from './client';
import { API_PATHS } from './paths';

export async function fetchMemberships(organizationId: string | number): Promise<Membership[]> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIPS(organizationId);

  const res = await api.get<Membership[]>(path);

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to fetch memberships: status=${res.status}`);
  }

  return res.data;
}

export async function updateMembership(
  organizationId: string | number,
  membershipId: string | number,
  body: unknown,
): Promise<Membership> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIP(organizationId, membershipId);
  const res = await api.patch<Membership>(path, body);

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to update membership: status=${res.status}`);
  }

  return res.data;
}

export async function deleteMembership(
  organizationId: string | number,
  membershipId: string | number,
): Promise<void> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIP(organizationId, membershipId);
  const res = await api.delete<{ message?: string }>(path);

  if (res.error) {
    throw new Error(res.error || `failed to delete membership: status=${res.status}`);
  }

  return;
}
