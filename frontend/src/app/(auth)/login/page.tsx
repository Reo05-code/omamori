'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from './LoginForm';
import { useAuthContext } from '@/context/AuthContext';
import { APP_ROUTES } from '@/constants/routes';
import { USER_ROLES } from '@/constants/roles';
import { isValidRedirectPath } from '@/lib/utils/redirects';
import type { UserResponse } from '@/lib/api/types';

function decideRedirectPath(user: UserResponse, redirectParam: string | null): string {
  // リダイレクトパラメータが有効な場合はそちらを優先
  if (isValidRedirectPath(redirectParam) && redirectParam) {
    return redirectParam;
  }

  const memberships = user.memberships ?? [];

  const adminMembership = memberships.find((m) => m.role === USER_ROLES.ADMIN);
  if (adminMembership) {
    const orgId = adminMembership.organization_id;
    return orgId ? APP_ROUTES.dashboardOrganization(orgId) : APP_ROUTES.DASHBOARD;
  }

  const hasOnlyWorkerRole =
    memberships.length > 0 && memberships.every((m) => m.role === USER_ROLES.WORKER);
  if (hasOnlyWorkerRole) {
    return APP_ROUTES.WORKER;
  }

  return APP_ROUTES.DASHBOARD;
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, loading: authLoading } = useAuthContext();

  const redirectParam = searchParams.get('redirect');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 既にログイン済みなら /login を表示せず適切なページへリダイレクト
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) return;

    router.replace(decideRedirectPath(user, redirectParam));
  }, [authLoading, isAuthenticated, user, redirectParam, router]);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      // 成功 = AuthContext の user が更新された状態。
      // 画面遷移は useEffect に集約して競合を防ぐ。
      await login(email, password);
    } catch (err: unknown) {
      console.error('login error', err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('通信エラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6" role="status" aria-label="読み込み中">
        認証状態を確認中...
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="p-6" role="status" aria-label="読み込み中">
        リダイレクト中...
      </div>
    );
  }

  return <LoginForm onSubmit={handleLogin} loading={loading} error={error} />;
}
