import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createSosAlert } from '../lib/api/alerts';
import { createSafetyLog } from '../lib/api/safety_logs';
import { finishSession, getCurrentSession, startSession } from '../lib/api/work_sessions';
import type { ApiId, SafetyLogTriggerType, WorkSession } from '../lib/api/types';
import { ApiError } from '../lib/api/client';

type ActionLoading = {
  start?: boolean;
  finish?: boolean;
  sos?: boolean;
  checkIn?: boolean;
};

type CheckInParams = {
  latitude: number;
  longitude: number;
  batteryLevel: number;
  triggerType: SafetyLogTriggerType;
  gpsAccuracy?: number;
  loggedAt?: string;
};

type SosSendResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; message: string; status?: number };

function normalizeErrorMessage(err: unknown): { message: string; status?: number } {
  if (err instanceof ApiError) {
    if (err.status === 0) return { message: 'ネットワークエラーが発生しました', status: 0 };
    if (err.status === 403) return { message: '権限がありません', status: 403 };
    return { message: err.message, status: err.status };
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: 'エラーが発生しました' };
}

export function useWorkerSession() {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<ActionLoading>({});
  const [error, setError] = useState<string | null>(null);

  // コンポーネントの再レンダリングはしたくないけど、内部に保持している値だけを更新したい場合は、保持したい値をuseStateではなく、useRefを利用する
  const mountedRef = useRef(true);
  const refreshAbortRef = useRef<AbortController | null>(null);
  const inflightRefreshRef = useRef(false);
  const lastRefreshAtRef = useRef<number>(0);

  const setAction = useCallback((key: keyof ActionLoading, value: boolean) => {
    setActionLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 現在のセッション情報をサーバーから取る
  const refreshCurrent = useCallback(async (signal?: AbortSignal) => {
    const now = Date.now();
    // 通信中なら何もしない
    if (inflightRefreshRef.current) return;
    // 直前の更新から3秒未満なら何もしない
    if (now - lastRefreshAtRef.current < 3000) return;

    lastRefreshAtRef.current = now;
    inflightRefreshRef.current = true;

    // 直前の通信があればキャンセルする
    refreshAbortRef.current?.abort();
    const ac = new AbortController();
    refreshAbortRef.current = ac;

    // 呼び出し元の signal があれば、どちらかが abort されたらキャンセル扱い
    const combinedSignal = signal;

    setLoadingSession(true);
    setError(null);

    try {
      const current = await getCurrentSession(combinedSignal ?? ac.signal);
      if (!mountedRef.current) return;
      setSession(current);
    } catch (err) {
      if (!mountedRef.current) return;
      const { message } = normalizeErrorMessage(err);
      setError(message);
    } finally {
      if (mountedRef.current) setLoadingSession(false);
      inflightRefreshRef.current = false;
    }
  }, []);

  const start = useCallback(
    async (organizationId: ApiId) => {
      setAction('start', true);
      setError(null);

      try {
        const ws = await startSession(organizationId);
        if (!mountedRef.current) return;
        setSession(ws);
      } catch (err) {
        if (!mountedRef.current) return;
        const { message } = normalizeErrorMessage(err);
        setError(message);
      } finally {
        if (mountedRef.current) setAction('start', false);
      }
    },
    [setAction],
  );

  const finish = useCallback(async () => {
    if (!session) {
      setError('作業セッションが開始されていません');
      return;
    }

    setAction('finish', true);
    setError(null);

    try {
      await finishSession(session.id);
      if (!mountedRef.current) return;
      setSession(null);
    } catch (err) {
      if (!mountedRef.current) return;

      // Admin が先に終了させた等: 404 は「既に終了」扱いでホームに戻す
      if (err instanceof ApiError && err.status === 404) {
        setSession(null);
        setError('作業セッションは既に終了されています');
        return;
      }

      const { message } = normalizeErrorMessage(err);
      setError(message);
    } finally {
      if (mountedRef.current) setAction('finish', false);
    }
  }, [session, setAction]);

  const sendSos = useCallback(
    async (coords?: { latitude: number; longitude: number }): Promise<SosSendResult> => {
      if (!session) {
        const message = '作業セッションが開始されていません';
        setError(message);
        return { ok: false, message };
      }

      setAction('sos', true);
      setError(null);

      try {
        const result = await createSosAlert(session.id, coords);
        return { ok: true, duplicate: result.duplicate };
      } catch (err) {
        const normalized = normalizeErrorMessage(err);
        if (mountedRef.current) {
          setError(normalized.message);
        }
        return { ok: false, message: normalized.message, status: normalized.status };
      } finally {
        if (mountedRef.current) setAction('sos', false);
      }
    },
    [session, setAction],
  );

  const checkIn = useCallback(
    async (params: CheckInParams) => {
      if (!session) {
        setError('作業セッションが開始されていません');
        return;
      }

      setAction('checkIn', true);
      setError(null);

      try {
        await createSafetyLog(session.id, params);
      } catch (err) {
        if (!mountedRef.current) return;
        const { message } = normalizeErrorMessage(err);
        setError(message);
      } finally {
        if (mountedRef.current) setAction('checkIn', false);
      }
    },
    [session, setAction],
  );

  useEffect(() => {
    // マウント時の初期化
    mountedRef.current = true; // 「この画面は表示されてますよ」フラグON
    refreshCurrent(); // まず最新データを取得しにいく

    // イベントハンドラの定義
    const onFocus = () => {
      refreshCurrent(); // ウィンドウにフォーカスが当たったら再取得
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCurrent(); // ブラウザタブが表示されたら再取得
      }
    };

    // イベントリスナーの登録
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // クリーンアップ関数（アンマウント時に実行される）
    return () => {
      mountedRef.current = false; // 「この画面はもう消えます」フラグOFF
      refreshAbortRef.current?.abort(); // 通信中なら強制キャンセル

      // リスナー削除（これを忘れるとイベントが残り続け、メモリを食い潰す）
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshCurrent]);

  // useMemo を使うことで「中身（依存配列の値）が変わった時だけ新しいオブジェクトを作る」という制御ができる
  return useMemo(
    () => ({
      session,
      loadingSession,
      actionLoading,
      error,
      refreshCurrent,
      start,
      finish,
      sendSos,
      checkIn,
    }),
    [
      session,
      loadingSession,
      actionLoading,
      error,
      refreshCurrent,
      start,
      finish,
      sendSos,
      checkIn,
    ],
  );
}
