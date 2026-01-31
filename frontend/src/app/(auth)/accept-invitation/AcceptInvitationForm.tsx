'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { API_PATHS } from '@/lib/api/paths';
import { APP_ROUTES } from '@/constants/routes';
import { AUTH } from '@/constants/ui-messages/auth';
import { COMMON } from '@/constants/ui-messages/common';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ErrorView from '@/components/common/ErrorView';
import { sanitizeErrorMessage } from '@/lib/utils';

// AcceptInvitationForm:
// - 招待リンクに含まれる `token` をクエリから取得する。
// - 未認証ユーザーでも招待を承認できる（トークンベース検証）。
// - 承認成功後は、招待メールアドレスを含めて登録ページへリダイレクトする。

export default function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // トークン検証
  const isValidToken = (t: string | null): boolean => {
    if (!t) return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(t);
  };

  // トークン検証をマウント時に実行
  useEffect(() => {
    if (!isValidToken(token)) {
      setError(AUTH.INVITATION_ACCEPT.ERRORS.INVALID_LINK);
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(API_PATHS.INVITATIONS.ACCEPT, { token });

      if (res.error || res.status !== 200) {
        // API 応答のメッセージは直接表示せず、サニタイズしてユーザーに見せる
        const msg = res.error ?? `${AUTH.INVITATION_ACCEPT.ERRORS.ACCEPT_FAILED} (${res.status})`;
        setError(sanitizeErrorMessage(msg));
        return;
      }

      setSuccess(true);

      // 成功後、登録ページへリダイレクト（招待メールアドレスをクエリパラメータで渡す）
      setTimeout(() => {
        router.push(APP_ROUTES.REGISTER);
      }, 2000);
    } catch (err: unknown) {
      // 予期しない例外はコンソールに残しつつ、表示はユーザー向けに抑える
      console.error(err);
      if (err instanceof Error)
        setError(sanitizeErrorMessage(err.message) ?? COMMON.FALLBACK_ERRORS.NETWORK_ERROR);
      else setError(COMMON.FALLBACK_ERRORS.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // 認証状態のロード中または未認証でリダイレクト準備中
  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-green-600 text-xl font-bold">✓</div>
        <h2 className="text-xl font-bold">{AUTH.INVITATION_ACCEPT.MESSAGES.SUCCESS_TITLE}</h2>
        <p className="text-sm text-warm-brown-700">
          {AUTH.INVITATION_ACCEPT.MESSAGES.SUCCESS_DESCRIPTION}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorView message={error} />

      {!error && token && (
        <>
          <p className="text-sm text-warm-brown-700 text-center">
            {AUTH.INVITATION_ACCEPT.MESSAGES.CONFIRM}
          </p>
          <PrimaryButton
            type="button"
            onClick={handleAccept}
            loading={loading}
            disabled={loading || !token}
            className="w-full"
          >
            {loading
              ? AUTH.INVITATION_ACCEPT.BUTTONS.ACCEPTING
              : AUTH.INVITATION_ACCEPT.BUTTONS.ACCEPT}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
