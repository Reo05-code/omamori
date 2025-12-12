/**
 * API専用の型定義
 * APIレスポンス・リクエストに関する型をここに集約
 */

// ユーザーのAPIレスポンス型
export interface UserResponse {
  id: number;
  email: string;
  provider: string;
  uid: string;
  name: string;
  phone_number: string;
  avatar_url: string | null;
  role: 'worker' | 'admin';
  allow_password_change: boolean;
  settings: {
    notification_enabled?: boolean;
    dark_mode?: 'on' | 'off';
  };
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
