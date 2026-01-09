import type { AlertResponse, AlertStatus, UpdateOrganizationAlertRequest } from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

export async function createSosAlert(
  workSessionId: number,
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

// GET /api/v1/organizations/:organization_id/alerts
export async function fetchOrganizationAlerts(
  organizationId: string | number,
): Promise<AlertResponse[]> {
  const res = await api.get<AlertResponse[]>(API_PATHS.ORGANIZATIONS.ALERTS(organizationId));

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
