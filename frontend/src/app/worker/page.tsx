'use client';

import React, { useCallback, useEffect, useState } from 'react';
import WorkerShell from '../../components/worker/WorkerShell';
import StartView from '../../components/worker/StartView';
import MonitoringView from '../../components/worker/MonitoringView';
import ConfirmModal from '../../components/ui/ConfirmModal';
import NotificationBanner from '../../components/ui/NotificationBanner';
import Spinner from '../../components/ui/Spinner';
import { useWorkerSession } from '../../hooks/useWorkerSession';
import { getCurrentPositionBestEffort, getDeviceInfoWithLocation } from '../../lib/geolocation';
import { api } from '../../lib/api/client';
import { API_PATHS } from '../../lib/api/paths';
import type { Organization } from '../../types';

type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function WorkerHomePage() {
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [loadingOrg, setLoadingOrg] = useState<boolean>(true);

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

  // 進行中セッションがあれば組織IDは確定できる
  useEffect(() => {
    if (!organizationId && session?.organization_id) {
      setOrganizationId(session.organization_id);
      setLoadingOrg(false);
    }
  }, [organizationId, session?.organization_id]);

  // 組織IDがない場合は最初の組織を取得
  useEffect(() => {
    if (!organizationId && !session) {
      const ctrl = new AbortController();
      setLoadingOrg(true);

      async function fetchOrgs() {
        try {
          const res = await api.get<Organization[]>(API_PATHS.ORGANIZATIONS.BASE, {
            signal: ctrl.signal,
          });

          if (res.error) {
            throw new Error(res.error);
          }

          const orgs = res.data || [];

          if (orgs.length === 0) {
            setNotification({ message: '組織が見つかりません', type: 'error' });
          } else {
            setOrganizationId(orgs[0].id);
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          console.error('failed to fetch organizations', e);
          setNotification({ message: '組織の取得に失敗しました', type: 'error' });
        } finally {
          setLoadingOrg(false);
        }
      }

      fetchOrgs();
      return () => ctrl.abort();
    }
    if (organizationId) {
      setLoadingOrg(false);
    }
  }, [organizationId, session]);

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
    // 位置情報とバッテリーレベルを取得
    const deviceInfo = await getDeviceInfoWithLocation();

    if (!deviceInfo) {
      setNotification({
        message: '位置情報の取得に失敗しました。設定を確認してください',
        type: 'error',
      });
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

    // 位置情報（ベストエフォート取得）
    // SOSでは「送信できないこと」が最悪のリスクなので、短時間で取得を諦めてもアラート自体は送信する
    const position = await getCurrentPositionBestEffort({ timeoutMs: 4000 });
    const coords = position
      ? { latitude: position.latitude, longitude: position.longitude }
      : undefined;

    const result = await sendSos(coords);

    if (!result.ok) {
      setNotification({ message: result.message, type: 'error' });
      return;
    }

    if (result.duplicate) {
      setNotification({ message: 'SOSは送信済みです。安全な場所で待機してください', type: 'info' });
      return;
    }

    setNotification({
      message: 'SOSを送信しました。安全な場所で待機してください',
      type: 'success',
    });
  }, [session, sendSos]);

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
