'use client';

import React, { useEffect } from 'react';
import { COMMON } from '@/constants/ui-messages';
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
      ? 'bg-green-600 text-white'
      : type === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-blue-600 text-white';

  const iconName: AppIconName =
    type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

  return (
    <div
      className="fixed top-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-60 max-w-md"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`${bgClass} rounded-xl shadow-2xl ring-1 ring-black/10 px-4 py-3 flex items-center gap-3 animate-slide-down`}
      >
        <AppIcon name={iconName} className="text-xl" />
        <p className="flex-1 text-sm sm:text-base font-medium break-words">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/80 hover:text-white transition-colors"
          aria-label={COMMON.ARIA_LABELS.CLOSE_NOTIFICATION}
        >
          <AppIcon name="close" className="text-xl" />
        </button>
      </div>
    </div>
  );
}
