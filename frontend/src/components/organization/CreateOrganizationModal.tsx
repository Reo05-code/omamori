'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api/client';
import { API_PATHS } from '../../lib/api/paths';
import { COMMON } from '@/constants/ui-messages/common';
import { ORGANIZATION } from '@/constants/ui-messages/organization';

type Organization = {
  id: number;
  name: string;
  created_at?: string;
};

type Props = {
  open: boolean;
  // 親でrouter.refreshを呼ぶ
  onCreated?: (org: Organization) => void;
  onClose?: () => void;
  // ハードブロッキング（オンボーディング中に閉じさせない）
  forceCreate?: boolean;
};

export default function CreateOrganizationModal({ open, onCreated, forceCreate, onClose }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  // モーダル表示時の背景スクロール禁止と ESC キーでのクローズ処理
  const handleClose = useCallback(() => {
    if (forceCreate) return;
    onClose?.();
  }, [forceCreate, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, handleClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(ORGANIZATION.ERRORS.NAME_REQUIRED);
      return;
    }

    setLoading(true);
    try {
      // /api 以下の Next.js API ルートを経由する想定
      const res = await api.post<Organization>(API_PATHS.ORGANIZATIONS.BASE, {
        organization: { name: name.trim() },
      });

      if (res.error) {
        setError(res.error || ORGANIZATION.ERRORS.CREATE_FAILED);
        return;
      }

      if (!res.data) {
        setError(ORGANIZATION.ERRORS.FETCH_FAILED);
        return;
      }

      // 作成成功
      setName('');
      onCreated?.(res.data);
    } catch (err) {
      setError(ORGANIZATION.ERRORS.LOAD_FAILED_RETRY);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="create-org-title"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => {
          if (!forceCreate) handleClose();
        }}
      />

      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10"
      >
        <h3
          id="create-org-title"
          className="text-lg font-medium text-gray-900 dark:text-white mb-2"
        >
          {ORGANIZATION.HEADINGS.CREATE}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {ORGANIZATION.MESSAGES.STATIC.CREATE_PROMPT}
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="org-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {ORGANIZATION.LABELS.NAME}
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="org-name"
            className="mt-2 mb-3 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={ORGANIZATION.PLACEHOLDERS.NAME}
            aria-label={ORGANIZATION.LABELS.NAME}
          />

          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

          <div className="flex items-center justify-end space-x-2">
            {!forceCreate && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                {COMMON.BUTTONS.CANCEL}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
            >
              {loading ? ORGANIZATION.BUTTONS.CREATING : ORGANIZATION.BUTTONS.CREATE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
