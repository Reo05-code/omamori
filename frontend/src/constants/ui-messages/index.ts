/**
 * UIメッセージ定数
 *
 * アプリケーション全体で使用される汎用的なUIテキストを一元管理
 *
 * @example
 * import { COMMON, AUTH, ORGANIZATION, MEMBER, INVITATION } from '@/constants/ui-messages';
 * <button>{COMMON.BUTTONS.SAVE}</button>
 * <button>{AUTH.LOGIN.BUTTONS.SUBMIT}</button>
 * <h1>{ORGANIZATION.HEADINGS.CREATE}</h1>
 */

export { COMMON } from './common';
export { AUTH } from './auth';
export { ORGANIZATION, MEMBER, INVITATION } from './organization';
export type {
  CommonButton,
  CommonStatus,
  CommonValidation,
  CommonFallbackError,
  CommonAriaLabel,
  AuthLogoutButton,
  AuthLoginButton,
  AuthRegisterButton,
  AuthCommonLabel,
  OrganizationHeading,
  OrganizationLabel,
  OrganizationButton,
  MemberHeading,
  MemberLabel,
  InvitationHeading,
  InvitationLabel,
  InvitationButton,
} from './types';
