import type {
  AlertResponse,
  AlertStatus,
  AlertSummaryResponse,
  ApiId,
  UpdateOrganizationAlertRequest,
} from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

export async function createSosAlert(
  workSessionId: ApiId,
  coords?: { latitude: number; longitude: number },
): Promise<{ duplicate: boolean; alert: AlertResponse | null }> {
  // 位置情報があれば body に含める
  const body = coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined;

  // 新規作成か重複かに関わらず AlertResponse またはメッセージを返す
  const res = await api.post<AlertResponse | { message: string; alert: AlertResponse }>(
    API_PATHS.WORK_SESSIONS.ALERTS(workSessionId),
    body,
  );

  if (res.error) {
    throw new ApiError(res.error, res.status, res.errorBody);
  }

  if (!res.data) return { duplicate: false, alert: null };

  // 200 duplicate: { message, alert }（既存のアラートがある場合）
  if (typeof (res.data as any).message === 'string') {
    return { duplicate: true, alert: (res.data as any).alert ?? null };
  }

  // 201 created: alert JSON（新規作成の場合）
  return { duplicate: false, alert: res.data as AlertResponse };
}

// GET /api/v1/organizations/:organization_id/alerts のクエリパラメータ型
// status: open/in_progress/resolved をCSV形式で複数指定可
// urgent: true=緊急のみ、false=緊急以外
// limit: 取得件数（デフォルト20、最小1、最大100）
export type OrganizationAlertsQuery = {
  status?: AlertStatus | AlertStatus[];
  urgent?: boolean;
  limit?: number;
};

// OrganizationAlertsQuery をURLクエリ文字列に変換する
// クエリが無い場合は空文字列を返す
export function buildOrganizationAlertsQuery(query?: OrganizationAlertsQuery): string {
  if (!query) return '';

  const params = new URLSearchParams();

  const statusValue = Array.isArray(query.status) ? query.status.join(',') : query.status;
  if (statusValue) params.set('status', statusValue);

  if (typeof query.urgent === 'boolean') params.set('urgent', String(query.urgent));

  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    params.set('limit', String(query.limit));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// GET /api/v1/organizations/:organization_id/alerts
// query: status/urgent/limit フィルタを指定可（URLクエリとして API に渡される）
// signal: AbortSignal で途中キャンセル可
export async function fetchOrganizationAlerts(
  organizationId: string | number,
  query?: OrganizationAlertsQuery,
  signal?: AbortSignal,
): Promise<AlertResponse[]> {
  const path = `${API_PATHS.ORGANIZATIONS.ALERTS(organizationId)}${buildOrganizationAlertsQuery(
    query,
  )}`;

  const res = await api.get<AlertResponse[]>(path, signal ? { signal } : undefined);

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch alerts: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}

// PATCH /api/v1/organizations/:organization_id/alerts/:id
export async function updateOrganizationAlertStatus(
  organizationId: string | number,
  alertId: string | number,
  status: AlertStatus,
): Promise<AlertResponse> {
  const body: UpdateOrganizationAlertRequest = { alert: { status } };
  const res = await api.patch<AlertResponse>(
    API_PATHS.ORGANIZATIONS.ALERT(organizationId, alertId),
    body,
  );

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to update alert: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}

// GET /api/v1/organizations/:organization_id/alerts/summary
// ダッシュボードのカード表示用に、アラートの集計件数と内訳を取得
export async function fetchOrganizationAlertsSummary(
  organizationId: string | number,
  signal?: AbortSignal,
): Promise<AlertSummaryResponse> {
  const path = API_PATHS.ORGANIZATIONS.ALERTS_SUMMARY(organizationId);
  const res = await api.get<AlertSummaryResponse>(path, signal ? { signal } : undefined);

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch alert summary: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}
