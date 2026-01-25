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
export { WORKER } from './worker';
export { DASHBOARD } from './dashboard';
export { ALERT } from './alert';
export { WORK_LOG } from './work-log';
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
  WorkerMonitoringHeading,
  WorkerMonitoringLabel,
  WorkerCheckInLabel,
  WorkerSosLabel,
  WorkerSettingsHeading,
  WorkerNavigation,
  DashboardNavigation,
  DashboardCardTitle,
  AlertPageHeading,
  AlertTableHeader,
  AlertFilter,
  WorkLogPageHeading,
  WorkLogTab,
  WorkLogBasicInfoField,
} from './types';
