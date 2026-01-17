'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Membership } from '@/lib/api/types';
import { fetchMemberships } from '@/lib/api/memberships';
import { InviteMemberModal } from '@/components/organization/InviteMemberModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { finishSession, startRemoteSession } from '@/lib/api/work_sessions';
import { MemberActionToggle } from '@/components/organization/MemberActionToggle';
import { WorkStatusBadge } from '@/components/organization/WorkStatusBadge';
import { ROLE_LABELS, WORK_STATUS_LABELS } from '@/constants/labels';

type PendingAction =
  | {
      kind: 'start';
      membership: Membership;
    }
  | {
      kind: 'finish';
      membership: Membership;
      workSessionId: number;
    };

export default function MembersPage(): JSX.Element {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const [members, setMembers] = useState<Membership[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  // 操作中のメンバーIDを記録
  const [processingMemberIds, setProcessingMemberIds] = useState<Record<number, boolean>>({});
  // リモート開始/終了時の操作エラー
  const [actionError, setActionError] = useState<string | null>(null);

  // メンバー一覧をサーバーから再取得（楽観的更新後の同期用）
  const refetchMembers = async () => {
    if (!orgId) return;
    const data = await fetchMemberships(orgId);
    setMembers(data);
  };

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchMemberships(orgId)
      .then((data) => setMembers(data))
      .catch((e) => {
        console.error('メンバー一覧の取得に失敗:', e);
        setError('読み込みに失敗しました。時間をおいて再度お試しください。');
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const renderName = (m: Membership) => {
    if (m.email) return m.email.split('@')[0];
    return '（名前なし）';
  };

  const handleInviteSuccess = () => {
    // 招待成功後、メンバー一覧を再取得（オプション）
    if (orgId) {
      refetchMembers().catch((e) => console.error('メンバー一覧の再取得に失敗:', e));
    }
  };

  //「開始」か「終了」かを判断して確認画面を出す
  const openConfirm = (m: Membership) => {
    setActionError(null);

    if (m.active_work_session?.active) {
      const workSessionId = m.active_work_session.id;
      if (typeof workSessionId !== 'number') {
        setActionError('稼働中セッションIDの取得に失敗しました。時間をおいて再度お試しください。');
        return;
      }
      setPendingAction({ kind: 'finish', membership: m, workSessionId });
      return;
    }

    setPendingAction({ kind: 'start', membership: m });
  };

  const setProcessing = (membershipId: number, next: boolean) => {
    setProcessingMemberIds((prev) => ({ ...prev, [membershipId]: next }));
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    if (!orgId) {
      setActionError('組織IDの取得に失敗しました。ページを再読み込みしてください。');
      setPendingAction(null);
      return;
    }

    const action = pendingAction;
    const membershipId = action.membership.id;
    setProcessing(membershipId, true);
    setPendingAction(null);
    setActionError(null);

    try {
      // 楽観的更新: API成功を待ってから即座にローカルstateを更新し、UXを高速化
      if (action.kind === 'start') {
        const started = await startRemoteSession(orgId, action.membership.user_id);
        setMembers((prevMembers) => {
          if (!prevMembers) return prevMembers;
          return prevMembers.map((m) =>
            m.id === action.membership.id
              ? { ...m, active_work_session: { active: true, id: started.id } }
              : m,
          );
        });
      } else {
        await finishSession(action.workSessionId);
        setMembers((prevMembers) => {
          if (!prevMembers) return prevMembers;
          return prevMembers.map((m) =>
            m.id === action.membership.id ? { ...m, active_work_session: undefined } : m,
          );
        });
      }

      // 裏で正式なデータを再取得（サーバー側で遅延がある場合に備える）
      void refetchMembers().catch((e) => console.error('メンバー一覧の再取得に失敗:', e));
    } catch (e) {
      console.error('リモート開始/終了に失敗:', e);
      setActionError(
        action.kind === 'start'
          ? '開始に失敗しました。時間をおいて再度お試しください。'
          : '終了に失敗しました。時間をおいて再度お試しください。',
      );
    } finally {
      setProcessing(membershipId, false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">メンバー一覧</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          メンバーを招待
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">操作結果の反映に数秒かかる場合があります。</p>

      {loading && <p>読み込み中です...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {actionError && <p className="text-red-600">{actionError}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members && members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{renderName(m)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {m.email ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {m.role && m.role in ROLE_LABELS
                        ? ROLE_LABELS[m.role as keyof typeof ROLE_LABELS]
                        : m.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <WorkStatusBadge
                        label={
                          m.active_work_session?.active
                            ? WORK_STATUS_LABELS.active
                            : WORK_STATUS_LABELS.inactive
                        }
                        variant={m.active_work_session?.active ? 'active' : 'inactive'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex flex-col gap-2">
                        <MemberActionToggle
                          member={m}
                          name={renderName(m)}
                          isProcessing={!!processingMemberIds[m.id]}
                          onToggle={openConfirm}
                        />
                        {orgId && (
                          <Link
                            href={`/dashboard/organizations/${orgId}/work_logs?tab=safety_logs&userId=${m.user_id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            作業ログ（移動履歴）
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    メンバーが見つかりません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 招待モーダル */}
      {orgId && (
        <InviteMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          organizationId={orgId}
          onSuccess={handleInviteSuccess}
        />
      )}

      <ConfirmModal
        open={!!pendingAction}
        title={
          pendingAction?.kind === 'start' ? '見守りを開始しますか？' : '見守りを終了しますか？'
        }
        description={
          pendingAction?.kind === 'start'
            ? '開始後、状態反映に数秒かかる場合があります。'
            : '終了後、状態反映に数秒かかる場合があります。'
        }
        confirmText={pendingAction?.kind === 'start' ? '開始' : '終了'}
        cancelText="キャンセル"
        confirmDanger={pendingAction?.kind === 'finish'}
        onConfirm={() => {
          void confirmAction();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
