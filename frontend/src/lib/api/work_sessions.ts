import type { GetCurrentWorkSessionResponse, WorkSession } from './types';
import { api } from './client';
import { API_PATHS } from './paths';

export async function getCurrentSession(signal?: AbortSignal): Promise<WorkSession | null> {
  // 現在の作業セッションを取得する
  // 通信キャンセルを可能にするため引数にsignalを追加
  const res = await api.get<GetCurrentWorkSessionResponse>(API_PATHS.WORK_SESSIONS.CURRENT, {
    signal,
  });

  if (res.error) {
    throw new Error(res.error);
  }

  if (!res.data) return null;
  return res.data.work_session;
}

// 作業セッションを開始する
export async function startSession(organizationId: number): Promise<WorkSession> {
  const res = await api.post<WorkSession>(API_PATHS.WORK_SESSIONS.CREATE, {
    work_session: { organization_id: organizationId },
  });

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to start session: status=${res.status}`);
  }

  return res.data;
}

// 作業セッションを終了する
export async function finishSession(workSessionId: number): Promise<WorkSession> {
  const res = await api.post<WorkSession>(API_PATHS.WORK_SESSIONS.FINISH(workSessionId));

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to finish session: status=${res.status}`);
  }

  return res.data;
}
