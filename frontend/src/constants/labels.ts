// アラート・作業ログ関連の表示ラベル定数

import type { AlertType, AlertSeverity, AlertStatus } from '@/lib/api/types';

export const ALERT_SEVERITY_LABELS = {
  critical: '緊急',
  high: '重要',
  medium: '中',
  low: '低',
} as const satisfies Record<AlertSeverity, string>;

export const ALERT_TYPE_LABELS = {
  sos: 'SOS発信',
  risk_high: '高リスク検知',
  risk_medium: '中リスク検知',
  battery_low: 'バッテリー低下',
  timeout: '通信途絶',
} as const satisfies Record<AlertType, string>;

export const ALERT_STATUS_LABELS = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '解決済み',
} as const satisfies Record<AlertStatus, string>;

export type AlertSeverityLabel = (typeof ALERT_SEVERITY_LABELS)[keyof typeof ALERT_SEVERITY_LABELS];
export type AlertTypeLabel = (typeof ALERT_TYPE_LABELS)[keyof typeof ALERT_TYPE_LABELS];
export type AlertStatusLabel = (typeof ALERT_STATUS_LABELS)[keyof typeof ALERT_STATUS_LABELS];
