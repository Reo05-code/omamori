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
      notifyError('組織IDが取得できませんでした');
      return;
    }

    const result = await start(organizationId);

    if (result.ok) {
      notifySuccess('見守りを開始しました');
    }
  }, [organizationId, start, notifyError, notifySuccess]);

  const handleCheckIn = useCallback(async () => {
    if (undoInfo) {
      notifyInfo('直前の送信を取り消すか、時間切れを待ってください');
      return;
    }

    if (riskLoading) {
      notifyInfo('リスク判定中です。少し待ってください');
      return;
    }

    if (riskLevel === 'safe') {
      notifyInfo('現在は元気タッチの送信は不要です');
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
      notifyError('位置情報の取得に失敗しました。設定を確認してください');
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
    notifySuccess('安否を報告しました');
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
      notifySuccess('元気タッチを取り消しました');
      await refreshLatestRisk();
    } catch (e: any) {
      console.error('failed to undo safety log', e);
      const message = e?.message ? String(e.message) : '取り消しに失敗しました';
      notifyError(message);
    } finally {
      setUndoLoading(false);
    }
  }, [session, undoInfo, refreshLatestRisk, clearUndo, notifyError, notifySuccess]);

  // SOS送信
  const handleSos = useCallback(async () => {
    if (!session) {
      notifyInfo('見守りを開始してからSOSを送信してください');
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
      notifyInfo('SOSは送信済みです。安全な場所で待機してください');
      return;
    }

    notifySuccess('SOSを送信しました。安全な場所で待機してください');
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
      notifyInfo('作業セッションは既に終了されています');
      // refreshCurrent で session=null にする
      await refreshCurrent();
      return;
    }

    if (result.ok) {
      notifySuccess('見守りを終了しました');
    }
  }, [finish, notifyInfo, notifySuccess, refreshCurrent]);

  // 通知を閉じる
  const handleDismissNotification = dismissNotification;

  // 初回読み込み中（組織情報またはセッション情報）
  if ((loadingOrg || loadingSession) && !session) {
    return (
      <WorkerShell>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label="読み込み中..." />
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
        title="見守りを終了しますか？"
        description="終了すると、元気タッチやSOS発信ができなくなります。"
        confirmText="終了"
        cancelText="キャンセル"
        confirmDanger={true}
        onConfirm={handleFinishConfirm}
        onCancel={() => setShowFinishModal(false)}
      />
    </WorkerShell>
  );
}
