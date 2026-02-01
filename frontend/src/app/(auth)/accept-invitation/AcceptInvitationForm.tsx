'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { validateToken } from '@/lib/api/auth';
import { API_PATHS } from '@/lib/api/paths';
import { APP_ROUTES } from '@/constants/routes';
import { AUTH } from '@/constants/ui-messages/auth';
import { COMMON } from '@/constants/ui-messages/common';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ErrorView from '@/components/common/ErrorView';
import { sanitizeErrorMessage } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// AcceptInvitationForm:
// - 新しいフロー: Preview -> Auth -> Accept
// - 未認証ユーザーは招待情報をプレビューし、新規登録へ遷移
// - 認証済みユーザーは直接受け入れができる
// - 受け入れ成功後、ロールに基づいてリダイレクト（worker -> /worker, admin -> /dashboard/organizations/:id）

type PreviewStatus = 'pending' | 'accepted' | 'expired';

interface PreviewData {
  status: PreviewStatus;
  organization_name: string | null;
  organization_id: number | null;
  role: 'worker' | 'admin';
  invited_email: string;
}

interface AcceptResponse {
  message: string;
  membership: {
    id: number;
    organization_id: number;
    role: 'worker' | 'admin';
  };
}

export default function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorContext, setErrorContext] = useState<'email_mismatch' | 'invalid' | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [accepting, setAccepting] = useState(false);
  const { logout } = useAuth();

  const resolveErrorMessage = (res: {
    error: string | null;
    errorBody?: unknown | null;
  }): string | null => {
    const errorBody = res.errorBody as { error?: string; errors?: string[] } | null | undefined;
    if (errorBody?.error) return errorBody.error;
    if (Array.isArray(errorBody?.errors) && errorBody?.errors[0]) return errorBody.errors[0];
    return res.error;
  };

  // トークン検証
  const isValidToken = (t: string | null): boolean => {
    if (!t) return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(t);
  };

  // 初期化: 認証状態チェックと招待プレビュー取得
  useEffect(() => {
    const initialize = async () => {
      // トークンバリデーション
      if (!isValidToken(token)) {
        setError(AUTH.INVITATION_ACCEPT.ERRORS.INVALID_LINK);
        setErrorContext('invalid');
        setLoading(false);
        return;
      }

      try {
        // 認証状態確認
        const authRes = await validateToken();
        const authenticated = authRes.status === 200 && authRes.data?.data?.id != null;
        setIsAuthenticated(authenticated);

        // 招待プレビュー取得
        const previewRes = await api.get<PreviewData>(API_PATHS.INVITATIONS.PREVIEW(token!));
        if (previewRes.error || !previewRes.data) {
          setError(
            sanitizeErrorMessage(previewRes.error) ?? AUTH.INVITATION_ACCEPT.ERRORS.PREVIEW_FAILED,
          );
          setErrorContext('invalid');
          setLoading(false);
          return;
        }

        setPreviewData(previewRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Preview initialization error:', err);
        setError(COMMON.FALLBACK_ERRORS.NETWORK_ERROR);
        setErrorContext('invalid');
        setLoading(false);
      }
    };

    initialize();
  }, [token]);

  // 招待受け入れ（認証済みユーザーのみ）
  const handleAccept = async () => {
    if (!token || !isAuthenticated) return;

    setAccepting(true);
    setError(null);
    setErrorContext(null);

    try {
      const res = await api.post<AcceptResponse>(API_PATHS.INVITATIONS.ACCEPT, { token });

      if (res.error || res.status !== 200 || !res.data) {
        const rawMessage = resolveErrorMessage(res);

        if (res.status === 404) {
          setError('この招待は既に使用されているか、無効です。');
          setErrorContext('invalid');
          setAccepting(false);
          return;
        }

        if (res.status === 403) {
          setError('この招待は別のメールアドレス宛です。');
          setErrorContext('email_mismatch');
          setAccepting(false);
          return;
        }

        if (res.status === 409) {
          setError('あなたは既にこの組織のメンバーです。ダッシュボードへ遷移します。');
          setAccepting(false);
          const destination =
            previewData?.role === 'worker' ? APP_ROUTES.WORKER : APP_ROUTES.DASHBOARD;
          setTimeout(() => {
            router.push(destination);
          }, 1500);
          return;
        }

        const msg = rawMessage ?? AUTH.INVITATION_ACCEPT.ERRORS.ACCEPT_FAILED;
        setError(sanitizeErrorMessage(msg));
        setErrorContext(null);
        setAccepting(false);
        return;
      }

      setSuccess(true);

      // ロールベースのリダイレクト
      const { membership } = res.data;
      const destination =
        membership.role === 'worker'
          ? APP_ROUTES.WORKER
          : APP_ROUTES.dashboardOrganization(membership.organization_id);

      setTimeout(() => {
        router.push(destination);
      }, 1500);
    } catch (err: unknown) {
      console.error('Accept error:', err);
      if (err instanceof Error)
        setError(sanitizeErrorMessage(err.message) ?? COMMON.FALLBACK_ERRORS.NETWORK_ERROR);
      else setError(COMMON.FALLBACK_ERRORS.NETWORK_ERROR);
      setErrorContext(null);
      setAccepting(false);
    }
  };

  // 未認証ユーザーを登録へリダイレクト
  const handleGoToRegister = () => {
    const email = previewData?.invited_email ?? '';
    const redirectUrl = `${APP_ROUTES.ACCEPT_INVITATION}?token=${token}`;
    router.push(
      `${APP_ROUTES.REGISTER}?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectUrl)}`,
    );
  };

  const handleGoToLogin = () => {
    const redirectUrl = `${APP_ROUTES.ACCEPT_INVITATION}?token=${token}`;
    router.push(`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const handleLogoutAndLogin = async () => {
    await logout();
    handleGoToLogin();
  };

  // ローディング中
  if (loading) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-warm-brown-700">
          {AUTH.INVITATION_ACCEPT.MESSAGES.LOADING_PREVIEW}
        </p>
      </div>
    );
  }

  // 成功画面
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

  // エラー表示
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorView message={error} />
        {errorContext === 'email_mismatch' && (
          <div className="space-y-2">
            <p className="text-sm text-warm-brown-700 text-center">
              {AUTH.INVITATION_ACCEPT.MESSAGES.EMAIL_MISMATCH}
            </p>
            <PrimaryButton type="button" onClick={handleLogoutAndLogin}>
              {AUTH.INVITATION_ACCEPT.BUTTONS.LOGOUT_AND_LOGIN}
            </PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  // プレビュー表示
  if (previewData) {
    const roleLabel = previewData.role === 'worker' ? '作業者' : '管理者';
    const isPending = previewData.status === 'pending';
    const isAccepted = previewData.status === 'accepted';
    const isExpired = previewData.status === 'expired';

    return (
      <div className="space-y-6">
        <div className="bg-warm-brown-50 p-4 rounded-lg border border-warm-brown-200">
          <p className="text-sm text-warm-brown-700 mb-2">
            {AUTH.INVITATION_ACCEPT.MESSAGES.PREVIEW_INFO(
              previewData.organization_name ?? '組織',
              previewData.role,
            )}
          </p>
          <div className="text-xs text-warm-brown-600 space-y-1">
            <p>組織: {previewData.organization_name ?? '—'}</p>
            <p>役割: {roleLabel}</p>
            <p>招待先メール: {previewData.invited_email}</p>
          </div>
        </div>

        {isAccepted && (
          <div className="space-y-3">
            <p className="text-sm text-warm-brown-700 text-center">
              {AUTH.INVITATION_ACCEPT.MESSAGES.ALREADY_ACCEPTED}
            </p>
            {!isAuthenticated ? (
              <PrimaryButton type="button" onClick={handleGoToLogin}>
                {AUTH.INVITATION_ACCEPT.BUTTONS.GO_TO_LOGIN}
              </PrimaryButton>
            ) : (
              <PrimaryButton
                type="button"
                onClick={() =>
                  router.push(
                    previewData.role === 'worker' ? APP_ROUTES.WORKER : APP_ROUTES.DASHBOARD,
                  )
                }
              >
                {AUTH.INVITATION_ACCEPT.BUTTONS.GO_TO_APP}
              </PrimaryButton>
            )}
          </div>
        )}

        {isExpired && (
          <div className="space-y-3">
            <p className="text-sm text-warm-brown-700 text-center">
              {AUTH.INVITATION_ACCEPT.MESSAGES.EXPIRED}
            </p>
            {!isAuthenticated && (
              <PrimaryButton type="button" onClick={handleGoToLogin}>
                {AUTH.INVITATION_ACCEPT.BUTTONS.GO_TO_LOGIN}
              </PrimaryButton>
            )}
          </div>
        )}

        {isPending && isAuthenticated ? (
          // 認証済み: 受け入れボタン
          <>
            <p className="text-sm text-warm-brown-700 text-center">
              {AUTH.INVITATION_ACCEPT.MESSAGES.CONFIRM}
            </p>
            <PrimaryButton
              type="button"
              onClick={handleAccept}
              loading={accepting}
              disabled={accepting}
              className="w-full"
            >
              {accepting
                ? AUTH.INVITATION_ACCEPT.BUTTONS.ACCEPTING
                : AUTH.INVITATION_ACCEPT.BUTTONS.ACCEPT}
            </PrimaryButton>
          </>
        ) : isPending ? (
          // 未認証: 登録/ログインへの案内
          <>
            <p className="text-sm text-warm-brown-700 text-center">
              {AUTH.INVITATION_ACCEPT.MESSAGES.NEED_REGISTER}
            </p>
            <p className="text-xs text-warm-brown-600 text-center">
              {AUTH.INVITATION_ACCEPT.MESSAGES.NEED_LOGIN}
            </p>
            <PrimaryButton type="button" onClick={handleGoToRegister} className="w-full">
              {AUTH.INVITATION_ACCEPT.BUTTONS.GO_TO_REGISTER}
            </PrimaryButton>
            <PrimaryButton
              type="button"
              onClick={handleGoToLogin}
              className="bg-warm-brown-200 text-warm-brown-700 hover:bg-warm-brown-300"
            >
              {AUTH.INVITATION_ACCEPT.BUTTONS.GO_TO_LOGIN}
            </PrimaryButton>
          </>
        ) : null}
      </div>
    );
  }

  return null;
}
