import { useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, validateToken } from '../lib/api/auth';

// 認証フック
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // 初期化: devise_token_auth のヘッダ保存キー `access-token` を参照して認証済み判定
  useEffect(() => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
      if (accessToken) {
        setToken(accessToken);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('unable to access localStorage for auth token', e);
    }
  }, []);

  // ログイン処理: backend 側でレスポンスヘッダに認証情報が入る想定の API を呼ぶ
  const login = async (email: string, password: string) => {
    try {
      const res = await loginApi(email, password);

      if (res.error) {
        throw new Error(res.error);
      }

      // api.client の apiRequest がレスポンスヘッダを localStorage に保存するので、それを読み取る
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
      if (accessToken) setToken(accessToken);

      // トークン検証で現在ユーザー情報を取得しておくと安全
      try {
        const validateRes = await validateToken();
        if (!validateRes.error && validateRes.data) {
          setIsAuthenticated(true);
        }
      } catch {
        // validate が失敗しても一旦認証済みフラグは true にしておく
        setIsAuthenticated(true);
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

    try {
      localStorage.removeItem('access-token');
      localStorage.removeItem('client');
      localStorage.removeItem('uid');
    } catch (e) {
      // ignore
    }

    setToken(null);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, token, login, logout } as const;
};
