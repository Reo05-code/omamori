import type { ApiId, RiskAssessmentResponse } from './types';
import { api, apiRequestWithHeaders, ApiError } from './client';
import { API_PATHS } from './paths';

type FetchRiskAssessmentsParams = {
  page?: number;
  perPage?: number;
  order?: 'asc' | 'desc';
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
  if (params.order === 'asc' || params.order === 'desc') {
    searchParams.set('order', params.order);
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

export type RiskAssessmentsPagination = {
  page: number;
  perPage: number;
  totalCount: number | null;
  totalPages: number | null;
};

/**
 * RiskAssessments一覧をページング付きで取得。レスポンスヘッダからページング情報を抽出して返す。
 * 呼び出し側で totalCount/totalPages を使用してページネーションUI を制御可能。
 */
export async function fetchRiskAssessmentsWithMeta(
  workSessionId: ApiId,
  params?: FetchRiskAssessmentsParams,
): Promise<{ data: RiskAssessmentResponse[]; pagination: RiskAssessmentsPagination }> {
  const page = typeof params?.page === 'number' ? params.page : 1;
  const perPage = typeof params?.perPage === 'number' ? params.perPage : 100;

  const path = `${API_PATHS.WORK_SESSIONS.RISK_ASSESSMENTS(workSessionId)}${buildQuery({
    page,
    perPage,
  })}`;

  const res = await apiRequestWithHeaders<RiskAssessmentResponse[]>('GET', path);

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch risk assessments: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  const totalCountRaw = res.headers?.get('x-total-count');
  const totalPagesRaw = res.headers?.get('x-total-pages');

  const totalCount = totalCountRaw ? Number(totalCountRaw) : null;
  const totalPages = totalPagesRaw ? Number(totalPagesRaw) : null;

  return {
    data: res.data,
    pagination: {
      page,
      perPage,
      totalCount: Number.isFinite(totalCount) ? totalCount : null,
      totalPages: Number.isFinite(totalPages) ? totalPages : null,
    },
  };
}
