'use client';

import React from 'react';
import LogoutButton from '../ui/LogoutButton';
import AppIcon from '../ui/AppIcon';
import { NotificationType } from '@/types/ui';

type Props = {
  onNotify: (message: string, type: NotificationType) => void;
};

/**
 * Worker 設定画面ビュー
 *
 * @description
 * Worker（見守り対象者）向けの設定画面コンポーネント。
 * 現在はログアウト機能のみだが、将来的に通知設定や言語設定などを追加可能。
 */
export default function WorkerSettingsView({ onNotify }: Props) {
  return (
    <div className="space-y-5">
      {/* ページタイトル */}
      <div className="border-b border-warm-brown-200 pb-4">
        <h1 className="text-2xl font-bold text-warm-brown-800">設定</h1>
        <p className="text-sm text-warm-brown-600 mt-1">アカウントの設定を管理します</p>
      </div>

      {/* アカウント管理セクション */}
      <section className="bg-white rounded-xl border border-warm-brown-200 shadow-soft overflow-hidden">
        <div className="px-5 py-4 bg-warm-surface border-b border-warm-brown-200">
          <div className="flex items-center gap-2">
            <AppIcon name="settings" className="text-warm-brown-700 text-xl" />
            <h2 className="text-lg font-bold text-warm-brown-800">アカウント管理</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* ログアウトセクション */}
          <div>
            <h3 className="text-sm font-semibold text-warm-brown-800 mb-2">ログアウト</h3>
            <p className="text-sm text-warm-brown-600 mb-4">
              このアカウントからログアウトします。再度ログインが必要になります。
            </p>
            <LogoutButton
              onSuccess={() => onNotify('ログアウトしました', 'success')}
              onError={(message) => onNotify(message, 'error')}
              variant="danger"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </section>

      {/* 将来の拡張: 通知設定、言語設定などをここに追加可能 */}
    </div>
  );
}
