'use client';

import React, { useCallback, useEffect, useState } from 'react';
import WorkerShell from '../../components/worker/WorkerShell';
import StartView from '../../components/worker/StartView';
import MonitoringView from '../../components/worker/MonitoringView';
import ConfirmModal from '../../components/ui/ConfirmModal';
import NotificationBanner from '../../components/ui/NotificationBanner';
import Spinner from '../../components/ui/Spinner';
import { useLatestRiskAssessment } from '../../hooks/useLatestRiskAssessment';
import { useNotificationBanner } from '../../hooks/useNotificationBanner';
import { usePollingWhenIdle } from '../../hooks/usePollingWhenIdle';
import { useUndoCountdown } from '../../hooks/useUndoCountdown';
import { useWorkerOrganization } from '../../hooks/useWorkerOrganization';
import { useWorkerSession } from '../../hooks/useWorkerSession';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { getCurrentPositionBestEffort, getDeviceInfoWithLocation } from '../../lib/geolocation';
import { deleteSafetyLog } from '../../lib/api/safety_logs';
import { WORKER_CONFIG } from '../../config/worker';
import { WORKER, COMMON } from '@/constants/ui-messages';

export default function WorkerHomePage() {
  const {
    session,
    loadingSession,
    actionLoading,
    error: sessionError,
    start,
    finish,
    sendSos,
    checkIn,
    refreshCurrent,
  } = useWorkerSession();

  const isVisible = usePageVisibility();

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null);
  const [undoLoading, setUndoLoading] = useState<boolean>(false);

  const {
    notification,
    dismissNotification,
    notifySuccess,
    notifyError,
    notifyInfo,
    setNotification,
  } = useNotificationBanner();

  const handleOrganizationError = useCallback(
    (message: string) => {
      notifyError(message);
    },
    [notifyError],
  );

  const { organizationId, loadingOrg } = useWorkerOrganization({
    session,
    onError: handleOrganizationError,
  });

  const { riskLevel, setRiskLevel, riskLoading, refreshLatestRisk } = useLatestRiskAssessment({
    workSessionId: session ? session.id : null,
  });

  const { undoInfo, undoSecondsLeft, startUndo, clearUndo } = useUndoCountdown({
    intervalMs: 1000,
  });

  // セッションエラーを通知バナーに変換
  useEffect(() => {
    if (sessionError) {
      const type = sessionError.includes('既に終了') ? 'info' : 'error';
      setNotification({ message: sessionError, type });
    }
  }, [sessionError, setNotification]);

  // StartView 滞在中のみポーリングでセッションを検知（可視時のみ）
  usePollingWhenIdle({
    enabled: Boolean(isVisible && !session && !loadingSession),
    intervalMs: WORKER_CONFIG.START_VIEW_POLL_INTERVAL_MS,
    onTick: refreshCurrent,
  });

  // 見守り開始
  const handleStart = useCallback(async () => {
    if (!organizationId) {
      notifyError(WORKER.MONITORING.ERRORS.ORG_ID_MISSING);
      return;
    }

    const result = await start(organizationId);

    if (result.ok) {
      notifySuccess(WORKER.MONITORING.MESSAGES.START_SUCCESS);
    }
  }, [organizationId, start, notifyError, notifySuccess]);

  const handleCheckIn = useCallback(async () => {
    if (undoInfo) {
      notifyInfo(WORKER.CHECK_IN.MESSAGES.WAIT_UNDO);
      return;
    }

    if (riskLoading) {
      notifyInfo(WORKER.CHECK_IN.MESSAGES.RISK_LOADING);
      return;
    }

    if (riskLevel === 'safe') {
      notifyInfo(WORKER.CHECK_IN.MESSAGES.NOT_NEEDED);
      return;
    }

    // critical（danger）の時は「長押し完了」タイミングで振動
    if (riskLevel === 'danger') {
      try {
        navigator.vibrate?.(200);
      } catch {
        // ignore
      }
    }

    // 位置情報とバッテリーレベルを取得
    // NOTE: 元気タッチではバッテリー情報も重要なため getDeviceInfoWithLocation を使用
    const deviceInfo = await getDeviceInfoWithLocation();

    if (!deviceInfo) {
      notifyError(WORKER.CHECK_IN.ERRORS.LOCATION_FAILED);
      return;
    }

    // バッテリー情報が取得できない場合は0を送信（バックエンドで判断させる）
    const batteryLevel = deviceInfo.batteryLevel ?? 0;

    const params = {
      latitude: deviceInfo.latitude,
      longitude: deviceInfo.longitude,
      batteryLevel,
      triggerType: 'check_in' as const,
      gpsAccuracy: deviceInfo.accuracy,
      loggedAt: new Date().toISOString(),
    };

    const created = await checkIn(params);
    if (!created) return;

    setLastCheckInTime(
      new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    );
    setRiskLevel(created.risk_level);

    const parsedExpiresAt = created.undo_expires_at ? Date.parse(created.undo_expires_at) : NaN;
    const expiresAt = Number.isFinite(parsedExpiresAt)
      ? parsedExpiresAt
      : Date.now() + WORKER_CONFIG.UNDO_WINDOW_MS;
    startUndo({ safetyLogId: created.safety_log.id, expiresAt });
    notifySuccess(WORKER.CHECK_IN.MESSAGES.SUCCESS);
  }, [
    checkIn,
    notifyError,
    notifyInfo,
    notifySuccess,
    riskLevel,
    riskLoading,
    setRiskLevel,
    startUndo,
    undoInfo,
  ]);

  const handleUndo = useCallback(async () => {
    if (!session || !undoInfo) return;

    setUndoLoading(true);
    try {
      await deleteSafetyLog(session.id, undoInfo.safetyLogId);
      clearUndo();
      notifySuccess(WORKER.CHECK_IN.MESSAGES.UNDO_SUCCESS);
      await refreshLatestRisk();
    } catch (e: any) {
      console.error('failed to undo safety log', e);
      const message = e?.message ? String(e.message) : WORKER.CHECK_IN.ERRORS.UNDO_FAILED;
      notifyError(message);
    } finally {
      setUndoLoading(false);
    }
  }, [session, undoInfo, refreshLatestRisk, clearUndo, notifyError, notifySuccess]);

  // SOS送信
  const handleSos = useCallback(async () => {
    if (!session) {
      notifyInfo(WORKER.SOS.MESSAGES.NEED_SESSION);
      return;
    }

    // 位置情報（ベストエフォート取得）
    // NOTE: SOSでは「送信できないこと」が最悪のリスクなので、
    // バッテリー情報不要かつ短時間タイムアウトの getCurrentPositionBestEffort を使用
    const position = await getCurrentPositionBestEffort({
      timeoutMs: WORKER_CONFIG.SOS_LOCATION_TIMEOUT_MS,
    });
    const coords = position
      ? { latitude: position.latitude, longitude: position.longitude }
      : undefined;

    const result = await sendSos(coords);

    if (!result.ok) {
      notifyError(result.message);
      return;
    }

    if (result.duplicate) {
      notifyInfo(WORKER.SOS.MESSAGES.DUPLICATE);
      return;
    }

    notifySuccess(WORKER.SOS.MESSAGES.SUCCESS);
  }, [notifyError, notifyInfo, notifySuccess, sendSos, session]);

  // 終了確認モーダルを開く
  const handleFinishRequest = useCallback(() => {
    setShowFinishModal(true);
  }, []);

  // 終了実行
  const handleFinishConfirm = useCallback(async () => {
    setShowFinishModal(false);
    const result = await finish();

    if (result.ok && result.alreadyFinished) {
      notifyInfo(WORKER.MONITORING.MESSAGES.ALREADY_FINISHED);
      // refreshCurrent で session=null にする
      await refreshCurrent();
      return;
    }

    if (result.ok) {
      notifySuccess(WORKER.MONITORING.MESSAGES.FINISH_SUCCESS);
    }
  }, [finish, notifyInfo, notifySuccess, refreshCurrent]);

  // 通知を閉じる
  const handleDismissNotification = dismissNotification;

  // 初回読み込み中（組織情報またはセッション情報）
  if ((loadingOrg || loadingSession) && !session) {
    return (
      <WorkerShell>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label={COMMON.STATUS.LOADING} />
        </div>
      </WorkerShell>
    );
  }

  return (
    <WorkerShell>
      {/* 通知バナー */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={handleDismissNotification}
        />
      )}

      {/* セッション有無で画面切替 */}
      {session ? (
        <MonitoringView
          lastCheckInTime={lastCheckInTime}
          onCheckIn={handleCheckIn}
          onSos={handleSos}
          onFinish={handleFinishRequest}
          checkInLoading={actionLoading.checkIn}
          sosLoading={actionLoading.sos}
          riskLevel={riskLevel}
          riskLoading={riskLoading}
          undoSecondsLeft={undoSecondsLeft}
          undoLoading={undoLoading}
          onUndo={handleUndo}
        />
      ) : (
        <StartView onStart={handleStart} loading={actionLoading.start} />
      )}

      {/* 終了確認モーダル */}
      <ConfirmModal
        open={showFinishModal}
        title={WORKER.MONITORING.MODAL.FINISH_TITLE}
        description={WORKER.MONITORING.MODAL.FINISH_DESCRIPTION}
        confirmText={WORKER.MONITORING.LABELS.FINISH}
        cancelText={COMMON.BUTTONS.CANCEL}
        confirmDanger={true}
        onConfirm={handleFinishConfirm}
        onCancel={() => setShowFinishModal(false)}
      />
    </WorkerShell>
  );
}
