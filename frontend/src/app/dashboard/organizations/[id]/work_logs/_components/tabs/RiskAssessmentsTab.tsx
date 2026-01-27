import { useMemo, useState } from 'react';
import type { Membership } from '@/lib/api/types';
import type { RiskAssessmentResponse } from '@/lib/api/types';
import Skeleton from '@/components/ui/Skeleton';
import { RISK_ASSESSMENT_LEVEL_LABELS, RISK_REASON_LABELS } from '@/constants/labels';

import { TargetUserSelect } from '../TargetUserSelect';

/**
 * リスク判定の異常検知スコア閾値
 * 40点以上で Warning 以上（異常）と判定
 */
const RISK_SCORE_THRESHOLD = 40;

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
 * リスク判定の詳細（details）をユーザー向けに整形して表示。
 * reasons配列を日本語ラベルに変換し、カンマ区切りで表示。
 */
function formatDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return '—';

  const reasons = Array.isArray(details.reasons) ? details.reasons : [];
  if (reasons.length === 0) return '該当なし';

  return reasons.map((code: string) => RISK_REASON_LABELS[code] || code).join(', ');
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
  // 異常のみ表示フィルター（デフォルト: true）
  const [showOnlyAbnormal, setShowOnlyAbnormal] = useState(true);

  // フィルタリングされたリスク判定データ
  const filteredRiskAssessments = useMemo(() => {
    if (!riskAssessments) return null;
    if (!showOnlyAbnormal) return riskAssessments;

    // 異常検知: level が 'safe' 以外、かつ score が閾値以上
    // (Warning: 40点以上、Emergency: 80点以上)
    return riskAssessments.filter((ra) => ra.level !== 'safe' && ra.score >= RISK_SCORE_THRESHOLD);
  }, [riskAssessments, showOnlyAbnormal]);

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

      {selectedUserId !== null && activeWorkSessionId && loading && (
        <div className="mt-4">
          <Skeleton variant="table" rows={5} />
        </div>
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
        filteredRiskAssessments &&
        filteredRiskAssessments.length === 0 && (
          <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400">
            {showOnlyAbnormal
              ? '異常なリスク判定履歴がありません。'
              : 'リスク判定履歴がありません。'}
          </p>
        )}

      {selectedUserId !== null &&
        activeWorkSessionId &&
        !loading &&
        !error &&
        filteredRiskAssessments &&
        filteredRiskAssessments.length > 0 && (
          <>
            {/* 異常のみ表示フィルター */}
            <div className="mt-4 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-warm-gray-700 dark:text-warm-gray-300">
                <input
                  type="checkbox"
                  checked={showOnlyAbnormal}
                  onChange={(e) => setShowOnlyAbnormal(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-warm-gray-100 border-warm-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-warm-gray-800 focus:ring-2 dark:bg-warm-gray-700 dark:border-warm-gray-600"
                />
                <span>異常のみ表示</span>
              </label>
              {showOnlyAbnormal && riskAssessments && filteredRiskAssessments && (
                <span className="text-xs text-warm-gray-500 dark:text-warm-gray-400">
                  （{filteredRiskAssessments.length} / {riskAssessments.length} 件）
                </span>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                <thead className="bg-warm-gray-50 dark:bg-warm-gray-900/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      評価日時
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      リスクレベル
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      スコア
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                      詳細
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                  {filteredRiskAssessments.map((ra) => (
                    <tr key={ra.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {formatLoggedAt(ra.logged_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {RISK_ASSESSMENT_LEVEL_LABELS[ra.level]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {ra.score}
                      </td>
                      <td className="px-4 py-3 text-sm text-warm-gray-700 dark:text-warm-gray-200">
                        {formatDetails(ra.details)}
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
