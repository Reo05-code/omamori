'use client';

import { useEffect, useState, ComponentProps } from 'react';
import Link from 'next/link';
import { fetchOrganizationAlerts } from '@/lib/api/alerts';
import type { AlertResponse } from '@/lib/api/types';
import AlertItem from '@/components/common/AlertItem';
import Skeleton from '@/components/ui/Skeleton';
import { ALERT_TYPE_LABELS, ALERT_SEVERITY_LABELS } from '@/constants/labels';

// AlertItemからProps型を抽出（保守性の確保）
type AlertItemProps = ComponentProps<typeof AlertItem>;

interface RecentAlertsWidgetProps {
  organizationId: string;
}

// Severity / Alert Type → Component Variant 変換ロジック
function getAlertVariant(alert: AlertResponse): AlertItemProps['variant'] {
  // 解決済みは常にmuted
  if (alert.status === 'resolved') {
    return 'muted';
  }

  // Critical は常に important
  if (alert.severity === 'critical') {
    return 'important';
  }

  // High severity かつ (SOS または risk_high)
  if (
    alert.severity === 'high' &&
    (alert.alert_type === 'sos' || alert.alert_type === 'risk_high')
  ) {
    return 'important';
  }

  // それ以外の未解決は default
  return 'default';
}

// ISO形式の日時文字列を「MM/DD HH:mm」の簡潔な表記に変換
function formatAlertTime(raw: string | null | undefined): string {
  if (!raw) return '—';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

// アラート説明文を生成（名前を除外し、事象のみを記述）
// AlertItemのname propと重複しないように
function getAlertDescription(alert: AlertResponse): string {
  const typeLabel = ALERT_TYPE_LABELS[alert.alert_type];
  const severityLabel = ALERT_SEVERITY_LABELS[alert.severity];
  return `${typeLabel} (${severityLabel})`;
}

/**
 * 最近のアラート（5件）ウィジェット
 * - 手動リトライのみサポート（自動リトライなし）
 * - クリックでアラート一覧ページへ遷移（ハイライトID付き）
 */
export function RecentAlertsWidget({ organizationId }: RecentAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<AlertResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchOrganizationAlerts(organizationId, { limit: 5 }, controller.signal);
        console.log(
          'Recent alerts with variants:',
          data.map((a) => ({
            id: a.id,
            severity: a.severity,
            alert_type: a.alert_type,
            status: a.status,
            variant: getAlertVariant(a),
          })),
        );
        setAlerts(data);
      } catch (e) {
        // AbortError の場合はエラー表示しない
        if (e instanceof Error && e.name === 'AbortError') return;

        console.error('Failed to fetch recent alerts', e);
        setError('アラート情報の取得に失敗しました');
        setAlerts(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    return () => controller.abort();
  }, [organizationId, retryTrigger]);

  return (
    <div className="rounded-xl bg-white dark:bg-warm-gray-800 shadow-sm p-6 flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-warm-gray-900 dark:text-warm-gray-100">
          最近のアラート
        </h2>
        <Link
          href={`/dashboard/organizations/${organizationId}/alerts`}
          className="text-sm text-warm-orange hover:underline"
        >
          もっと見る
        </Link>
      </div>

      <div className="flex-1">
        {/* ローディング状態 */}
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* エラー状態（手動リトライ） */}
        {!loading && error && (
          <div className="h-full flex flex-col items-center justify-center text-sm text-warm-gray-600 dark:text-warm-gray-400 space-y-3 py-4">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetryTrigger((prev) => prev + 1)}
              className="px-4 py-2 text-sm font-medium rounded bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200 dark:bg-warm-gray-700 dark:text-warm-gray-200 dark:hover:bg-warm-gray-600 transition-colors"
            >
              再読み込み
            </button>
          </div>
        )}

        {/* 空状態 */}
        {!loading && !error && alerts?.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-warm-gray-500 dark:text-warm-gray-400 py-8">
            表示するアラートはありません
          </div>
        )}

        {/* アラートリスト */}
        {!loading && !error && alerts && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/dashboard/organizations/${organizationId}/alerts?status=open&highlight=${alert.id}`}
                className="block transition-transform hover:translate-x-1"
              >
                <AlertItem
                  name={alert.work_session?.user?.name || '不明な作業者'}
                  time={formatAlertTime(alert.created_at)}
                  text={getAlertDescription(alert)}
                  variant={getAlertVariant(alert)}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
