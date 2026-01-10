'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/lib/api/client';
import { fetchMemberships } from '@/lib/api/memberships';
import { fetchSafetyLogs } from '@/lib/api/safety_logs';
import type { Membership, SafetyLogResponse } from '@/lib/api/types';

type TabKey = 'basic' | 'safety_logs' | 'risk_assessments';

function isTabKey(value: string | null): value is TabKey {
  return value === 'basic' || value === 'safety_logs' || value === 'risk_assessments';
}

export default function WorkLogsPage() {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tab = searchParams.get('tab');
    return isTabKey(tab) ? tab : 'basic';
  });

  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => {
    const raw = searchParams.get('userId') ?? searchParams.get('user_id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const selectedMembership = useMemo(() => {
    if (!memberships || selectedUserId === null) return null;
    return memberships.find((m) => m.user_id === selectedUserId) ?? null;
  }, [memberships, selectedUserId]);

  const activeWorkSessionId = useMemo(() => {
    const session = selectedMembership?.active_work_session;
    if (!session?.active) return null;
    return typeof session.id === 'number' ? session.id : null;
  }, [selectedMembership]);

  const [safetyLogs, setSafetyLogs] = useState<SafetyLogResponse[] | null>(null);
  const [safetyLogsLoading, setSafetyLogsLoading] = useState(false);
  const [safetyLogsError, setSafetyLogsError] = useState<string | null>(null);
  const [safetyLogsLoadedForSessionId, setSafetyLogsLoadedForSessionId] = useState<number | null>(
    null,
  );

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'basic', label: '基本情報' },
    { key: 'safety_logs', label: '移動履歴' },
    { key: 'risk_assessments', label: 'リスク判定' },
  ];

  useEffect(() => {
    if (!orgId) {
      setMemberships(null);
      setMembershipsLoading(false);
      return;
    }

    setMembershipsLoading(true);
    setMembershipsError(null);

    fetchMemberships(orgId)
      .then((data) => setMemberships(data))
      .catch((e) => {
        console.error('failed to fetch memberships', e);
        setMembershipsError('読み込みに失敗しました。時間をおいて再度お試しください。');
      })
      .finally(() => setMembershipsLoading(false));
  }, [orgId]);

  useEffect(() => {
    if (!memberships || selectedUserId === null) return;
    const exists = memberships.some((m) => m.user_id === selectedUserId);
    if (!exists) setSelectedUserId(null);
  }, [memberships, selectedUserId]);

  useEffect(() => {
    setSafetyLogs(null);
    setSafetyLogsError(null);
    setSafetyLogsLoadedForSessionId(null);
  }, [selectedUserId]);

  useEffect(() => {
    if (activeTab !== 'safety_logs') return;
    if (selectedUserId === null) return;
    if (!activeWorkSessionId) return;
    if (safetyLogsLoadedForSessionId === activeWorkSessionId) return;

    setSafetyLogsLoading(true);
    setSafetyLogsError(null);

    fetchSafetyLogs(activeWorkSessionId)
      .then((data) => {
        setSafetyLogs(data);
        setSafetyLogsLoadedForSessionId(activeWorkSessionId);
      })
      .catch((e) => {
        console.error('failed to fetch safety logs', e);

        if (e instanceof ApiError) {
          if (e.status === 403) {
            setSafetyLogsError('権限がありません');
            return;
          }
          if (e.status === 404) {
            setSafetyLogsError('見つかりません');
            return;
          }
          if (e.status === 0) {
            setSafetyLogsError('ネットワークエラーが発生しました');
            return;
          }
        }

        setSafetyLogsError('読み込みに失敗しました。時間をおいて再度お試しください。');
      })
      .finally(() => setSafetyLogsLoading(false));
  }, [activeTab, selectedUserId, activeWorkSessionId, safetyLogsLoadedForSessionId]);

  return (
    <div className="px-6 pt-2 pb-6">
      {/* Tab Navigation */}
      <div className="border-b border-warm-gray-200 dark:border-warm-gray-700 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-warm-orange text-warm-orange'
                    : 'border-transparent text-warm-gray-500 hover:text-warm-gray-700 hover:border-warm-gray-300 dark:text-warm-gray-400 dark:hover:text-warm-gray-200 dark:hover:border-warm-gray-600'
                }
              `}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'basic' && (
          <BasicInfoTab
            orgId={orgId}
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            selectedUserId={selectedUserId}
            onSelectUserId={setSelectedUserId}
            selectedMembership={selectedMembership}
            activeWorkSessionId={activeWorkSessionId}
          />
        )}
        {activeTab === 'safety_logs' && (
          <SafetyLogsTab
            orgId={orgId}
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            selectedUserId={selectedUserId}
            onSelectUserId={setSelectedUserId}
            activeWorkSessionId={activeWorkSessionId}
            safetyLogs={safetyLogs}
            loading={safetyLogsLoading}
            error={safetyLogsError}
            onRetry={() => {
              setSafetyLogsLoadedForSessionId(null);
            }}
          />
        )}
        {activeTab === 'risk_assessments' && (
          <RiskAssessmentsTab
            orgId={orgId}
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            selectedUserId={selectedUserId}
            onSelectUserId={setSelectedUserId}
          />
        )}
      </div>
    </div>
  );
}

function renderName(m: Membership): string {
  if (m.email) return m.email.split('@')[0];
  return '（名前なし）';
}

function TargetUserSelect({
  memberships,
  loading,
  error,
  selectedUserId,
  onSelectUserId,
}: {
  memberships: Membership[] | null;
  loading: boolean;
  error: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
}) {
  const disabled = loading || !!error || !memberships || memberships.length === 0;

  return (
    <div className="mb-4">
      <label
        htmlFor="target-user"
        className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-200 mb-2"
      >
        対象ユーザー
      </label>
      <select
        id="target-user"
        className="w-full px-3 py-2 border border-warm-gray-300 rounded-md bg-white dark:bg-warm-gray-900/30 dark:border-warm-gray-700 text-warm-gray-900 dark:text-warm-gray-100 focus:outline-none focus:ring-2 focus:ring-warm-orange focus:border-warm-orange disabled:opacity-50"
        value={selectedUserId ?? ''}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          if (!raw) {
            onSelectUserId(null);
            return;
          }
          const parsed = Number(raw);
          onSelectUserId(Number.isFinite(parsed) ? parsed : null);
        }}
      >
        <option value="">選択してください</option>
        {(memberships ?? []).map((m) => (
          <option key={m.id} value={m.user_id}>
            {renderName(m)}
          </option>
        ))}
      </select>

      {loading && (
        <p className="mt-2 text-sm text-warm-gray-600 dark:text-warm-gray-400">読み込み中です...</p>
      )}
      {!loading && error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!loading && !error && memberships && memberships.length === 0 && (
        <p className="mt-2 text-sm text-warm-gray-600 dark:text-warm-gray-400">
          メンバーが見つかりません。
        </p>
      )}
    </div>
  );
}

function BasicInfoTab({
  orgId,
  memberships,
  membershipsLoading,
  membershipsError,
  selectedUserId,
  onSelectUserId,
  selectedMembership,
  activeWorkSessionId,
}: {
  orgId: string | undefined;
  memberships: Membership[] | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
  selectedMembership: Membership | null;
  activeWorkSessionId: number | null;
}) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        基本情報
      </h2>

      <TargetUserSelect
        memberships={memberships}
        loading={membershipsLoading}
        error={membershipsError}
        selectedUserId={selectedUserId}
        onSelectUserId={onSelectUserId}
      />

      {selectedUserId === null && (
        <p className="text-warm-gray-600 dark:text-warm-gray-400">
          対象ユーザーを選択してください。
        </p>
      )}

      {selectedUserId !== null && selectedMembership && (
        <div className="space-y-2 text-warm-gray-600 dark:text-warm-gray-400">
          <p>組織ID: {orgId || '不明'}</p>
          <p>user_id: {selectedMembership.user_id}</p>
          <p>email: {selectedMembership.email ?? '—'}</p>
          <p>role: {selectedMembership.role ?? '—'}</p>
          <p>稼働中セッション: {activeWorkSessionId ? `id=${activeWorkSessionId}` : 'なし'}</p>
        </div>
      )}
    </div>
  );
}

function formatLoggedAt(raw: string | null | undefined): string {
  if (!raw) return '—';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);
}

function formatLatLng(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string {
  if (latitude === null || latitude === undefined) return '—';
  if (longitude === null || longitude === undefined) return '—';
  return `${latitude}, ${longitude}`;
}

function SafetyLogsTab({
  orgId,
  memberships,
  membershipsLoading,
  membershipsError,
  selectedUserId,
  onSelectUserId,
  activeWorkSessionId,
  safetyLogs,
  loading,
  error,
  onRetry,
}: {
  orgId: string | undefined;
  memberships: Membership[] | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
  activeWorkSessionId: number | null;
  safetyLogs: SafetyLogResponse[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        移動履歴
      </h2>
      <TargetUserSelect
        memberships={memberships}
        loading={membershipsLoading}
        error={membershipsError}
        selectedUserId={selectedUserId}
        onSelectUserId={onSelectUserId}
      />

      {selectedUserId === null && (
        <p className="text-warm-gray-600 dark:text-warm-gray-400">
          対象ユーザーを選択してください。
        </p>
      )}

      {selectedUserId !== null && !activeWorkSessionId && (
        <p className="text-warm-gray-600 dark:text-warm-gray-400">
          稼働中の作業セッションがありません。
        </p>
      )}

      {selectedUserId !== null && activeWorkSessionId && (
        <p className="text-warm-gray-600 dark:text-warm-gray-400">
          作業セッションID: {activeWorkSessionId}
        </p>
      )}

      {selectedUserId !== null && activeWorkSessionId && loading && (
        <p className="mt-4">読み込み中です...</p>
      )}

      {selectedUserId !== null && activeWorkSessionId && error && (
        <div className="mt-4">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-warm-gray-100 hover:bg-warm-gray-200 dark:bg-warm-gray-700 dark:hover:bg-warm-gray-600"
          >
            再試行
          </button>
        </div>
      )}

      {selectedUserId !== null &&
        activeWorkSessionId &&
        !loading &&
        !error &&
        safetyLogs &&
        safetyLogs.length === 0 && (
          <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400">移動履歴がありません。</p>
        )}

      {selectedUserId !== null &&
        activeWorkSessionId &&
        !loading &&
        !error &&
        safetyLogs &&
        safetyLogs.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
              <thead className="bg-warm-gray-50 dark:bg-warm-gray-900/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    logged_at
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    latitude/longitude
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    battery_level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    trigger_type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                {safetyLogs.map((log) => (
                  <tr
                    key={`${log.work_session_id}-${log.logged_at}-${log.latitude}-${log.longitude}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                      {formatLoggedAt(log.logged_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                      {formatLatLng(log.latitude, log.longitude)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                      {log.battery_level ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                      {log.trigger_type ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function RiskAssessmentsTab({
  orgId,
  memberships,
  membershipsLoading,
  membershipsError,
  selectedUserId,
  onSelectUserId,
}: {
  orgId: string | undefined;
  memberships: Membership[] | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
}) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        リスク判定
      </h2>

      <TargetUserSelect
        memberships={memberships}
        loading={membershipsLoading}
        error={membershipsError}
        selectedUserId={selectedUserId}
        onSelectUserId={onSelectUserId}
      />

      {selectedUserId === null && (
        <p className="text-warm-gray-600 dark:text-warm-gray-400">
          対象ユーザーを選択してください。
        </p>
      )}

      {selectedUserId !== null && (
        <div className="space-y-2 text-warm-gray-600 dark:text-warm-gray-400">
          <p>組織ID: {orgId || '不明'}</p>
          <p>対象user_id: {selectedUserId}</p>
          <p>リスク判定の実装は今後行います。</p>
        </div>
      )}
    </div>
  );
}
