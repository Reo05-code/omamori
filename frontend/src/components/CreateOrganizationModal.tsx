"use client";
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api/client';

type Props = {
  open: boolean;
  onCreated?: (org: any) => void;
  // ハードブロッキング（オンボーディング中に閉じさせない）
  forceCreate?: boolean;
};

export default function CreateOrganizationModal({ open, onCreated, forceCreate }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // フォーカス管理
    const input = dialogRef.current?.querySelector('input') as HTMLInputElement | null;
    input?.focus();
  }, [open]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('組織名を入力してください');
      return;
    }

    setLoading(true);
    const res = await api.post<any>('/api/v1/organizations', { organization: { name: name.trim() } });
    setLoading(false);

    if (res.error) {
      setError(res.error || '作成に失敗しました');
      return;
    }

    // 作成成功
    onCreated?.(res.data);
  }

  function handleClose() {
    if (forceCreate) return; // 閉じさせない
    // 親側で open を制御する想定なので nothing
    // 親が閉じるためのコールバックがある場合はそれを呼ぶ（今回は省略）
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">組織を作成</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">まずは組織を作成して始めましょう。</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">組織名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 mb-3 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="会社名、チーム名など"
            aria-label="組織名"
          />

          {error && <div className="text-sm text-danger mb-3">{error}</div>}

          <div className="flex items-center justify-end space-x-2">
            {!forceCreate && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
            >
              {loading ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
