'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import WorkerShell from '../../components/worker/WorkerShell';
import StartView from '../../components/worker/StartView';
import MonitoringView from '../../components/worker/MonitoringView';
import ConfirmModal from '../../components/ui/ConfirmModal';
import NotificationBanner from '../../components/ui/NotificationBanner';
import Spinner from '../../components/ui/Spinner';
import { useWorkerSession } from '../../hooks/useWorkerSession';

type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function WorkerHomePage() {
  const params = useParams();
  const organizationId = params?.id ? Number(params.id) : null;

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

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null);

  // セッションエラーを通知バナーに変換
  useEffect(() => {
    if (sessionError) {
      setNotification({ message: sessionError, type: 'error' });
    }
  }, [sessionError]);

  // 見守り開始
  const handleStart = useCallback(async () => {
    if (!organizationId) {
      setNotification({ message: '組織IDが取得できませんでした', type: 'error' });
      return;
    }

    await start(organizationId);

    if (!sessionError) {
      setNotification({ message: '見守りを開始しました', type: 'success' });
    }
  }, [organizationId, start, sessionError]);

  const handleCheckIn = useCallback(async () => {
    // 位置情報取得（簡易実装：実際は navigator.geolocation を使用）
    const params = {
      latitude: 35.6812,
      longitude: 139.7671,
      batteryLevel: 80,
      triggerType: 'check_in' as const,
      loggedAt: new Date().toISOString(),
    };

    await checkIn(params);

    if (!sessionError) {
      setLastCheckInTime(
        new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      );
      setNotification({ message: '安否を報告しました', type: 'success' });
    }
  }, [checkIn, sessionError]);

  // SOS送信
  const handleSos = useCallback(async () => {
    if (!session) {
      setNotification({
        message: '見守りを開始してからSOSを送信してください',
        type: 'info',
      });
      return;
    }

    // 位置情報取得（簡易実装）
    const coords = {
      latitude: 35.6812,
      longitude: 139.7671,
    };

    await sendSos(coords);

    if (!sessionError) {
      setNotification({ message: 'SOSを送信しました', type: 'success' });
    } else if (sessionError.includes('既に')) {
      setNotification({ message: '既に同様のSOSが送信されています', type: 'info' });
    }
  }, [session, sendSos, sessionError]);

  // 終了確認モーダルを開く
  const handleFinishRequest = useCallback(() => {
    setShowFinishModal(true);
  }, []);

  // 終了実行
  const handleFinishConfirm = useCallback(async () => {
    setShowFinishModal(false);
    await finish();

    if (!sessionError) {
      setNotification({ message: '見守りを終了しました', type: 'success' });
    } else if (sessionError.includes('既に終了')) {
      setNotification({ message: '作業セッションは既に終了されています', type: 'info' });
      // refreshCurrent で session=null にする
      await refreshCurrent();
    }
  }, [finish, sessionError, refreshCurrent]);

  // 通知を閉じる
  const handleDismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // 初回読み込み中
  if (loadingSession && !session) {
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
        />
      ) : (
        <StartView
          onStart={handleStart}
          onSos={handleSos}
          loading={actionLoading.start}
          sosLoading={actionLoading.sos}
        />
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
