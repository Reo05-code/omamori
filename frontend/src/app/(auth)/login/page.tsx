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

      // ログイン成功: ユーザーのロールに応じて遷移先を決定
      if (res.data?.data) {
        const user = res.data.data;
        const memberships = user.memberships || [];

        // ロールによる分岐処理
        // adminロールを持っているか確認
        const hasAdminRole = memberships.some((m) => m.role === 'admin');
        // workerロールのみ持っているか確認
        const hasOnlyWorkerRole =
          memberships.length > 0 && memberships.every((m) => m.role === 'worker') && !hasAdminRole;

        if (hasAdminRole) {
          // 管理者権限があれば組織ダッシュボードへ（可能なら所属組織の1つ目へ）
          const adminMembership = memberships.find((m) => m.role === 'admin');
          const orgId = adminMembership?.organization_id ?? null;
          if (orgId) {
            router.push(`/dashboard/organizations/${orgId}`);
          } else {
            router.push('/dashboard');
          }
        } else if (hasOnlyWorkerRole) {
          // 作業員のみの権限ならworker画面へ直行
          router.push('/worker');
        } else if (memberships.length === 0) {
          // メンバーシップがない場合もダッシュボードへ（組織作成画面が表示される）
          router.push('/dashboard');
        } else {
          // それ以外の場合もダッシュボードへ
          router.push('/dashboard');
        }
      } else {
        // レスポンスにユーザー情報がない場合はダッシュボードへ
        router.push('/dashboard');
      }
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
