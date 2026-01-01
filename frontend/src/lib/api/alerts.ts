import type { AlertResponse } from './types';
import { api } from './client';
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
    throw new Error(res.error);
  }

  if (!res.data) return { duplicate: false, alert: null };

  // 200 duplicate: { message, alert }（既存のアラートがある場合）
  if (typeof (res.data as any).message === 'string') {
    return { duplicate: true, alert: (res.data as any).alert ?? null };
  }

  // 201 created: alert JSON（新規作成の場合）
  return { duplicate: false, alert: res.data as AlertResponse };
}
