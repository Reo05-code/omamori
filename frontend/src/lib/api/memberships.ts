// 指定した組織のメンバー似菅するAPI クライアント関数
import type { Membership, MembershipRole } from '../api/types';
import { api } from './client';
import { API_PATHS } from './paths';

export async function fetchMemberships(
  organizationId: string | number,
  signal?: AbortSignal,
): Promise<Membership[]> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIPS(organizationId);

  const res = await api.get<Membership[]>(path, { signal });

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to fetch memberships: status=${res.status}`);
  }

  return res.data;
}

export type UpdateMembershipRequest = {
  membership: {
    role: MembershipRole;
  };
};

export async function updateMembership(
  organizationId: string | number,
  membershipId: string | number,
  body: UpdateMembershipRequest,
  signal?: AbortSignal,
): Promise<Membership> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIP(organizationId, membershipId);
  const res = await api.patch<Membership>(path, body, { signal });

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to update membership: status=${res.status}`);
  }

  return res.data;
}

export async function deleteMembership(
  organizationId: string | number,
  membershipId: string | number,
  signal?: AbortSignal,
): Promise<void> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIP(organizationId, membershipId);
  const res = await api.delete<{ message?: string }>(path, { signal });

  if (res.error) {
    throw new Error(res.error || `failed to delete membership: status=${res.status}`);
  }

  return;
}
