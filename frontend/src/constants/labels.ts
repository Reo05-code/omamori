// アラート・作業ログ関連の表示ラベル定数

import type {
  AlertType,
  AlertSeverity,
  AlertStatus,
  SafetyLogTriggerType,
  RiskAssessmentLevel,
} from '@/lib/api/types';

/**
 * アラート重要度のラベルマップ
 */
export const ALERT_SEVERITY_LABELS = {
  critical: '緊急',
  high: '重要',
  medium: '中',
  low: '低',
} as const satisfies Record<AlertSeverity, string>;

/**
 * アラート種別のラベルマップ
 */
export const ALERT_TYPE_LABELS = {
  sos: 'SOS発信',
  risk_high: '高リスク検知',
  risk_medium: '中リスク検知',
  battery_low: 'バッテリー低下',
  timeout: '通信途絶',
} as const satisfies Record<AlertType, string>;

/**
 * アラート対応状況のラベルマップ
 */
export const ALERT_STATUS_LABELS = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '解決済み',
} as const satisfies Record<AlertStatus, string>;

/**
 * SafetyLogのトリガータイプ（記録理由）のラベルマップ
 */
export const TRIGGER_TYPE_LABELS = {
  heartbeat: '定期通信',
  sos: 'SOS発信',
  check_in: '元気タッチ',
} as const satisfies Record<SafetyLogTriggerType, string>;

/**
 * リスク評価レベルのラベルマップ
 */
export const RISK_ASSESSMENT_LEVEL_LABELS = {
  safe: '安全',
  caution: '注意',
  danger: '危険',
} as const satisfies Record<RiskAssessmentLevel, string>;

/**
 * ユーザーロール（権限）のラベルマップ
 */
export const ROLE_LABELS = {
  admin: '管理者',
  worker: '作業者',
} as const satisfies Record<'admin' | 'worker', string>;

/**
 * 作業ステータスのラベルマップ
 */
export const WORK_STATUS_LABELS = {
  active: '見守り中',
  inactive: '待機中',
} as const;

/**
 * リスク理由コードのラベルマップ
 */
export const RISK_REASON_LABELS: Record<string, string> = {
  high_temperature: '高温環境',
  moderate_heat: '中程度の暑さ',
  low_temperature: '低温環境',
  low_battery: 'バッテリー低下',
  battery_caution: 'バッテリー注意',
  long_inactive: '長時間の不活動',
  short_inactive: '短時間の不活動',
  outside_home: 'ホームエリア外',
  rapid_acceleration: '急激な加速',
  sos_trigger: 'SOS発信',
  offline_too_long: '通信途絶',
  poor_gps_accuracy: 'GPS精度不良',
} as const;

export type AlertSeverityLabel = (typeof ALERT_SEVERITY_LABELS)[keyof typeof ALERT_SEVERITY_LABELS];
export type AlertTypeLabel = (typeof ALERT_TYPE_LABELS)[keyof typeof ALERT_TYPE_LABELS];
export type AlertStatusLabel = (typeof ALERT_STATUS_LABELS)[keyof typeof ALERT_STATUS_LABELS];
export type TriggerTypeLabel = (typeof TRIGGER_TYPE_LABELS)[keyof typeof TRIGGER_TYPE_LABELS];
export type RiskAssessmentLevelLabel =
  (typeof RISK_ASSESSMENT_LEVEL_LABELS)[keyof typeof RISK_ASSESSMENT_LEVEL_LABELS];
export type RoleLabel = (typeof ROLE_LABELS)[keyof typeof ROLE_LABELS];
