'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import type { AlertResponse, AlertStatus } from '@/lib/api/types';
import { fetchOrganizationAlerts, updateOrganizationAlertStatus } from '@/lib/api/alerts';
import { getUserRole } from '@/lib/permissions';
import { useAuthContext } from '@/context/AuthContext';

// ISO形式の日時文字列を「YYYY-MM-DD HH:mm:ss」の日本語表記に変換する。
function formatDateTime(raw: string | null | undefined): string {
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

// アラートステータスを日本語ラベルに変換する。
function statusLabel(status: AlertStatus): string {
  switch (status) {
    case 'open':
      return '未対応';
    case 'in_progress':
      return '対応中';
    case 'resolved':
      return '解決済み';
  }
}

// ステータスに応じたバッジのTailwind CSSクラス（背景色・文字色）を返す。
function statusBadgeClass(status: AlertStatus): string {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
  }
}

// アラート解決時の確認ダイアログに表示するメッセージを生成する（作業者名とアラート詳細を含む）。
function resolveConfirmMessage(alert: AlertResponse): string {
  const workerName = alert.work_session?.user?.name;
  const summary = workerName
    ? `作業者: ${workerName}`
    : `work_session_id: ${alert.work_session_id}`;
  return `このアラートを「解決済み」にします。よろしいですか？\n\n${summary}\n種別: ${alert.alert_type}\nseverity: ${alert.severity}`;
}

/**
 * 組織配下のアラート一覧（管理者のみ）。
 * admin 以外は導線を出さず、直アクセスは権限エラー画面を表示する。
 */
export default function OrganizationAlertsPage() {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const { user, loading: authLoading } = useAuthContext();

  const role = useMemo(() => {
    if (!orgId) return undefined;
    return getUserRole(user, orgId);
  }, [user, orgId]);

  const [alerts, setAlerts] = useState<AlertResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const canView = role === 'admin';

  useEffect(() => {
    if (!orgId) return;
    if (!canView) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchOrganizationAlerts(orgId)
      .then((data) => setAlerts(data))
      .catch((e) => {
        console.error('failed to fetch organization alerts', e);
        setError('読み込みに失敗しました。時間をおいて再度お試しください。');
        setAlerts(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [orgId, canView]);

  // アラート解決ボタンのハンドラ。確認ダイアログを表示後、APIで status を 'resolved' に更新する。
  const onResolve = async (alert: AlertResponse) => {
    if (!orgId) return;
    if (!window.confirm(resolveConfirmMessage(alert))) return;

    setUpdatingId(alert.id);
    try {
      const updated = await updateOrganizationAlertStatus(orgId, alert.id, 'resolved');
      setAlerts((prev) => {
        if (!prev) return prev;
        return prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
      });
    } catch (e) {
      console.error('failed to resolve alert', e);
      window.alert('更新に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return <div className="p-6">読み込み中...</div>;
  }

  if (!user) {
    return <div className="p-6">ログインしてください</div>;
  }

  if (!orgId) {
    return <div className="p-6">組織IDが不正です</div>;
  }

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-red-600">権限がありません</p>
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-warm-gray-900 dark:text-warm-gray-100">
          アラート一覧
        </h1>
        {/* <Link
          href={`/dashboard/organizations/${orgId}`}
          className="text-sm text-warm-orange hover:underline"
        >
          組織トップへ
        </Link> */}
      </div>

      {loading && <p className="mt-4">読み込み中です...</p>}

      {!loading && error && (
        <div className="mt-4">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              // 再取得
              setAlerts(null);
              setError(null);
              setLoading(true);
              fetchOrganizationAlerts(orgId)
                .then((data) => setAlerts(data))
                .catch((e) => {
                  console.error('failed to fetch organization alerts', e);
                  setError('読み込みに失敗しました。時間をおいて再度お試しください。');
                  setAlerts(null);
                })
                .finally(() => setLoading(false));
            }}
            className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-warm-gray-100 hover:bg-warm-gray-200 dark:bg-warm-gray-700 dark:hover:bg-warm-gray-600"
          >
            再試行
          </button>
        </div>
      )}

      {!loading && !error && alerts && alerts.length === 0 && (
        <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400">アラートはありません。</p>
      )}

      {!loading && !error && alerts && alerts.length > 0 && (
        <div className="mt-4 overflow-x-auto bg-white dark:bg-warm-gray-800 rounded-lg shadow">
          <table className="min-w-full divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
            <thead className="bg-warm-gray-50 dark:bg-warm-gray-900/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                  status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                  severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                  type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                  発生時刻
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                  作業者
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400 uppercase tracking-wider">
                  session
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                        a.status,
                      )}`}
                    >
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                    {a.severity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                    {a.alert_type}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                    {formatDateTime(a.created_at ?? null)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                    {a.work_session?.user?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-warm-gray-700 dark:text-warm-gray-200">
                    {a.work_session_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    {a.status !== 'resolved' ? (
                      <button
                        type="button"
                        disabled={updatingId === a.id}
                        onClick={() => onResolve(a)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-warm-orange text-white hover:bg-warm-orange/90 disabled:opacity-50"
                      >
                        解決
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded bg-white text-white hover:bg-white/90 disabled:opacity-50">
                        ここは空白
                      </span>
                    )}
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
