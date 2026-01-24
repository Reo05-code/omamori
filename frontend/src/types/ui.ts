/**
 * UI コンポーネント用の型定義
 */

export type NotificationType = 'success' | 'error' | 'info';

export type Notification = {
  message: string;
  type: NotificationType;
};
