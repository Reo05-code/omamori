'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import ErrorView from '@/components/common/ErrorView';
import ConfirmModal from '@/components/ui/ConfirmModal';

import type { Membership, MembershipRole } from '@/lib/api/types';
import {
  deleteMembership,
  fetchMemberships,
  updateMembership,
  type UpdateMembershipRequest,
} from '@/lib/api/memberships';
import { ROLE_LABELS } from '@/constants/labels';
import { MEMBER } from '@/constants/ui-messages/organization';
import { NOTIFICATION } from '@/constants/ui-messages/notification';
import { COMMON } from '@/constants/ui-messages/common';

type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
};

// 表示用ヘルパー (他でも使うなら utils へ移動)
function renderName(m: Membership): string {
  if (m.name) return m.name;
  if (m.email) return m.email.split('@')[0];
  return MEMBER.LABELS.NO_NAME;
}

function isMembershipRole(value: string): value is MembershipRole {
  return value === 'admin' || value === 'worker';
}

type MembersListProps = {
  organizationId: string;
  currentUserId: number;
  onNotify: (n: Notification) => void;
};

export function MembersList({
  organizationId,
  currentUserId,
  onNotify,
}: MembersListProps): JSX.Element {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [members, setMembers] = useState<Membership[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 操作中のID管理
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 削除モーダル管理
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Membership | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --------------------------------------------------------------------------
  // Derived State
  // --------------------------------------------------------------------------
  const adminCount = useMemo(() => {
    return (members ?? []).filter((m) => m.role === 'admin').length;
  }, [members]);

  // --------------------------------------------------------------------------
  // Effects & Data Fetching
  // --------------------------------------------------------------------------
  const fetchList = useCallback(
    async (signal?: AbortSignal) => {
      const data = await fetchMemberships(organizationId, signal);
      setMembers(data);
      return data;
    },
    [organizationId],
  );

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchList(controller.signal);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;

        if (!controller.signal.aborted) {
          setError(MEMBER.ERRORS.LOAD_FAILED);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    load();
    return () => {
      controller.abort();
    };
  }, [fetchList]);

  // --------------------------------------------------------------------------
  // Logic Helpers
  // --------------------------------------------------------------------------
  const isLastAdmin = (m: Membership) => m.role === 'admin' && adminCount <= 1;

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleChangeRole = async (m: Membership, nextRole: string) => {
    if (!isMembershipRole(nextRole)) {
      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.ROLE_UPDATE_FAILED(), type: 'error' });
      return;
    }

    const role: MembershipRole = nextRole;

    if (m.role === role) return;

    const isSelf = m.user_id === currentUserId;
    if (isSelf && m.role === 'admin' && role !== 'admin') {
      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.SELF_DELETE(), type: 'error' });
      return;
    }

    if (isLastAdmin(m) && role !== 'admin') {
      onNotify({
        message: NOTIFICATION.ORGANIZATION.MEMBER.LAST_ADMIN_CONSTRAINT(),
        type: 'error',
      });
      return;
    }

    setUpdatingId(m.id);

    try {
      const body: UpdateMembershipRequest = {
        membership: { role },
      };

      const updated = await updateMembership(organizationId, m.id, body);

      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.ROLE_UPDATED(), type: 'success' });

      // ローカルstateを更新 (Optimistic UI)
      setMembers((prev) => {
        if (!prev) return null;
        return prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
      });
    } catch (e: unknown) {
      console.error('failed to update role', e);
      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.ROLE_UPDATE_FAILED(), type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = (m: Membership) => {
    const isSelf = m.user_id === currentUserId;
    if (isSelf) {
      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.SELF_DELETE(), type: 'error' });
      return;
    }
    if (isLastAdmin(m)) {
      onNotify({
        message: NOTIFICATION.ORGANIZATION.MEMBER.LAST_ADMIN_CONSTRAINT(),
        type: 'error',
      });
      return;
    }
    setMemberToDelete(m);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const target = memberToDelete;
    if (!target) return;

    setIsDeleting(true); // モーダル内のボタンをローディングにする等のため
    // モーダルは閉じるが、処理中状態は維持する設計も可。今回は閉じてから処理。
    setConfirmOpen(false);

    try {
      await deleteMembership(organizationId, target.id);

      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.DELETED(), type: 'success' });

      // 【修正】サーバーへの再取得を待たずに、即座にUIから消す
      setMembers((prev) => (prev ? prev.filter((m) => m.id !== target.id) : prev));

      // 念の為バックグラウンド更新
      fetchList().catch(console.error);
    } catch (e: unknown) {
      console.error('failed to delete membership', e);
      onNotify({ message: NOTIFICATION.ORGANIZATION.MEMBER.DELETE_FAILED(), type: 'error' });
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-gray-500 py-4">{MEMBER.MESSAGES.STATIC.LOADING}</p>}

      {!isLoading && error && <ErrorView message={error} />}

      {!isLoading && !error && members && (
        <>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">{MEMBER.MESSAGES.STATIC.NO_MEMBERS}</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {MEMBER.LABELS.NAME}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {MEMBER.LABELS.EMAIL}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {MEMBER.LABELS.ROLE}
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">{MEMBER.LABELS.ACTIONS}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((m) => {
                    // ロジック:
                    // 1. 最後の管理者は操作不可
                    // 2. 自分自身の権限変更/削除も、最後の管理者なら不可（ただし自分自身の削除＝脱退は別要件かもしれないが、ここでは安全側に倒す）
                    const isLast = isLastAdmin(m);
                    const isSelf = m.user_id === currentUserId;
                    const isBusy =
                      updatingId === m.id || (isDeleting && memberToDelete?.id === m.id);

                    const roleDisabled = isBusy || isLast || (isSelf && m.role === 'admin');

                    const roleDisabledReason = isLast
                      ? NOTIFICATION.ORGANIZATION.MEMBER.LAST_ADMIN_CONSTRAINT()
                      : isSelf && m.role === 'admin'
                        ? NOTIFICATION.ORGANIZATION.MEMBER.SELF_DELETE()
                        : undefined;

                    const deleteDisabled = isBusy || isLast || isSelf;
                    const deleteDisabledReason = isLast
                      ? NOTIFICATION.ORGANIZATION.MEMBER.LAST_ADMIN_CONSTRAINT()
                      : isSelf
                        ? NOTIFICATION.ORGANIZATION.MEMBER.SELF_DELETE()
                        : undefined;

                    return (
                      <tr key={m.id} className={isBusy ? 'opacity-50 bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {renderName(m)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {m.email ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(m, e.target.value)}
                            disabled={roleDisabled}
                            title={roleDisabledReason}
                            className={`
                              block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md
                              ${roleDisabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}
                            `}
                          >
                            <option value="admin">{ROLE_LABELS.admin}</option>
                            <option value="worker" disabled={isSelf && m.role === 'admin'}>
                              {ROLE_LABELS.worker}
                            </option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(m)}
                            disabled={deleteDisabled}
                            title={deleteDisabledReason}
                            className="text-red-600 hover:text-red-900 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                          >
                            {MEMBER.BUTTONS.DELETE}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={MEMBER.MODAL.DELETE.TITLE}
        description={
          memberToDelete ? MEMBER.MODAL.DELETE.DESCRIPTION(renderName(memberToDelete)) : ''
        }
        confirmText={MEMBER.MODAL.DELETE.CONFIRM_TEXT}
        cancelText={COMMON.BUTTONS.CANCEL}
        confirmDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setMemberToDelete(null);
        }}
      />
    </div>
  );
}
