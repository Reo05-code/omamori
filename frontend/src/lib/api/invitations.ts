/**
 * 招待関連の API クライアント関数
 */
import type { CreateInvitationRequest, CreateInvitationResponse } from './types';
import { api } from './client';
import { API_PATHS } from './paths';

/**
 * 組織にメンバーを招待
 * @param organizationId 組織ID
 * @param email 招待するメールアドレス
 * @param role 招待するユーザーのロール ('worker' | 'admin')
 * @returns 作成された招待情報
 */
export async function createInvitation(
  organizationId: string,
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
    if (errors.some((s: string) => /already.*member|already_member|既にメンバー|既に所属|already a member/i.test(s))) {
      throw new Error('already_member');
    }

    // 既に招待済みのケース
    if (errors.some((s: string) => /already.*invited|already_invited|既に招待|invited/i.test(s))) {
      throw new Error('already_invited');
    }

    // その他（422 等）：バックエンドの messages をまとめて投げる
    const joined = errors.length > 0 ? errors.join('; ') : res.error || `招待の作成に失敗しました: status=${res.status}`;
    throw new Error(joined);
  }

  return res.data;
}
