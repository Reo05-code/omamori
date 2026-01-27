'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import WorkerShell from '@/components/worker/WorkerShell';
import WorkerSettingsView from '@/components/worker/WorkerSettingsView';
import NotificationBanner from '@/components/ui/NotificationBanner';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import { WORKER, AUTH, COMMON } from '@/constants/ui-messages';
import type { UserResponse } from '@/lib/api/types';

export default function WorkerSettingsPage() {
  const authContext = useAuthContext();
  const { user, loading, updateUser } = authContext;
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const handleNotify = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const handleDismiss = () => {
    setNotification(null);
  };

  const handleUpdateUser = (updatedUser: UserResponse) => {
    if (updateUser) {
      updateUser(updatedUser);
    }
  };

  // 認証確認中
  if (loading) {
    return (
      <WorkerShell>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label={COMMON.STATUS.LOADING} />
        </div>
      </WorkerShell>
    );
  }

  // 未認証
  if (!user) {
    return (
      <WorkerShell>
        <div className="text-center py-12">
          <p className="text-warm-brown-700 mb-4">{AUTH.LOGIN.MESSAGES.LOGIN_REQUIRED}</p>
          <Link href="/" className="text-warm-orange hover:underline font-medium">
            ← {AUTH.LOGIN.LINKS.TO_LOGIN}
          </Link>
        </div>
      </WorkerShell>
    );
  }

  return (
    <WorkerShell>
      {/* 通知バナー */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={handleDismiss}
        />
      )}

      {/* 戻るリンク */}
      <div className="mb-4">
        <Link
          href="/worker"
          className="inline-flex items-center gap-1 text-sm text-warm-brown-600 hover:text-warm-brown-800 transition-colors"
        >
          <AppIcon name="chevron_left" className="text-base" />
          <span>{WORKER.NAVIGATION.BACK_TO_HOME}</span>
        </Link>
      </div>

      {/* 設定画面 */}
      <WorkerSettingsView onNotify={handleNotify} onUpdateUser={handleUpdateUser} />
    </WorkerShell>
  );
}
