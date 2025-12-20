/**
 * ユーザーの組織内権限を判定するヘルパー関数
 */

import type { UserResponse } from './api/types';

/**
 * 指定した組織でのユーザーのロールを取得
 * @param user ログイン中のユーザー
 * @param organizationId 組織ID
 * @returns ロール ('worker' | 'admin') または undefined
 */
export function getUserRole(
  user: UserResponse | null | undefined,
  organizationId: number | string,
): 'worker' | 'admin' | undefined {
  if (!user?.memberships) return undefined;

  const orgId = typeof organizationId === 'string' ? parseInt(organizationId, 10) : organizationId;
  const membership = user.memberships.find((m) => m.organization_id === orgId);

  return membership?.role;
}

/**
 * 指定した組織でユーザーがadminかどうか判定
 * @param user ログイン中のユーザー
 * @param organizationId 組織ID
 * @returns admin の場合 true
 */
export function isOrganizationAdmin(
  user: UserResponse | null | undefined,
  organizationId: number | string,
): boolean {
  return getUserRole(user, organizationId) === 'admin';
}

/**
 * 指定した組織でユーザーがworkerかどうか判定
 * @param user ログイン中のユーザー
 * @param organizationId 組織ID
 * @returns worker の場合 true
 */
export function isOrganizationWorker(
  user: UserResponse | null | undefined,
  organizationId: number | string,
): boolean {
  return getUserRole(user, organizationId) === 'worker';
}

/**
 * 指定した組織でユーザーがメンバーかどうか判定
 * @param user ログイン中のユーザー
 * @param organizationId 組織ID
 * @returns メンバーの場合 true
 */
export function isOrganizationMember(
  user: UserResponse | null | undefined,
  organizationId: number | string,
): boolean {
  return getUserRole(user, organizationId) !== undefined;
}
