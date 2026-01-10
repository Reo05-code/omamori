import { useEffect, useState } from 'react';

import { fetchMemberships } from '@/lib/api/memberships';
import type { Membership } from '@/lib/api/types';

const DEFAULT_ERROR_MESSAGE = '読み込みに失敗しました。時間をおいて再度お試しください。';

export function useMemberships(orgId: string | undefined) {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    // App Routerのparamsが未確定な瞬間があるため、orgId未指定時は初期化して終了。
    if (!orgId) {
      setMemberships(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchMemberships(orgId)
      .then((data) => setMemberships(data))
      .catch((e) => {
        console.error('failed to fetch memberships', e);
        setError(DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => setLoading(false));
  }, [orgId, retryKey]);

  return {
    memberships,
    loading,
    error,
    // retryKey を依存配列に入れることで、再試行ボタン等から明示的に再取得できる。
    retry: () => setRetryKey((p) => p + 1),
  };
}
