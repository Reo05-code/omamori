import type { Organization, UpdateOrganizationRequest, ApiId } from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

/**
 * 組織一覧を取得
 * @throws {ApiError} API呼び出しが失敗した場合
 */
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

/**
 * 組織情報を更新
 * @param organizationId 組織ID
 * @param body 更新内容（name等）
 * @returns 更新後の組織情報
 * @throws {ApiError} API呼び出しが失敗した場合（403 Forbidden等）
 */
export async function updateOrganization(
  organizationId: ApiId,
  body: UpdateOrganizationRequest,
): Promise<Organization> {
  const path = API_PATHS.ORGANIZATIONS.UPDATE(organizationId);
  const res = await api.patch<Organization>(path, body);

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to update organization: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}
