'use client';

import Link from 'next/link';
import React from 'react';
import { AUTH } from '@/constants/ui-messages';
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
          <ErrorView message={AUTH.COMMON.ERRORS.VALIDATION_FAILED_DETAIL} />
          <button
            type="button"
            className="text-sm underline"
            onClick={() => window.location.reload()}
          >
            {AUTH.COMMON.BUTTONS.RELOAD}
          </button>
        </div>
      );
    }

    return (
      <div className="p-6">
        <p className="mb-2">{AUTH.LOGIN.MESSAGES.LOGIN_REQUIRED}</p>
        <Link href="/login" className="text-sm underline">
          {AUTH.LOGIN.LINKS.TO_LOGIN}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
