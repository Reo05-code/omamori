import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_PATHS } from '../lib/api/paths';

// 認証フック
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // ローカルストレージからトークンを取得
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // ログイン処理
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(API_PATHS.AUTH.SIGN_IN, {
        email,
        password,
      });

      const { token } = response.data;
      localStorage.setItem('authToken', token);
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('ログインに失敗しました', error);
      throw error;
    }
  };

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, token, login, logout };
};
