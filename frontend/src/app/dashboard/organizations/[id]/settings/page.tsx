'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AUTH } from '@/constants/ui-messages/auth';
import { NOTIFICATION } from '@/constants/ui-messages/notification';
import { ORGANIZATION } from '@/constants/ui-messages/organization';
import { useAuthContext } from '@/context/AuthContext';
import { getUserRole } from '@/lib/permissions';
import NotificationBanner from '@/components/ui/NotificationBanner';
import ErrorView from '@/components/common/ErrorView';
import AppIcon from '@/components/ui/AppIcon';
import {
  OrganizationInfoForm,
  type Notification,
} from '@/components/organization/OrganizationInfoForm';
import { InvitationsList } from '@/components/organization/InvitationsList';
import { MembersList } from '@/components/organization/MembersList';
import LogoutButton from '@/components/ui/LogoutButton';

export default function OrganizationSettingsPage(): JSX.Element {
  const params = useParams();
  // idが存在しない可能性も考慮し、string型ガードを入れる
  const orgId = typeof params?.id === 'string' ? params.id : null;

  const { user, loading: authLoading } = useAuthContext();
  const [notification, setNotification] = useState<Notification | null>(null);

  // 権限チェック
  const { canView, isReady } = useMemo(() => {
    if (authLoading) return { canView: false, isReady: false };
    if (!user || !orgId) return { canView: false, isReady: true };

    const role = getUserRole(user, orgId);
    return { canView: role === 'admin', isReady: true };
  }, [user, orgId, authLoading]);

  // ローディング状態
  if (!isReady) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <span className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-warm-orange animate-spin" />
      </div>
    );
  }

  // ログインしていない、またはIDがおかしい
  if (!user || !orgId) {
    return (
      <div className="p-6">
        <ErrorView message={ORGANIZATION.ERRORS.LOAD_FAILED} />
      </div>
    );
  }

  // 権限がない場合 (useEffectを使わず即時リターン)
  if (!canView) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">設定</h1>
        </div>
        <div className="mt-4">
          <ErrorView message={ORGANIZATION.ERRORS.LOAD_FAILED} />
        </div>
        <div className="mt-4">
          <Link
            href={`/dashboard/organizations/${orgId}`}
            className="text-sm text-blue-600 hover:underline flex items-center"
          >
            <AppIcon name="chevron_left" className="mr-1" />
            {ORGANIZATION.HEADINGS.BACK_TO_TOP}
          </Link>
        </div>
      </div>
    );
  }

  // メインコンテンツ
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {ORGANIZATION.HEADINGS.SETTINGS}
        </h1>
        <Link
          href={`/dashboard/organizations/${orgId}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors flex items-center"
        >
          <AppIcon name="chevron_left" className="mr-1 text-lg" />
          {ORGANIZATION.HEADINGS.BACK_TO_DASHBOARD}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 組織情報フォーム */}
        <section className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {ORGANIZATION.HEADINGS.BASIC_INFO}
            </h2>
          </div>
          <div className="p-6">
            <OrganizationInfoForm organizationId={orgId} onNotify={setNotification} />
          </div>
        </section>

        {/* 招待リスト */}
        <section className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">招待中のユーザー</h2>
          </div>
          <div className="p-6">
            <InvitationsList organizationId={orgId} onNotify={setNotification} />
          </div>
        </section>

        {/* メンバーリスト */}
        <section className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">メンバー管理</h2>
          </div>
          <div className="p-6">
            <MembersList
              organizationId={orgId}
              currentUserId={user.id}
              onNotify={setNotification}
            />
          </div>
        </section>

        {/* アカウント管理 */}
        <section className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">アカウント管理</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {AUTH.LOGOUT.HEADINGS.TITLE}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {AUTH.LOGOUT.MESSAGES.DESCRIPTION}
                </p>
                <LogoutButton
                  onSuccess={() =>
                    setNotification({
                      message: NOTIFICATION.AUTH.LOGOUT_SUCCESS,
                      type: 'success',
                    })
                  }
                  onError={(message) => setNotification({ message, type: 'error' })}
                  variant="danger"
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
