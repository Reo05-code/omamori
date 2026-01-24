'use client';

import React, { useState, useEffect } from 'react';
import { createInvitation } from '../../lib/api/invitations';
import { COMMON } from '@/constants/ui-messages/common';
import { INVITATION } from '@/constants/ui-messages/organization';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: InviteMemberModalProps): JSX.Element | null {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'worker' | 'admin'>('worker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルを閉じた際にフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setRole('worker');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!email.trim()) {
      setError(INVITATION.ERRORS.EMAIL_REQUIRED);
      return;
    }

    if (!validateEmail(email)) {
      setError(INVITATION.ERRORS.EMAIL_INVALID);
      return;
    }

    setIsSubmitting(true);

    try {
      await createInvitation(organizationId, email, role);

      // 成功時の処理
      // 成功メッセージは親に委譲
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';

      switch (errorMessage) {
        case 'already_member':
          setError(INVITATION.ERRORS.ALREADY_MEMBER);
          break;
        case 'already_invited':
          setError(INVITATION.ERRORS.ALREADY_INVITED);
          break;
        case 'invalid_role':
          setError('無効なロールが指定されました');
          break;
        case 'forbidden':
          setError(INVITATION.ERRORS.PERMISSION_DENIED);
          break;
        default:
          setError(INVITATION.ERRORS.SEND_FAILED);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // モーダル外側クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{INVITATION.HEADINGS.INVITE_MEMBER}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* メールアドレス入力 */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {INVITATION.LABELS.EMAIL}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={INVITATION.PLACEHOLDERS.EMAIL}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* ロール選択 */}
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              ロール
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'worker' | 'admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {COMMON.BUTTONS.CANCEL}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? INVITATION.BUTTONS.SENDING : INVITATION.BUTTONS.SEND}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
