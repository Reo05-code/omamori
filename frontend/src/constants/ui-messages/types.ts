/**
 * UIメッセージ定数の型定義
 */

import { COMMON } from './common';
import { AUTH } from './auth';

// ========================================
// COMMON 型
// ========================================
export type CommonButton = (typeof COMMON.BUTTONS)[keyof typeof COMMON.BUTTONS];
export type CommonStatus = (typeof COMMON.STATUS)[keyof typeof COMMON.STATUS];
export type CommonValidation = (typeof COMMON.VALIDATION)[keyof typeof COMMON.VALIDATION];
export type CommonFallbackError =
  (typeof COMMON.FALLBACK_ERRORS)[keyof typeof COMMON.FALLBACK_ERRORS];
export type CommonAriaLabel = (typeof COMMON.ARIA_LABELS)[keyof typeof COMMON.ARIA_LABELS];

// ========================================
// AUTH 型
// ========================================
export type AuthLogoutButton = (typeof AUTH.LOGOUT.BUTTONS)[keyof typeof AUTH.LOGOUT.BUTTONS];
export type AuthLoginButton = (typeof AUTH.LOGIN.BUTTONS)[keyof typeof AUTH.LOGIN.BUTTONS];
export type AuthRegisterButton = (typeof AUTH.REGISTER.BUTTONS)[keyof typeof AUTH.REGISTER.BUTTONS];
export type AuthCommonLabel = (typeof AUTH.COMMON.LABELS)[keyof typeof AUTH.COMMON.LABELS];
