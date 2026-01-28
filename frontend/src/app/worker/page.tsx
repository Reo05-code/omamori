'use client';

import React, { useCallback, useEffect, useState } from 'react';
import WorkerShell from '../../components/worker/WorkerShell';
import StartView from '../../components/worker/StartView';
import MonitoringView from '../../components/worker/MonitoringView';
import ConfirmModal from '../../components/ui/ConfirmModal';
import NotificationBanner from '../../components/ui/NotificationBanner';
import Spinner from '../../components/ui/Spinner';
import SetHomeLocationModal from '../../components/worker/SetHomeLocationModal';
import { useAuth } from '../../hooks/useAuth';
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
import { WORKER, COMMON, NOTIFICATION } from '@/constants/ui-messages';

export default function WorkerHomePage() {
  const { user, refreshUser } = useAuth();
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
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);

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

  // オンボーディングモーダルの表示判定
  useEffect(() => {
    if (user && !user.onboarded && !dismissedOnboarding) {
      // localStorageで本日表示済みかチェック
      const dismissedDate = localStorage.getItem('home-location-dismissed-date');
      const today = new Date().toDateString();

      if (dismissedDate !== today) {
        setShowOnboardingModal(true);
      }
    }
  }, [user, dismissedOnboarding]);

  // オンボーディングモーダルのハンドラー
  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false);
    setDismissedOnboarding(true);
    // 本日は表示しない
    localStorage.setItem('home-location-dismissed-date', new Date().toDateString());
  };

  const handleOnboardingCompleted = async () => {
    setShowOnboardingModal(false);
    // 完了したらlocalStorageをクリア
    localStorage.removeItem('home-location-dismissed-date');
    // ユーザー情報を再取得して UI を更新
    await refreshUser();
  };

  const handleReopenOnboarding = () => {
    setShowOnboardingModal(true);
    setDismissedOnboarding(false);
  };

  // StartView 滞在中のみポーリングでセッションを検知（可視時のみ）
  usePollingWhenIdle({
    enabled: Boolean(isVisible && !session && !loadingSession),
    intervalMs: WORKER_CONFIG.START_VIEW_POLL_INTERVAL_MS,
    onTick: refreshCurrent,
  });

  // 見守り開始
  const handleStart = useCallback(async () => {
    if (!organizationId) {
      notifyError(NOTIFICATION.WORKER.MONITORING.ORG_ID_MISSING);
      return;
    }

    const result = await start(organizationId);

    if (result.ok) {
      notifySuccess(NOTIFICATION.WORKER.MONITORING.START_SUCCESS);
    }
  }, [organizationId, start, notifyError, notifySuccess]);

  const handleCheckIn = useCallback(async () => {
    if (undoInfo) {
      notifyInfo(NOTIFICATION.WORKER.CHECK_IN.WAIT_UNDO);
      return;
    }

    if (riskLoading) {
      notifyInfo(NOTIFICATION.WORKER.CHECK_IN.RISK_LOADING);
      return;
    }

    if (riskLevel === 'safe') {
      notifyInfo(NOTIFICATION.WORKER.CHECK_IN.NOT_NEEDED);
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
      notifyError(NOTIFICATION.WORKER.CHECK_IN.LOCATION_FAILED);
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
    notifySuccess(NOTIFICATION.WORKER.CHECK_IN.SUCCESS);
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
      notifySuccess(NOTIFICATION.WORKER.CHECK_IN.UNDO_SUCCESS);
      await refreshLatestRisk();
    } catch (e: any) {
      console.error('failed to undo safety log', e);
      const message = e?.message ? String(e.message) : NOTIFICATION.WORKER.CHECK_IN.UNDO_FAILED;
      notifyError(message);
    } finally {
      setUndoLoading(false);
    }
  }, [session, undoInfo, refreshLatestRisk, clearUndo, notifyError, notifySuccess]);

  // SOS送信
  const handleSos = useCallback(async () => {
    if (!session) {
      notifyInfo(NOTIFICATION.WORKER.SOS.NEED_SESSION);
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
      notifyInfo(NOTIFICATION.WORKER.SOS.DUPLICATE);
      return;
    }

    notifySuccess(NOTIFICATION.WORKER.SOS.SUCCESS);
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
      notifyInfo(NOTIFICATION.WORKER.MONITORING.ALREADY_FINISHED);
      // refreshCurrent で session=null にする
      await refreshCurrent();
      return;
    }

    if (result.ok) {
      notifySuccess(NOTIFICATION.WORKER.MONITORING.FINISH_SUCCESS);
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
      {/* 拠点未設定の警告バナー */}
      {user && !user.onboarded && dismissedOnboarding && (
        <div className="mx-4 mt-4 mb-2 rounded-lg bg-yellow-50 p-4 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {WORKER.SETTINGS.LABELS.HOME_LOCATION_NOT_SET}
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {WORKER.SETTINGS.LABELS.HOME_LOCATION_RECOMMENDATION}
                </p>
                <button
                  type="button"
                  onClick={handleReopenOnboarding}
                  className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                >
                  {WORKER.SETTINGS.BUTTONS.SET_HOME_LOCATION}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedOnboarding(false)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      {/* オンボーディングモーダル */}
      <SetHomeLocationModal
        open={showOnboardingModal}
        onClose={handleOnboardingSkip}
        onCompleted={handleOnboardingCompleted}
        onNotify={(_message, _type) => {
          // 通知は自動的に処理（notifySuccess, notifyError で表示）
        }}
        forceCreate={false}
      />
    </WorkerShell>
  );
}
