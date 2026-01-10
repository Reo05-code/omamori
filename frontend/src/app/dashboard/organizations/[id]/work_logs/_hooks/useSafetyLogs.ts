import { useEffect, useState } from 'react';

import { fetchSafetyLogs } from '@/lib/api/safety_logs';
import type { SafetyLogResponse } from '@/lib/api/types';

import { formatApiErrorMessage } from '../_utils/formatErrors';

const DEFAULT_ERROR_MESSAGE = '読み込みに失敗しました。時間をおいて再度お試しください。';

type Params = {
  enabled: boolean;
  workSessionId: number | null;
  resetKey: number | null;
};

export function useSafetyLogs({ enabled, workSessionId, resetKey }: Params) {
  const [safetyLogs, setSafetyLogs] = useState<SafetyLogResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedForSessionId, setLoadedForSessionId] = useState<number | null>(null);

  useEffect(() => {
    // 対象ユーザーが切り替わったとき（resetKey変更）に、前ユーザーの結果/状態をクリア。
    setSafetyLogs(null);
    setError(null);
    setLoadedForSessionId(null);
    setLoading(false);
  }, [resetKey]);

  useEffect(() => {
    // タブが表示されているときだけ取得する（不要なAPI呼び出しを避ける）。
    if (!enabled) return;
    if (!workSessionId) return;
    // 同一セッションIDの再レンダリングによる再取得を抑止（初回のみ取得）。
    if (loadedForSessionId === workSessionId) return;

    setLoading(true);
    setError(null);

    fetchSafetyLogs(workSessionId)
      .then((data) => {
        setSafetyLogs(data);
        setLoadedForSessionId(workSessionId);
      })
      .catch((e) => {
        console.error('failed to fetch safety logs', e);
        setError(
          formatApiErrorMessage(e, {
            forbidden: '権限がありません',
            notFound: '見つかりません',
            network: 'ネットワークエラーが発生しました',
            default: DEFAULT_ERROR_MESSAGE,
          }),
        );
      })
      .finally(() => setLoading(false));
  }, [enabled, workSessionId, loadedForSessionId]);

  return {
    safetyLogs,
    loading,
    error,
    retry: () => {
      // 抑止フラグを解除して、同一workSessionIdでも再取得できるようにする。
      setLoadedForSessionId(null);
    },
  };
}
