/**
 * 招待関連の API クライアント関数
 */
import type { CreateInvitationRequest, CreateInvitationResponse, Invitation, ApiId } from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

/**
 * 組織の pending 招待一覧を取得
 * @param organizationId 組織ID
 * @returns 未承諾招待の配列
 * @throws {ApiError} API呼び出しが失敗した場合
 */
export async function fetchInvitations(
  organizationId: ApiId,
  signal?: AbortSignal,
): Promise<Invitation[]> {
  const path = API_PATHS.ORGANIZATIONS.INVITATIONS(organizationId);
  const res = await api.get<Invitation[]>(path, { signal });

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch invitations: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}

/**
 * 招待を削除する (pending な招待のみ削除可能)
 * @param organizationId 組織ID
 * @param invitationId 招待ID
 * @throws {ApiError} API呼び出しが失敗した場合（404: 招待が存在しない、422: pending でない招待）
 */
export async function deleteInvitation(organizationId: ApiId, invitationId: ApiId): Promise<void> {
  const path = API_PATHS.ORGANIZATIONS.INVITATION(organizationId, invitationId);
  const res = await api.delete<{ message?: string }>(path);

  if (res.error) {
    throw new ApiError(
      res.error || `failed to delete invitation: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return;
}

/**
 * 組織にメンバーを招待
 * @param organizationId 組織ID
 * @param email 招待するメールアドレス
 * @param role 招待するユーザーのロール ('worker' | 'admin')
 * @returns 作成された招待情報
 * @throws {Error} エラーメッセージで種別を判定可能
 *   - 'forbidden': 権限不足
 *   - 'already_member': 既にメンバー
 *   - 'already_invited': 既に招待済み
 *   - その他: バリデーションエラー等
 */
export async function createInvitation(
  organizationId: ApiId,
  email: string,
  role: 'worker' | 'admin',
): Promise<CreateInvitationResponse> {
  const path = API_PATHS.ORGANIZATIONS.CREATE_INVITATION(organizationId);

  const body: CreateInvitationRequest = {
    invitation: {
      invited_email: email,
      role,
    },
  };

  const res = await api.post<CreateInvitationResponse>(path, body);

  if (res.error || res.data === null) {
    // バックエンドの errorBody を確認して詳細判定
    const eb = (res as any).errorBody as { errors?: string[] } | null | undefined;

    // 権限不足
    if (res.status === 403 || (eb?.errors || []).some((s) => /forbidden|権限|forbid/i.test(s))) {
      throw new Error('forbidden');
    }

    const errors = eb?.errors || [];

    // 既にメンバーであるケース
    if (
      errors.some((s: string) =>
        /already.*member|already_member|既にメンバー|既に所属|already a member/i.test(s),
      )
    ) {
      throw new Error('already_member');
    }

    // 既に招待済みのケース
    if (errors.some((s: string) => /already.*invited|already_invited|既に招待|invited/i.test(s))) {
      throw new Error('already_invited');
    }

    // その他（422 等）：バックエンドの messages をまとめて投げる
    const joined =
      errors.length > 0
        ? errors.join('; ')
        : res.error || `招待の作成に失敗しました: status=${res.status}`;
    throw new Error(joined);
  }

  return res.data;
}
