import type { Membership, SafetyLogResponse } from '@/lib/api/types';
import Skeleton from '@/components/ui/Skeleton';
import { TRIGGER_TYPE_LABELS } from '@/constants/labels';

import { TargetUserSelect } from '../TargetUserSelect';

function formatLoggedAt(raw: string | null | undefined): string {
  // APIのlogged_atは文字列のため、表示のみローカライズして扱う（パース不能時は原文）。
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

export function SafetyLogsTab({
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
        <div className="mt-4">
          <Skeleton variant="table" rows={5} />
        </div>
      )}

      {selectedUserId !== null && activeWorkSessionId && error && (
        <div className="mt-4">
          <p className="text-red-600">{error}</p>
          {/* 再試行は useSafetyLogs 側のキャッシュ抑止解除に委譲 */}
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
                    記録日時
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    位置情報
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    電池残量
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                    記録理由
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
                      {log.trigger_type
                        ? (TRIGGER_TYPE_LABELS[log.trigger_type] ?? log.trigger_type)
                        : '—'}
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
