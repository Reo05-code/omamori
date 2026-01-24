import { useCallback, useEffect, useState } from 'react';

import { fetchRiskAssessments } from '../lib/api/risk_assessments';
import type { ApiId, RiskAssessmentLevel } from '../lib/api/types';

type Options = {
  workSessionId: ApiId | null;
};

export function useLatestRiskAssessment({ workSessionId }: Options) {
  const [riskLevel, setRiskLevel] = useState<RiskAssessmentLevel | null>('caution');
  const [riskLoading, setRiskLoading] = useState<boolean>(false);

  const refreshLatestRisk = useCallback(async () => {
    if (!workSessionId) return;

    setRiskLoading(true);
    try {
      const data = await fetchRiskAssessments(workSessionId, {
        page: 1,
        perPage: 1,
        order: 'desc',
      });

      if (data.length > 0) {
        setRiskLevel(data[0].level);
      } else {
        // 新規セッション直後はリスク評価がまだ無い場合があるため、
        // ユーザーの元気タッチを阻害しないように一旦 caution 扱いにする
        setRiskLevel('caution');
      }
    } catch (e) {
      console.error('failed to fetch latest risk assessment', e);
      // 取得失敗時は操作を完全に止めない
      setRiskLevel('caution');
    } finally {
      setRiskLoading(false);
    }
  }, [workSessionId]);

  // セッション取得/切り替え時に最新リスクを取得
  useEffect(() => {
    if (!workSessionId) return;
    refreshLatestRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workSessionId]);

  return {
    riskLevel,
    setRiskLevel,
    riskLoading,
    refreshLatestRisk,
  };
}
