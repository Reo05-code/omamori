'use client';

import React, { useEffect } from 'react';
import AppIcon, { type AppIconName } from './AppIcon';

type NotificationType = 'success' | 'error' | 'info';

type Props = {
  message: string;
  type?: NotificationType;
  onDismiss: () => void;
  autoDismissMs?: number;
};

/**
 * 画面上部に表示される通知バナー
 * - success: 緑系（開始/終了/送信成功）
 * - error: 赤系（ネットワークエラー等）
 * - info: 青系（既に送信済み等）
 * - aria-live="polite" でスクリーンリーダー対応
 * - 自動消去（デフォルト5秒）
 */
export default function NotificationBanner({
  message,
  type = 'info',
  onDismiss,
  autoDismissMs = 5000,
}: Props) {
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timer = window.setTimeout(() => {
      onDismiss();
    }, autoDismissMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoDismissMs, onDismiss]);

  const bgClass =
    type === 'success'
      ? 'bg-green-500/95 text-white'
      : type === 'error'
        ? 'bg-danger/95 text-white'
        : 'bg-blue-500/95 text-white';

  const iconName: AppIconName =
    type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 ${bgClass} rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm animate-slide-down`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <AppIcon name={iconName} className="text-xl" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="通知を閉じる"
      >
        <AppIcon name="close" className="text-xl" />
      </button>
    </div>
  );
}
