import type { ApiId, RiskAssessmentResponse } from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

type FetchRiskAssessmentsParams = {
  page?: number;
  perPage?: number;
};

// APIに送る検索条件（クエリパラメータ）をURLの形式（例: ?page=1&per_page=20）に変換する
function buildQuery(params?: FetchRiskAssessmentsParams): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  if (typeof params.page === 'number') {
    searchParams.set('page', String(params.page));
  }
  if (typeof params.perPage === 'number') {
    searchParams.set('per_page', String(params.perPage));
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchRiskAssessments(
  workSessionId: ApiId,
  params?: FetchRiskAssessmentsParams,
): Promise<RiskAssessmentResponse[]> {
  // URLの組み立て
  // 例: "/api/v1/work_sessions/123/risk_assessments" + "?page=1&per_page=10"
  const path = `${API_PATHS.WORK_SESSIONS.RISK_ASSESSMENTS(workSessionId)}${buildQuery(params)}`;

  const res = await api.get<RiskAssessmentResponse[]>(path);

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch risk assessments: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}
