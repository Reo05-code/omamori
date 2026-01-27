/**
 * API専用の型定義
 * APIレスポンス・リクエストに関する型をここに集約
 */

export type ApiId = number | string;

export function toNumberId(id: ApiId, name = 'id'): number {
  const numeric = typeof id === 'string' ? Number(id) : id;

  if (!Number.isFinite(numeric)) {
    throw new Error(`${name} must be a finite number (got: ${JSON.stringify(id)})`);
  }

  return numeric;
}

// ユーザーのAPIレスポンス型
export interface UserResponse {
  id: number;
  email: string;
  provider: string;
  uid: string;
  name: string;
  phone_number: string;
  avatar_url: string | null;
  allow_password_change: boolean;
  // ユーザが所属する組織ごとの権限情報
  memberships?: Array<{
    id: number;
    organization_id: number;
    role: 'worker' | 'admin';
  }>;
  settings: {
    notification_enabled?: boolean;
    dark_mode?: 'on' | 'off';
  };
  // 自宅・拠点位置情報
  home_latitude?: number | null;
  home_longitude?: number | null;
  home_location?: string | null; // WKT format: "POINT (lon lat)"
  home_radius?: number | null;
  // オンボーディング完了フラグ
  onboarded?: boolean;
  organizations_count?: number;
  created_at: string;
  updated_at: string;
}

// ログインレスポンス
export interface LoginResponse {
  status: 'success';
  data: UserResponse;
}

// サインアップレスポンス
export interface SignUpResponse {
  status: 'success';
  message: string;
  data: UserResponse;
}

// APIエラーレスポンス
export interface APIErrorResponse {
  status: 'error';
  errors: string[];
}

// ログインリクエスト
export interface LoginRequest {
  email: string;
  password: string;
}

// サインアップリクエスト（phone_number は User モデルで必須）
export interface SignUpRequest {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
  phone_number: string;
}

// トークン検証レスポンス
export interface ValidateTokenResponse {
  status: 'success';
  data: UserResponse;
}

// パスワードリセットメール送信リクエスト
export interface PasswordResetRequest {
  email: string;
  redirect_url: string;
}

// パスワードリセットメール送信レスポンス
export interface PasswordResetResponse {
  status: 'success';
  message: string;
}

// パスワード変更リクエスト
export interface PasswordUpdateRequest {
  password: string;
  password_confirmation: string;
}

// パスワード変更レスポンス
export interface PasswordUpdateResponse {
  status: 'success';
  message: string;
  data: UserResponse;
}

// ユーザー情報更新リクエスト
export interface UpdateUserRequest {
  email?: string;
  name?: string;
  phone_number?: string;
  avatar_url?: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  home_radius?: number;
}

// ユーザー情報更新レスポンス
export interface UpdateUserResponse {
  status: 'success';
  data: UserResponse;
}

// Membership API 型
export interface Membership {
  id: number;
  user_id: number;
  // memberships API が返す user.name（要件: email ではなく name を表示）
  name?: string | null;
  email?: string | null;
  role: MembershipRole;
  working?: boolean;
  // 管理者向け: そのユーザーに進行中の作業セッションがあるか
  // GET /api/v1/organizations/:id/memberships のレスポンスに含まれる
  active_work_session?: ActiveWorkSessionSummary;
}

export interface ActiveWorkSessionSummary {
  active: boolean;
  id: number | null;
}

export type MembershipRole = 'worker' | 'admin';

