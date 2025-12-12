'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import { useAuthContext } from '@/context/AuthContext';

export default function Page() {
  const router = useRouter();
  const { login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);

      // lib/api/auth.login の戻り値設計に応じてエラーチェック
      if (res && (res as any).error) {
        setError((res as any).error || '認証に失敗しました');
        return;
      }

      // ログイン成功: トップへリダイレクト
      router.push('/');
    } catch (err: any) {
      console.error('login error', err);
      setError(err?.message || '通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}
