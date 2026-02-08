'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';
import { fetchOrganizationLatestLocations } from '@/lib/api/active_work_sessions';
import type { LatestLocationPin } from '@/lib/api/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { usePollingWhenIdle } from '@/hooks/usePollingWhenIdle';
import { DASHBOARD_POLLING } from '@/config/dashboard';

// MapViewの動的インポート
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
  ),
});

interface MapCardProps {
  organizationId: string;
}

export default function MapCard({ organizationId }: MapCardProps) {
  const [locations, setLocations] = useState<LatestLocationPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const isVisible = usePageVisibility();

  // 最終更新日時の計算
  const latestLoggedAt = useMemo(() => {
    if (!locations.length) return null;
    return locations.reduce<string | null>((latest, loc) => {
      if (!loc.logged_at) return latest;
      if (!latest) return loc.logged_at;
      return new Date(loc.logged_at) > new Date(latest) ? loc.logged_at : latest;
    }, null);
  }, [locations]);

  const fetchLocations = useCallback(
    async ({ signal, background = false }: { signal?: AbortSignal; background?: boolean }) => {
      const numericId = Number(organizationId);

      if (isNaN(numericId)) {
        console.error(`Invalid organizationId: ${organizationId}`);
        if (!background) {
          setError('組織IDが無効です');
          setLoading(false);
        }
        return;
      }

      if (!background) {
        setLoading(true);
        setError(null);
      }

      try {
        // ここで numericId (number) を渡すことで型整合性が保たれる
        const data = await fetchOrganizationLatestLocations(numericId, signal);
        setLocations(data);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;

        // ポーリング時はエラーをUIに出さず、ログのみ
        console.error('Failed to fetch latest locations', e);
        if (!background) {
          setError('位置情報の取得に失敗しました');
          setLocations([]);
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [organizationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLocations({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchLocations, retryTrigger]);

  usePollingWhenIdle({
    enabled: Boolean(isVisible),
    intervalMs: DASHBOARD_POLLING.MAP_POLL_INTERVAL_MS,
    onTick: () => {
      fetchLocations({ background: true });
    },
  });

  // Loading表示：カードの外枠は維持し、中身だけスケルトンにする
  const renderContent = () => {
    if (loading) {
      return <Skeleton className="h-full w-full rounded-lg" />;
    }

    if (error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-3 text-sm text-warm-gray-600 dark:text-warm-gray-400">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryTrigger((prev) => prev + 1)}
            className="rounded bg-warm-gray-100 px-4 py-2 text-sm font-medium text-warm-gray-700 hover:bg-warm-gray-200 dark:bg-warm-gray-700 dark:text-warm-gray-200 dark:hover:bg-warm-gray-600 transition-colors"
          >
            再読み込み
          </button>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        <MapView locations={locations} />
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60 text-sm text-warm-gray-600 dark:bg-warm-gray-800/60 dark:text-warm-gray-400 pointer-events-none">
            <span className="bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded shadow-sm"></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-xl bg-white p-6 shadow-sm dark:bg-warm-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-warm-gray-900 dark:text-warm-gray-100">
          現在位置
        </h2>
        <span className="text-xs text-warm-gray-500 dark:text-warm-gray-400 tabular-nums">
          最終更新: {latestLoggedAt ? new Date(latestLoggedAt).toLocaleString('ja-JP') : '—'}
        </span>
      </div>

      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
