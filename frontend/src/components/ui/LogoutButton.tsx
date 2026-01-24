'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { normalizeErrorMessage } from '@/lib/api/error-utils';
import ConfirmModal from './ConfirmModal';
import PrimaryButton from './PrimaryButton';

type Props = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  variant?: 'default' | 'danger';
};

/**
 * ログアウトボタンコンポーネント
 *
 * @description
 * 確認モーダル付きのログアウトボタン。
 * useAuth フックを使用してログアウト API を呼び出し、
 * 成功時にログイン画面へリダイレクトします。
 *
 * @features
 * - 誤操作防止のための確認モーダル
 * - ローディング状態管理
 * - エラーハンドリング
 * - 成功時の通知とリダイレクト
 */
export default function LogoutButton({
  onSuccess,
  onError,
  className = '',
  variant = 'default',
}: Props) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogoutRequest = () => {
    setShowConfirmModal(true);
  };

  const handleLogoutConfirm = async () => {
    setLoading(true);
    try {
      await logout();
      setShowConfirmModal(false);
      onSuccess?.();
      router.push('/');
    } catch (error) {
      const { message } = normalizeErrorMessage(error);
      onError?.(message);
      // エラー時はモーダルを開いたままにする
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const buttonVariant = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : '';

  return (
    <>
      <PrimaryButton
        onClick={handleLogoutRequest}
        disabled={loading}
        className={`${buttonVariant} ${className}`}
        aria-label="ログアウト"
      >
        {loading ? 'ログアウト中...' : 'ログアウト'}
      </PrimaryButton>

      <ConfirmModal
        open={showConfirmModal}
        title="ログアウトしますか？"
        description="ログアウトすると、再度ログインが必要になります。"
        confirmText="ログアウト"
        cancelText="キャンセル"
        confirmDanger={true}
        loading={loading}
        onConfirm={handleLogoutConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
