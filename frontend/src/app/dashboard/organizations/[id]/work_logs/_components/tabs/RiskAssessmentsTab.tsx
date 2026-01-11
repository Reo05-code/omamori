import type { Membership } from '@/lib/api/types';
import type { RiskAssessmentResponse } from '@/lib/api/types';

import { TargetUserSelect } from '../TargetUserSelect';

/**
 * ISO8601形式の日時文字列を日本語フォーマット（YYYY-MM-DD HH:mm:ss）に変換。
 * 不正な日時や null の場合は「—」を返す。
 */
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

/**
 * リスク判定の詳細（details）オブジェクトをJSON文字列に整形。
 * 不正なJSONや undefined の場合は「—」を返す。
 */
function formatDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return '—';
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

/**
 * リスク判定タブ：対象ユーザーを選択し、その稼働中セッションのリスク判定履歴をページング表示。
 * ユーザー・セッション・ロード状態に応じた条件分岐UI。
 * ネットワークエラーは権限/見つからない/汎用で分類して表示。
 */
export function RiskAssessmentsTab({
  orgId,
  memberships,
  membershipsLoading,
  membershipsError,
  selectedUserId,
  onSelectUserId,
  activeWorkSessionId,
  riskAssessments,
  loading,
  error,
  page,
  totalPages,
  totalCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onRetry,
}: {
  orgId: string | undefined;
  memberships: Membership[] | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
  activeWorkSessionId: number | null;
  riskAssessments: RiskAssessmentResponse[] | null;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number | null;
  totalCount: number | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRetry: () => void;
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
        riskAssessments &&
        riskAssessments.length === 0 && (
          <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400">
            リスク判定履歴がありません。
          </p>
        )}

      {selectedUserId !== null &&
        activeWorkSessionId &&
        !loading &&
        !error &&
        riskAssessments &&
        riskAssessments.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                <thead className="bg-warm-gray-50 dark:bg-warm-gray-900/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      logged_at
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                  {riskAssessments.map((ra) => (
                    <tr key={ra.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {formatLoggedAt(ra.logged_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {ra.level}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {ra.score}
                      </td>
                      <td className="px-4 py-3 text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        <pre className="text-xs whitespace-pre-wrap break-all">
                          {formatDetails(ra.details)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-warm-gray-600 dark:text-warm-gray-400">
              <div>
                <span>page: {page}</span>
                {totalPages !== null && <span> / {totalPages}</span>}
                {totalCount !== null && <span>（total: {totalCount}）</span>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!canPrev}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-warm-gray-100 hover:bg-warm-gray-200 disabled:opacity-50 dark:bg-warm-gray-700 dark:hover:bg-warm-gray-600"
                >
                  前へ
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!canNext}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-warm-gray-100 hover:bg-warm-gray-200 disabled:opacity-50 dark:bg-warm-gray-700 dark:hover:bg-warm-gray-600"
                >
                  次へ
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
