'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { AlertStatus } from '@/lib/api/types';

/**
 * アラート一覧のフィルタUI
 * URLクエリパラメータをSSOT（Single Source of Truth）として扱い、
 * チェックボックスの変更で即座にURLを更新（即座フィードバック）
 */
export function AlertFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLから現在のフィルタ状態を読み取る（SSOT）
  const currentStatusParam = searchParams.get('status');
  const currentStatuses: AlertStatus[] = currentStatusParam
    ? (currentStatusParam
        .split(',')
        .filter((s) => s === 'open' || s === 'resolved') as AlertStatus[])
    : [];
  const isUrgentOnly = searchParams.get('urgent') === 'true';

  const handleStatusChange = (status: AlertStatus) => {
    const params = new URLSearchParams(searchParams);

    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    if (newStatuses.length > 0) {
      params.set('status', newStatuses.join(','));
    } else {
      params.delete('status');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleUrgentToggle = () => {
    const params = new URLSearchParams(searchParams);

    if (isUrgentOnly) {
      params.delete('urgent');
    } else {
      params.set('urgent', 'true');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    // 自分が担当するパラメータのみ削除し、他のパラメータ（page, qなど）は維持
    params.delete('status');
    params.delete('urgent');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters = currentStatuses.length > 0 || isUrgentOnly;

  return (
    <div className="mt-4 rounded bg-warm-gray-50 dark:bg-warm-gray-900/30 px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {(['open', 'resolved'] as AlertStatus[]).map((status) => (
          <label key={status} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentStatuses.includes(status)}
              onChange={() => handleStatusChange(status)}
              className="rounded border-warm-gray-300 text-warm-orange focus:ring-warm-orange"
            />
            <span className="text-sm text-warm-gray-700 dark:text-warm-gray-200">
              {status === 'open' ? '未対応' : '解決済み'}
            </span>
          </label>
        ))}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isUrgentOnly}
            onChange={handleUrgentToggle}
            className="rounded border-warm-gray-300 text-warm-orange focus:ring-warm-orange"
          />
          <span className="text-sm text-warm-gray-700 dark:text-warm-gray-200">緊急のみ</span>
        </label>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto px-4 py-2 text-sm font-medium rounded bg-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-300 dark:bg-warm-gray-700 dark:text-warm-gray-200 dark:hover:bg-warm-gray-600"
          >
            クリア
          </button>
        )}
      </div>
    </div>
  );
}
