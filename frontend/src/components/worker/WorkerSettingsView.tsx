'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { AUTH } from '@/constants/ui-messages/auth';
import { WORKER } from '@/constants/ui-messages';
import LogoutButton from '../ui/LogoutButton';
import AppIcon from '../ui/AppIcon';
import SetHomeLocationModal from './SetHomeLocationModal';
import { NotificationType } from '@/types/ui';
import type { UserResponse } from '@/lib/api/types';

type Props = {
  onNotify: (message: string, type: NotificationType) => void;
  onUpdateUser?: (updatedUser: UserResponse) => void;
};

/**
 * Worker 設定画面ビュー
 *
 * @description
 * Worker（見守り対象者）向けの設定画面コンポーネント。
 * 現在はログアウト機能のみだが、将来的に通知設定や言語設定などを追加可能。
 */
export default function WorkerSettingsView({ onNotify, onUpdateUser }: Props) {
  const { user } = useAuthContext();
  const [showLocationModal, setShowLocationModal] = useState(false);

  // バックエンドから home_latitude と home_longitude が正しく返ってくることを前提にする
  const hasHomeLocation = !!(user?.home_latitude && user?.home_longitude);

  return (
    <div className="space-y-5">
      {/* ページタイトル */}
      <div className="border-b border-warm-brown-200 pb-4">
        <h1 className="text-2xl font-bold text-warm-brown-800">{WORKER.SETTINGS.HEADINGS.TITLE}</h1>
        <p className="text-sm text-warm-brown-600 mt-1">{WORKER.SETTINGS.HEADINGS.DESCRIPTION}</p>
      </div>

      {/* 拠点設定セクション */}
      <section className="bg-white rounded-xl border border-warm-brown-200 shadow-soft overflow-hidden">
        <div className="px-5 py-4 bg-warm-surface border-b border-warm-brown-200">
          <div className="flex items-center gap-2">
            <AppIcon name="map" className="text-warm-brown-700 text-xl" />
            <h2 className="text-lg font-bold text-warm-brown-800">
              {WORKER.SETTINGS.HEADINGS.HOME_LOCATION}
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-warm-brown-800 mb-2">
              {WORKER.SETTINGS.HEADINGS.HOME_LOCATION_ITEM}
            </h3>
            {hasHomeLocation ? (
              <div className="space-y-2">
                <p className="text-sm text-warm-brown-600">
                  {WORKER.SETTINGS.MESSAGES.HOME_LOCATION_SET}
                </p>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {WORKER.SETTINGS.BUTTONS.CHANGE_HOME_LOCATION}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-warm-brown-600 mb-3">
                  {WORKER.SETTINGS.MESSAGES.HOME_LOCATION_NOT_SET}
                </p>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {WORKER.SETTINGS.BUTTONS.SET_HOME_LOCATION}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* アカウント管理セクション */}
      <section className="bg-white rounded-xl border border-warm-brown-200 shadow-soft overflow-hidden">
        <div className="px-5 py-4 bg-warm-surface border-b border-warm-brown-200">
          <div className="flex items-center gap-2">
            <AppIcon name="settings" className="text-warm-brown-700 text-xl" />
            <h2 className="text-lg font-bold text-warm-brown-800">
              {WORKER.SETTINGS.HEADINGS.ACCOUNT_MANAGEMENT}
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* ログアウトセクション */}
          <div>
            <h3 className="text-sm font-semibold text-warm-brown-800 mb-2">
              {AUTH.LOGOUT.HEADINGS.TITLE}
            </h3>
            <p className="text-sm text-warm-brown-600 mb-4">{AUTH.LOGOUT.MESSAGES.DESCRIPTION}</p>
            <LogoutButton
              onSuccess={() => onNotify(AUTH.LOGOUT.MESSAGES.SUCCESS, 'success')}
              onError={(message) => onNotify(message, 'error')}
              variant="danger"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </section>

      {/* 将来の拡張: 通知設定、言語設定などをここに追加可能 */}

      {/* 拠点設定モーダル */}
      <SetHomeLocationModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onCompleted={(updatedUser) => {
          // 更新されたユーザー情報を親に渡す
          if (updatedUser) {
            onUpdateUser?.(updatedUser);
          }
          setShowLocationModal(false);
          onNotify(WORKER.SETTINGS.MESSAGES.HOME_LOCATION_UPDATED, 'success');
        }}
      />
    </div>
  );
}
