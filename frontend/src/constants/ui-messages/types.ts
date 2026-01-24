/**
 * UIメッセージ定数の型定義
 */

import { COMMON } from './common';
import { AUTH } from './auth';
import { ORGANIZATION, MEMBER, INVITATION } from './organization';

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

// ========================================
// ORGANIZATION 型
// ========================================
export type OrganizationHeading =
  (typeof ORGANIZATION.HEADINGS)[keyof typeof ORGANIZATION.HEADINGS];
export type OrganizationLabel = (typeof ORGANIZATION.LABELS)[keyof typeof ORGANIZATION.LABELS];
export type OrganizationButton = (typeof ORGANIZATION.BUTTONS)[keyof typeof ORGANIZATION.BUTTONS];

// ========================================
// MEMBER 型
// ========================================
export type MemberHeading = (typeof MEMBER.HEADINGS)[keyof typeof MEMBER.HEADINGS];
export type MemberLabel = (typeof MEMBER.LABELS)[keyof typeof MEMBER.LABELS];

// ========================================
// INVITATION 型
// ========================================
export type InvitationHeading = (typeof INVITATION.HEADINGS)[keyof typeof INVITATION.HEADINGS];
export type InvitationLabel = (typeof INVITATION.LABELS)[keyof typeof INVITATION.LABELS];
export type InvitationButton = (typeof INVITATION.BUTTONS)[keyof typeof INVITATION.BUTTONS];
