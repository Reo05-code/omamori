import { useState, useEffect } from 'react';
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
        setAuthError(validateRes.error ?? '認証の確認に失敗しました');
        setAuthErrorStatus(validateRes.status ?? null);
      } catch (e) {
        // 非同期検証が失敗しても特にエラーを投げない
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          setAuthError('認証の確認に失敗しました');
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

      if (res.error) {
        throw new Error(res.error);
      }

      // サーバ側で Cookie がセットされていることを前提に、トークン検証を実行
      try {
        const validateRes = await validateToken();
        if (!validateRes.error && validateRes.data) {
          setIsAuthenticated(true);
          setUser(validateRes.data.data);
          setAuthError(null);
          setAuthErrorStatus(null);
        } else {
          // 成功レスポンスが得られない場合は認証フラグを false のままにする
          setIsAuthenticated(false);
          setUser(null);
          setAuthError(validateRes.error ?? '認証の確認に失敗しました');
          setAuthErrorStatus(validateRes.status ?? null);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setUser(null);
        setAuthError('認証の確認に失敗しました');
        setAuthErrorStatus(0);
      }

      return res;
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

  return {
    isAuthenticated,
    token,
    user,
    loading,
    authError,
    authErrorStatus,
    login,
    logout,
  } as const;
};
