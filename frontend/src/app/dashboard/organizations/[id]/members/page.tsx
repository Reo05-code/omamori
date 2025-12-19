'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Membership } from '../../../../../lib/api/types';
import { fetchMemberships } from '../../../../../lib/api/memberships';

export default function MembersPage(): JSX.Element {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const [members, setMembers] = useState<Membership[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);
    setError(null);
    fetchMemberships(orgId)
      .then((data) => setMembers(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [orgId]);

  const renderName = (m: Membership) => {
    if (m.email) return m.email.split('@')[0];
    return '（名前なし）';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">メンバー一覧</h1>
        <Link
          href={`/dashboard/organizations/${orgId}/invitations/new`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          メンバーを招待
        </Link>
      </div>

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-600">エラー: {error}</p>}

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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    メンバーが見つかりません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
