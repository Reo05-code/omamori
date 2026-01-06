'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Membership } from '@/lib/api/types';
import { fetchMemberships } from '@/lib/api/memberships';
import { InviteMemberModal } from '@/components/organization/InviteMemberModal';
import { getMemberWorkStatusLabel } from '@/lib/memberWorkStatus';

export default function MembersPage(): JSX.Element {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const [members, setMembers] = useState<Membership[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      fetchMemberships(orgId)
        .then((data) => setMembers(data))
        .catch((e) => console.error('メンバー一覧の再取得に失敗:', e));
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

      {loading && <p>読み込み中です...</p>}
      {error && <p className="text-red-600">{error}</p>}

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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{m.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span
                        className={
                          m.active_work_session?.active
                            ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                            : 'bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs'
                        }
                      >
                        {getMemberWorkStatusLabel(m.active_work_session)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
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
    </div>
  );
}
