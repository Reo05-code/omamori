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
    MEMBERSHIP: (orgId: string, membershipId: string) =>
      `/api/v1/organizations/${orgId}/memberships/${membershipId}`,
    CREATE_INVITATION: (id: string) => `/api/v1/organizations/${id}/invitations`,
    ALERTS: (id: string | number) => `/api/v1/organizations/${id}/alerts`,
    ALERT: (organizationId: string | number, alertId: string | number) =>
      `/api/v1/organizations/${organizationId}/alerts/${alertId}`,
  },
  // 招待受諾
  INVITATIONS: {
    ACCEPT: '/api/v1/invitations/accept',
  },

  // WorkSession / Worker actions
  WORK_SESSIONS: {
    BASE: '/api/v1/work_sessions',
    CURRENT: '/api/v1/work_sessions/current',
    CREATE: '/api/v1/work_sessions',
    FINISH: (id: string | number) => `/api/v1/work_sessions/${id}/finish`,
    SAFETY_LOGS: (workSessionId: string | number) =>
      `/api/v1/work_sessions/${workSessionId}/safety_logs`,
    RISK_ASSESSMENTS: (workSessionId: string | number) =>
      `/api/v1/work_sessions/${workSessionId}/risk_assessments`,
    ALERTS: (workSessionId: string | number) => `/api/v1/work_sessions/${workSessionId}/alerts`,
  },
} as const;
