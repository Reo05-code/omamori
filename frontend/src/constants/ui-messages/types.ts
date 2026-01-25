/**
 * UIメッセージ定数の型定義
 */

import { COMMON } from './common';
import { AUTH } from './auth';
import { ORGANIZATION, MEMBER, INVITATION } from './organization';
import { WORKER } from './worker';
import { DASHBOARD } from './dashboard';
import { ALERT } from './alert';
import { WORK_LOG } from './work-log';

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

// ========================================
// WORKER 型
// ========================================
export type WorkerMonitoringHeading =
  (typeof WORKER.MONITORING.HEADINGS)[keyof typeof WORKER.MONITORING.HEADINGS];
export type WorkerMonitoringLabel =
  (typeof WORKER.MONITORING.LABELS)[keyof typeof WORKER.MONITORING.LABELS];
export type WorkerCheckInLabel =
  (typeof WORKER.CHECK_IN.LABELS)[keyof typeof WORKER.CHECK_IN.LABELS];
export type WorkerSosLabel = (typeof WORKER.SOS.LABELS)[keyof typeof WORKER.SOS.LABELS];
export type WorkerSettingsHeading =
  (typeof WORKER.SETTINGS.HEADINGS)[keyof typeof WORKER.SETTINGS.HEADINGS];
export type WorkerNavigation = (typeof WORKER.NAVIGATION)[keyof typeof WORKER.NAVIGATION];

// ========================================
// DASHBOARD 型
// ========================================
export type DashboardNavigation =
  (typeof DASHBOARD.NAVIGATION.ITEMS)[keyof typeof DASHBOARD.NAVIGATION.ITEMS];
export type DashboardCardTitle =
  | (typeof DASHBOARD.CARDS.ACTIVE_WORKERS)[keyof typeof DASHBOARD.CARDS.ACTIVE_WORKERS]
  | (typeof DASHBOARD.CARDS.ALERTS)[keyof typeof DASHBOARD.CARDS.ALERTS]
  | (typeof DASHBOARD.CARDS.RECENT_ALERTS)[keyof typeof DASHBOARD.CARDS.RECENT_ALERTS]
  | (typeof DASHBOARD.CARDS.MAP)[keyof typeof DASHBOARD.CARDS.MAP];

// ========================================
// ALERT 型
// ========================================
export type AlertPageHeading = (typeof ALERT.PAGE)[keyof typeof ALERT.PAGE];
export type AlertTableHeader = (typeof ALERT.TABLE.HEADERS)[keyof typeof ALERT.TABLE.HEADERS];
export type AlertFilter = (typeof ALERT.FILTERS)[keyof typeof ALERT.FILTERS];

// ========================================
// WORK_LOG 型
// ========================================
export type WorkLogPageHeading = (typeof WORK_LOG.PAGE)[keyof typeof WORK_LOG.PAGE];
export type WorkLogTab = (typeof WORK_LOG.TABS)[keyof typeof WORK_LOG.TABS];
export type WorkLogBasicInfoField =
  (typeof WORK_LOG.BASIC_INFO.FIELDS)[keyof typeof WORK_LOG.BASIC_INFO.FIELDS];
