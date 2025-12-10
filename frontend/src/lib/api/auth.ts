/**
 * 認証系API
 * ログイン、ログアウト、サインアップなどの認証処理
 */

import { api } from "./client";
import { API_PATHS } from "./paths";
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordUpdateRequest,
  PasswordUpdateResponse,
  SignUpRequest,
  SignUpResponse,
  ValidateTokenResponse,
} from "./types";

/**
 * ログイン
 */
export async function login(email: string, password: string) {
  const body: LoginRequest = { email, password };
  return api.post<LoginResponse>(API_PATHS.AUTH.SIGN_IN, body);
}

/**
 * ログアウト
 */
export async function logout() {
  const result = await api.delete(API_PATHS.AUTH.SIGN_OUT);
  return result;
}

/**
 * サインアップ
 */
export async function signUp(
  email: string,
  password: string,
  passwordConfirmation: string,
  name: string,
  phoneNumber: string
) {
  const body: SignUpRequest = {
    email,
    password,
    password_confirmation: passwordConfirmation,
    name,
    phone_number: phoneNumber,
  };
  return api.post<SignUpResponse>(API_PATHS.AUTH.SIGN_UP, body);
}

/**
 * トークン検証（現在のユーザーを取得）
 */
export async function validateToken() {
  return api.get<ValidateTokenResponse>(API_PATHS.AUTH.VALIDATE_TOKEN);
}

/**
 * パスワードリセットメール送信
 */
export async function requestPasswordReset(email: string, redirectUrl: string) {
  // クライアント側でも最低限のバリデーションを行い、不正な入力は即時に拒否する
  const trimmed = email?.trim() ?? ''
  if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
    // 入力バリデーションエラーは例外として投げる（呼び出し側で catch して表示する想定）
    throw new Error('有効なメールアドレスを入力してください')
  }

  const body: PasswordResetRequest = {
    email: trimmed,
    redirect_url: redirectUrl,
  };

  return api.post<PasswordResetResponse>(API_PATHS.AUTH.PASSWORD, body);
}

/**
 * パスワード変更
 */
export async function updatePassword(
  password: string,
  passwordConfirmation: string,
  headers?: Record<string, string>
) {
  const body: PasswordUpdateRequest = {
    password,
    password_confirmation: passwordConfirmation,
  };
  return api.put<PasswordUpdateResponse>(API_PATHS.AUTH.PASSWORD, body, { headers });
}
