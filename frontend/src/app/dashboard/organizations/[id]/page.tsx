'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserRole } from '../../../../lib/permissions';
import { fetchMemberships } from '@/lib/api/memberships';
import type { Membership } from '@/lib/api/types';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { useAuthContext } from '@/context/AuthContext';

export default function OrganizationDashboard() {
  const params = useParams();
  const organizationId = params.id as string;
  const { user, loading } = useAuthContext();

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  if (!user) {
    return <div className="p-6">ログインしてください</div>;
  }

  const role = getUserRole(user, organizationId);

  if (!role) {
    return (
      <div className="p-6">
        <p className="text-red-600">この組織へのアクセス権限がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {role === 'admin' ? <AdminView organizationId={organizationId} /> : null}
    </div>
  );
}

function AdminView({ organizationId }: { organizationId: string }) {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMemberships(organizationId)
      .then((data) => setMemberships(data))
      .catch((e) => {
        console.error('稼働中メンバー数の取得に失敗:', e);
        setMemberships(null);
      })
      .finally(() => setLoading(false));
  }, [organizationId]);

  const activeCount =
    memberships?.filter((m) => (m.working ?? m.active_work_session?.active) === true).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 稼働中メンバー */}
        <DashboardCard
          title="稼働中メンバー"
          value={activeCount}
          icon="group"
          statusText={activeCount > 0 ? '稼働中' : '待機中'}
          statusColor="text-green-600"
          statusIcon="check_circle"
          href={`/dashboard/organizations/${organizationId}/members`}
          loading={loading}
        />

        {/* プレースホルダ（後で横にカードを追加するための空スペース） */}
        {/* <div
          aria-hidden="true"
          className="hidden md:block bg-white overflow-hidden shadow-sm rounded-xl border border-border-light dark:border-border-dark p-6"
        />

        <div
          aria-hidden="true"
          className="hidden lg:block bg-white overflow-hidden shadow-sm rounded-xl border border-border-light dark:border-border-dark p-6"
        /> */}
      </div>
    </div>
  );
}
