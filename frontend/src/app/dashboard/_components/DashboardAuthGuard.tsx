'use client';

import Link from 'next/link';
import React from 'react';
import ErrorView from '@/components/common/ErrorView';
import { useAuthContext } from '@/context/AuthContext';

export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading, authErrorStatus } = useAuthContext();

  if (loading) {
    return (
      <div className="p-6" role="status" aria-label="読み込み中">
        読み込み中...
      </div>
    );
  }

  const isLoggedIn = isAuthenticated && !!user;

  if (!isLoggedIn) {
    const isServerSideFailure = (authErrorStatus ?? 0) >= 500 || authErrorStatus === 0;
    if (isServerSideFailure) {
      return (
        <div className="p-6">
          <ErrorView message="認証の確認に失敗しました。時間をおいて再読み込みしてください。" />
          <button
            type="button"
            className="text-sm underline"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      );
    }

    return (
      <div className="p-6">
        <p className="mb-2">ログインしてください</p>
        <Link href="/login" className="text-sm underline">
          ログインへ
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