// Invitation API 型
export interface Invitation {
  id: number;
  invited_email: string;
  role: 'worker' | 'admin';
  token: string;
  expires_at: string | null;
  accepted_at: string | null;
  inviter_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

// 招待作成リクエスト
export interface CreateInvitationRequest {
  invitation: {
    invited_email: string;
    role: 'worker' | 'admin';
  };
}

// 招待作成レスポンス
export interface CreateInvitationResponse {
  id: number;
  invited_email: string;
  role: 'worker' | 'admin';
  token: string;
  expires_at: string | null;
  accepted_at: string | null;
  inviter_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

// Organization API 組織一覧などで利用）
export interface Organization {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// 組織更新リクエスト
export interface UpdateOrganizationRequest {
  organization: {
    name: string;
  };
}

// 組織情報更新リクエスト

// 作業セッションの状態を表す
// - 'in_progress': 見守り中
// - 'completed': 正常終了
// - 'cancelled': 管理者などによるキャンセル
export type WorkSessionStatus = 'in_progress' | 'completed' | 'cancelled';

// WorkSession の API 表現（/api/v1/work_sessions 系のレスポンス）
// フロントではこれを保持して現在の見守り状態を判定する
export interface WorkSession {
  id: number;
  user_id: number;
  organization_id: number;
  // 作成者（管理者が代行した場合に入り得る）
  created_by_user_id?: number;
  status: WorkSessionStatus;
  started_at: string;
  // 終了時刻（未終了なら null/undefined）
  ended_at?: string | null;
}

// GET /api/v1/work_sessions/current のレスポンス型
// - work_session が null の場合は現在進行中のセッション無し
export interface GetCurrentWorkSessionResponse {
  work_session: WorkSession | null;
}

// SafetyLog の trigger_type を表す（モデルの enum に対応）
// - 'heartbeat': 定期的な生存確認
// - 'sos': 緊急発信
// - 'check_in': ユーザによる手動の元気タッチ等
export type SafetyLogTriggerType = 'heartbeat' | 'sos' | 'check_in';

// POST /api/v1/work_sessions/:id/safety_logs に送るリクエスト型
export interface CreateSafetyLogRequest {
  safety_log: {
    latitude: number;
    longitude: number;
    battery_level: number;
    trigger_type: SafetyLogTriggerType;
    gps_accuracy?: number;
    logged_at?: string;
  };
}

// SafetyLogが作成された際のAPIレスポンス型
export interface SafetyLogResponse {
  id: number;
  work_session_id: number;
  battery_level: number;
  trigger_type: SafetyLogTriggerType;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy?: number | null;
  weather_temp?: number | null;
  weather_condition?: string | null;
  is_offline_sync?: boolean | null;
  logged_at: string;
}

// 組織ダッシュボード用: アクティブな作業セッションの最新位置
export interface LatestLocationPin {
  work_session_id: number;
  user_id: number;
  user_name: string;
  latitude: number;
  longitude: number;
  logged_at: string;
}

// SafetyLog 作成 API の成功レスポンス（RiskAssessment を含む）
export interface CreateSafetyLogResponse {
  status: 'success';
  safety_log: SafetyLogResponse;
  risk_level: 'safe' | 'caution' | 'danger';
  risk_reasons: string[];
  next_poll_interval: number;
  undo_expires_at: string | null;
}

// POST /api/v1/work_sessions/:id/alerts の戻り値で使用
export type AlertType = 'sos' | 'risk_high' | 'risk_medium' | 'battery_low' | 'timeout';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'in_progress' | 'resolved';

export interface AlertResponse {
  id: number;
  work_session_id: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  safety_log_id?: number | null;
  handled_by_user_id?: number | null;
  resolved_at?: string | null;
  created_at?: string;
  updated_at?: string;

  // GET /api/v1/organizations/:organization_id/alerts では、
  // 管理画面で「誰のアラートか」を表示するため、関連情報をネストで返す。
  work_session?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email?: string;
    };
  };
}

// GET /api/v1/work_sessions/:work_session_id/risk_assessments の要素
export type RiskAssessmentLevel = 'safe' | 'caution' | 'danger';

export interface RiskAssessmentResponse {
  id: number;
  logged_at: string | null;
  score: number;
  level: RiskAssessmentLevel;
  details: Record<string, unknown>;
}

// GET /api/v1/organizations/:organization_id/alerts/summary
export interface AlertSummaryResponse {
  counts: {
    unresolved: number;
    open: number;
    in_progress: number;
    urgent_open: number;
  };
  breakdown: {
    urgent: {
      sos_open: number;
      critical_open_non_sos: number;
    };
  };
}

// PATCH /api/v1/organizations/:organization_id/alerts/:id
export interface UpdateOrganizationAlertRequest {
  alert: {
    status: AlertStatus;
  };
}
