/**
 * APIエンドポイント定義
 * すべてのAPIパスを一箇所に集約
 */

export const API_PATHS = {
  // 認証
  AUTH: {
    SIGN_IN: '/api/v1/auth/sign_in',
    SIGN_OUT: '/api/v1/auth/sign_out',
    SIGN_UP: '/api/v1/auth',
    VALIDATE_TOKEN: '/api/v1/auth/validate_token',
    PASSWORD: '/api/v1/auth/password',
  },
  // Organization 関連のパス
  ORGANIZATIONS: {
    BASE: '/api/v1/organizations',
    SHOW: (id: string) => `/api/v1/organizations/${id}`,
    MEMBERSHIPS: (id: string) => `/api/v1/organizations/${id}/memberships`,
    INVITATIONS: (id: string) => `/api/v1/organizations/${id}/invitations`,
  },
} as const;
