'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RegisterForm from './RegisterForm';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { COMMON } from '@/constants/ui-messages/common';
import { isValidRedirectPath } from '@/lib/utils/redirects';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, revalidate } = useAuth();
  const [triggerRedirect, setTriggerRedirect] = useState(false);

  const redirectPath = searchParams.get('redirect');

  // 登録成功時のコールバック
  const handleRegisterSuccess = () => {
    setTriggerRedirect(true);
    // 少し待ってから認証状態を再検証
    setTimeout(() => {
      revalidate();
    }, 300);
  };

  // 登録後、認証済みになったら指定されたページへリダイレクト
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (!triggerRedirect) return;

    // リダイレクトパスが有効な場合のみリダイレクト
    if (isValidRedirectPath(redirectPath) && redirectPath) {
      router.push(redirectPath);
    }
  }, [authLoading, isAuthenticated, redirectPath, router, triggerRedirect]);

  // 認証状態のロード中
  if (authLoading) {
    return (
      <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-warm-brown-700">{COMMON.STATUS.AUTHENTICATING}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <Logo variant="small" />
          </div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">Omamori</h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">
            新しいアカウントを作成して、大切な人を見守りましょう。
          </p>
        </div>

        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
          <div className="mt-6 text-center text-sm">
            <p className="text-warm-brown-600">
              すでにアカウントをお持ちですか？
              <Link
                className="font-bold text-warm-brown-700 hover:text-warm-orange transition-colors duration-200 ml-1"
                href="/login"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function RegisterPageFallback() {
  return (
    <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-sm text-warm-brown-700">{COMMON.STATUS.AUTHENTICATING}</p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
