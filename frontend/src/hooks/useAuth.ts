import { useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, validateToken } from '../lib/api/auth';

// 認証フック
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // 初期化: サーバー側の Cookie ベース認証を検証して認証状態を決定
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const validateRes = await validateToken();
        if (mounted && !validateRes.error && validateRes.data) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        // 非同期検証が失敗しても特にエラーを投げない
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
        } else {
          // 成功レスポンスが得られない場合は認証フラグを false のままにする
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
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
  };

  return { isAuthenticated, token, login, logout } as const;
};
