import { useEffect, useMemo, useState } from 'react';

import { fetchRiskAssessmentsWithMeta } from '@/lib/api/risk_assessments';
import type { RiskAssessmentResponse } from '@/lib/api/types';

import { formatApiErrorMessage } from '../_utils/formatErrors';

const DEFAULT_ERROR_MESSAGE = '読み込みに失敗しました。時間をおいて再度お試しください。';
const DEFAULT_PER_PAGE = 100;

type Params = {
  enabled: boolean;
  workSessionId: number | null;
  resetKey: number | null;
};

//  指定されたWorkSessionのリスク判定一覧をページング付きで取得するHook。
//  enabled=trueかつworkSessionId有効な場合に自動取得を開始し、
//  対象セッション切り替わり時は状態をリセット。
//  同一キー（session/page/perPage）での重複取得を防止し、
//  取得失敗時は権限/見つからない/ネットワーク別にエラーメッセージを返す
export function useRiskAssessments({ enabled, workSessionId, resetKey }: Params) {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessmentResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    // 対象ユーザーが切り替わったら状態をクリアし、ページも先頭へ戻す。
    setRiskAssessments(null);
    setError(null);
    setLoading(false);
    setTotalPages(null);
    setTotalCount(null);
    setLoadedKey(null);
    setPage(1);
  }, [resetKey]);

  const requestKey = useMemo(() => {
    if (!workSessionId) return null;
    return `${workSessionId}:${page}:${perPage}`;
  }, [workSessionId, page, perPage]);

  useEffect(() => {
    if (!enabled) return;
    if (!workSessionId) return;
    if (!requestKey) return;
    // 同一キー（session/page/perPage）の再レンダリングによる再取得を抑止。
    if (loadedKey === requestKey) return;

    setLoading(true);
    setError(null);

    fetchRiskAssessmentsWithMeta(workSessionId, { page, perPage })
      .then(({ data, pagination }) => {
        setRiskAssessments(data);
        setTotalPages(pagination.totalPages);
        setTotalCount(pagination.totalCount);
        setLoadedKey(requestKey);
      })
      .catch((e) => {
        console.error('failed to fetch risk assessments', e);
        setError(
          formatApiErrorMessage(e, {
            // backendの方針によっては権限不足を404で返す可能性があるため、
            // 403/404は同じ文言でも破綻しないようにしておく。
            forbidden: '権限がありません',
            notFound: '見つかりません',
            network: 'ネットワークエラーが発生しました',
            default: DEFAULT_ERROR_MESSAGE,
          }),
        );
      })
      .finally(() => setLoading(false));
  }, [enabled, workSessionId, requestKey, loadedKey, page, perPage]);

  const canPrev = page > 1;
  const canNext = totalPages ? page < totalPages : (riskAssessments?.length ?? 0) >= perPage;

  return {
    riskAssessments,
    loading,
    error,
    page,
    perPage,
    totalPages,
    totalCount,
    canPrev,
    canNext,
    setPage,
    prevPage: () => setPage((p) => (p > 1 ? p - 1 : p)),
    nextPage: () => setPage((p) => p + 1),
    retry: () => {
      // 抑止フラグを解除して、同一session/pageでも再取得できるようにする。
      setLoadedKey(null);
    },
  };
}
