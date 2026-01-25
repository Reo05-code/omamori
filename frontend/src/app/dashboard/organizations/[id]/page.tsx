'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserRole } from '../../../../lib/permissions';
import { fetchMemberships } from '@/lib/api/memberships';
import { fetchOrganizationAlertsSummary } from '@/lib/api/alerts';
import type { Membership, AlertSummaryResponse } from '@/lib/api/types';
import DashboardCard from '@/components/dashboard/DashboardCard';
import Skeleton from '@/components/ui/Skeleton';
import { useAuthContext } from '@/context/AuthContext';
import { RecentAlertsWidget } from './_components/RecentAlertsWidget';
import MapCard from './_components/MapCard';
import { DASHBOARD, COMMON, AUTH } from '@/constants/ui-messages';

export default function OrganizationDashboard() {
  const params = useParams();
  const organizationId = params.id as string;
  const { user, loading } = useAuthContext();

  if (loading) {
    return <div className="p-6">{DASHBOARD.STATUS.LOADING}</div>;
  }

  if (!user) {
    return <div className="p-6">{AUTH.LOGIN.MESSAGES.LOGIN_REQUIRED}</div>;
  }

  const role = getUserRole(user, organizationId);

  if (!role) {
    return (
      <div className="p-6">
        <p className="text-red-600">{DASHBOARD.STATUS.ERROR}</p>
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
  const [alertSummary, setAlertSummary] = useState<AlertSummaryResponse | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);

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

  useEffect(() => {
    setAlertsLoading(true);
    fetchOrganizationAlertsSummary(organizationId)
      .then((data) => setAlertSummary(data))
      .catch((e) => {
        console.error('アラート集計の取得に失敗:', e);
        setAlertSummary(null);
      })
      .finally(() => setAlertsLoading(false));
  }, [organizationId]);

  const activeCount =
    memberships?.filter((m) => (m.working ?? m.active_work_session?.active) === true).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 稼働中メンバー */}
        {loading ? (
          <Skeleton variant="card" />
        ) : (
          <DashboardCard
            title={DASHBOARD.CARDS.ACTIVE_WORKERS.TITLE}
            value={activeCount}
            icon="group"
            statusText={activeCount > 0 ? '稼働中' : '待機中'}
            statusColor="text-green-600"
            statusIcon="check_circle"
            href={`/dashboard/organizations/${organizationId}/members`}
          />
        )}

        {/* 未対応アラート */}
        {alertsLoading ? (
          <Skeleton variant="card" />
        ) : (
          <DashboardCard
            title="未対応アラート"
            value={alertSummary?.counts.unresolved ?? 0}
            icon="notifications"
            statusText={alertSummary ? `${alertSummary.counts.open}件 未対応` : undefined}
            statusColor="text-gray-600 dark:text-gray-400"
            href={`/dashboard/organizations/${organizationId}/alerts?status=open,in_progress`}
          />
        )}

        {/* 緊急対応 */}
        {alertsLoading ? (
          <Skeleton variant="card" />
        ) : (
          <DashboardCard
            title="緊急対応"
            value={alertSummary?.counts.urgent_open ?? 0}
            valueColor="text-red-600 dark:text-red-400"
            icon="warning"
            iconColor="text-red-500"
            statusText={
              alertSummary
                ? `SOS: ${alertSummary.breakdown.urgent.sos_open}件 / Critical: ${alertSummary.breakdown.urgent.critical_open_non_sos}件`
                : undefined
            }
            statusColor="text-red-700 dark:text-red-300"
            variant="alert"
            href={`/dashboard/organizations/${organizationId}/alerts?status=open&urgent=true`}
          />
        )}
      </div>

      {/* 下段：地図とアラート */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：リアルタイムマップ */}
        <div className="lg:col-span-2">
          <MapCard organizationId={organizationId} />
        </div>

        {/* 右側：最近のアラート（5件）ウィジェット */}
        <div>
          <RecentAlertsWidget organizationId={organizationId} />
        </div>
      </div>
    </div>
  );
}
