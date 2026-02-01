import { useState, useEffect } from 'react';
import { AUTH } from '@/constants/ui-messages/auth';
import { login as loginApi, logout as logoutApi, validateToken } from '../lib/api/auth';
import type { UserResponse } from '../lib/api/types';

// 認証フック
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorStatus, setAuthErrorStatus] = useState<number | null>(null);

  // 初期化: サーバー側の Cookie ベース認証を検証して認証状態を決定
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const validateRes = await validateToken();
        if (!mounted) return;

        if (!validateRes.error && validateRes.data) {
          setIsAuthenticated(true);
          setUser(validateRes.data.data);
          setAuthError(null);
          setAuthErrorStatus(null);
          return;
        }

        setIsAuthenticated(false);
        setUser(null);
        setAuthError(validateRes.error ?? AUTH.COMMON.ERRORS.VALIDATION_FAILED);
        setAuthErrorStatus(validateRes.status ?? null);
      } catch (e) {
        // 非同期検証が失敗しても特にエラーを投げない
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          setAuthError(AUTH.COMMON.ERRORS.VALIDATION_FAILED);
          setAuthErrorStatus(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ログイン処理: backend 側でレスポンスヘッダに認証情報が入る想定の API を呼ぶ
  const login = async (email: string, password: string) => {
    try {
      const res = await loginApi(email, password);

      if (res.error) throw new Error(res.error);

      // サーバ側で Cookie がセットされていることを前提に、トークン検証を実行
      const validateRes = await validateToken();

      if (validateRes.error || !validateRes.data) {
        setIsAuthenticated(false);
        setUser(null);
        setAuthError(validateRes.error ?? AUTH.COMMON.ERRORS.VALIDATION_FAILED);
        setAuthErrorStatus(validateRes.status ?? null);
        throw new Error(validateRes.error ?? AUTH.COMMON.ERRORS.VALIDATION_RETRY);
      }

      const validatedUser: UserResponse = validateRes.data.data;
      setIsAuthenticated(true);
      setUser(validatedUser);
      setAuthError(null);
      setAuthErrorStatus(null);

      return validatedUser;
    } catch (error) {
      console.error('ログインに失敗しました', error);
      throw error;
    }
  };

  // ログアウト処理: サーバーへの削除リクエストを投げ、クライアント側のヘッダも削除
  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn('logout API call failed', e);
    }

    // サーバー側でセッションを破棄（Set-Cookie による削除）した上でクライアント状態を初期化
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setAuthError(null);
    setAuthErrorStatus(null);
  };

  // ユーザー情報を再取得
  const refreshUser = async () => {
    try {
      const validateRes = await validateToken();
      if (!validateRes.error && validateRes.data) {
        setUser(validateRes.data.data);
        return validateRes.data.data;
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
    return null;
  };

  // ユーザー情報を安全に更新（IDチェック付き）
  const updateUser = (updatedUser: UserResponse) => {
    // 現在のユーザーIDと一致するか確認（セキュリティ対策）
    if (user && updatedUser.id === user.id) {
      setUser(updatedUser);
    } else if (process.env.NODE_ENV === 'development') {
      console.error('Cannot update user: ID mismatch or no current user');
    }
  };

  // 登録成功後に呼び出され、Cookie から認証状態を再取得
  const revalidate = async () => {
    setLoading(true);
    try {
      const validateRes = await validateToken();
      if (validateRes.error || !validateRes.data) {
        setIsAuthenticated(false);
        setUser(null);
        setAuthError(validateRes.error ?? AUTH.COMMON.ERRORS.VALIDATION_FAILED);
        return;
      }
      setIsAuthenticated(true);
      setUser(validateRes.data.data);
      setAuthError(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    token,
    user,
    updateUser,
    loading,
    authError,
    authErrorStatus,
    login,
    logout,
    refreshUser,
    revalidate,
  } as const;
};
