import type {
  CreateSafetyLogRequest,
  CreateSafetyLogResponse,
  SafetyLogResponse,
  SafetyLogTriggerType,
  ApiId,
} from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

export async function fetchSafetyLogs(workSessionId: ApiId): Promise<SafetyLogResponse[]> {
  const res = await api.get<SafetyLogResponse[]>(
    API_PATHS.WORK_SESSIONS.SAFETY_LOGS(workSessionId),
  );

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to fetch safety logs: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}

export async function createSafetyLog(
  // 指定された作業セッション
  workSessionId: ApiId,
  params: {
    latitude: number;
    longitude: number;
    batteryLevel: number;
    triggerType: SafetyLogTriggerType;
    gpsAccuracy?: number;
    loggedAt?: string;
  },
): Promise<CreateSafetyLogResponse> {
  const body: CreateSafetyLogRequest = {
    safety_log: {
      latitude: params.latitude,
      longitude: params.longitude,
      battery_level: params.batteryLevel,
      trigger_type: params.triggerType,
      gps_accuracy: params.gpsAccuracy,
      logged_at: params.loggedAt,
    },
  };

  const res = await api.post<CreateSafetyLogResponse>(
    API_PATHS.WORK_SESSIONS.SAFETY_LOGS(workSessionId),
    body,
  );

  if (res.error || res.data === null) {
    throw new ApiError(
      res.error || `failed to create safety log: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }

  return res.data;
}

export async function deleteSafetyLog(workSessionId: ApiId, safetyLogId: ApiId): Promise<void> {
  const res = await api.delete<{ status: 'success' }>(
    API_PATHS.WORK_SESSIONS.SAFETY_LOG(workSessionId, safetyLogId),
  );

  if (res.error) {
    throw new ApiError(
      res.error || `failed to delete safety log: status=${res.status}`,
      res.status,
      res.errorBody,
    );
  }
}
