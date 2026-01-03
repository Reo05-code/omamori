import type {
  CreateSafetyLogRequest,
  CreateSafetyLogResponse,
  SafetyLogTriggerType,
} from './types';
import { api, ApiError } from './client';
import { API_PATHS } from './paths';

export async function createSafetyLog(
  // 指定された作業セッション
  workSessionId: number,
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
