'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import ErrorView from '@/components/common/ErrorView';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { InviteMemberModal } from '@/components/organization/InviteMemberModal';
import type { Invitation } from '@/lib/api/types';
import { deleteInvitation, fetchInvitations } from '@/lib/api/invitations';

type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
};

// todo utils などに移動する
function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return '—';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function InvitationsList({
  organizationId,
  onNotify,
}: {
  organizationId: string;
  onNotify: (n: Notification) => void;
}): JSX.Element {
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル制御
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // 削除対象の管理
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --------------------------------------------------------------------------
  // Derived State
  // --------------------------------------------------------------------------
  const pendingInvitations = useMemo(() => {
    const list = invitations ?? [];
    const now = Date.now();

    return list.filter((inv) => {
      // 承認済みのものは除外
      if (inv.accepted_at) return false;
      // 期限切れでないものを表示 (nullは無期限とみなす仕様と仮定)
      if (!inv.expires_at) return true;

      const t = new Date(inv.expires_at).getTime();
      return !Number.isNaN(t) && t > now;
    });
  }, [invitations]);

  // --------------------------------------------------------------------------
  // Effects & Handlers
  // --------------------------------------------------------------------------
  const fetchList = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await fetchInvitations(organizationId, signal);
        setInvitations(data);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') throw e;
        throw e; // 親の呼び出し元でキャッチさせる
      }
    },
    [organizationId],
  );

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchList(controller.signal);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        console.error('failed to fetch invitations', e);
        setError('読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [fetchList]);

  const handleDeleteClick = (inv: Invitation) => {
    setInvitationToDelete(inv);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const target = invitationToDelete;
    if (!target) return;

    setDeletingId(target.id);
    setIsConfirmOpen(false); // 先にモーダルを閉じる

    try {
      await deleteInvitation(organizationId, target.id);

      onNotify({ message: '招待を削除しました', type: 'success' });

      // UX向上: サーバーへの再取得を待たずに、UIから即座に消す
      setInvitations((prev) => (prev ? prev.filter((i) => i.id !== target.id) : prev));

      // 念の為、バックグラウンドで最新データを同期する（ユーザーを待たせない）
      fetchList().catch(console.error);
    } catch (e: unknown) {
      console.error('failed to delete invitation', e);
      const message = e instanceof Error ? e.message : '削除に失敗しました';
      onNotify({ message, type: 'error' });
    } finally {
      setDeletingId(null);
      setInvitationToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">招待</h2>
        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
        >
          新規招待
        </button>
      </div>
      {loading && <p className="text-gray-500 py-4">読み込み中です...</p>}
      {!loading && error && <ErrorView message={error} />}
      {!loading && !error && (
        <>
          {pendingInvitations.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">保留中の招待はありません</p>
            </div>
          ) : (
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      メールアドレス
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      招待日時
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingInvitations.map((inv) => (
                    <tr
                      key={inv.id}
                      className={deletingId === inv.id ? 'opacity-50 bg-gray-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inv.invited_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(inv.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(inv)}
                          disabled={deletingId === inv.id}
                          className="text-red-600 hover:text-red-900 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                        >
                          {deletingId === inv.id ? '削除中...' : '削除'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={organizationId}
        onSuccess={() => {
          onNotify({ message: '招待メールを送信しました', type: 'success' });
          // 新規作成時はリストの順序が変わる可能性があるため、正直にリロードする
          fetchList().catch(console.error);
        }}
      />
      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={isConfirmOpen}
        title="招待を取り消しますか？"
        description={
          invitationToDelete
            ? `${invitationToDelete.invited_email} への招待リンクを無効化します。この操作は取り消せません。`
            : ''
        }
        confirmText="削除する"
        cancelText="キャンセル"
        confirmDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setInvitationToDelete(null);
        }}
      />
    </div>
  );
}
