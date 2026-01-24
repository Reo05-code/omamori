import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createSosAlert } from '../lib/api/alerts';
import { createSafetyLog } from '../lib/api/safety_logs';
import { finishSession, getCurrentSession, startSession } from '../lib/api/work_sessions';
import type {
  ApiId,
  CreateSafetyLogResponse,
  SafetyLogTriggerType,
  WorkSession,
} from '../lib/api/types';
import { ApiError } from '../lib/api/client';
import { normalizeErrorMessage } from '../lib/api/error-utils';

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

type StartResult =
  | { ok: true; session: WorkSession }
  | { ok: false; message: string; status?: number };

type FinishResult =
  | { ok: true; alreadyFinished?: boolean }
  | { ok: false; message: string; status?: number };

export function useWorkerSession() {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<ActionLoading>({});
  const [error, setError] = useState<string | null>(null);

  // NOTE: mountedRef パターンは React 18 の並行レンダリングでは推奨されない。
  // AbortController によるキャンセル処理を主とし、mountedRef はレガシー互換として残す。
  // 将来的には AbortController のみに統一することを推奨。
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
    async (organizationId: ApiId): Promise<StartResult> => {
      setAction('start', true);
      setError(null);

      try {
        const ws = await startSession(organizationId);
        if (!mountedRef.current) {
          return { ok: false, message: '画面が閉じられたため処理を中断しました' };
        }
        setSession(ws);
        return { ok: true, session: ws };
      } catch (err) {
        if (!mountedRef.current) {
          return { ok: false, message: '画面が閉じられたため処理を中断しました' };
        }
        const { message, status } = normalizeErrorMessage(err);
        setError(message);
        return { ok: false, message, status };
      } finally {
        if (mountedRef.current) setAction('start', false);
      }
    },
    [setAction],
  );

  const finish = useCallback(async (): Promise<FinishResult> => {
    if (!session) {
      const message = '作業セッションが開始されていません';
      setError(message);
      return { ok: false, message };
    }

    setAction('finish', true);
    setError(null);

    try {
      await finishSession(session.id);
      if (!mountedRef.current) {
        return { ok: false, message: '画面が閉じられたため処理を中断しました' };
      }
      setSession(null);
      return { ok: true };
    } catch (err) {
      if (!mountedRef.current) {
        return { ok: false, message: '画面が閉じられたため処理を中断しました' };
      }

      // Admin が先に終了させた等: 404 は「既に終了」扱いでホームに戻す
      if (err instanceof ApiError && err.status === 404) {
        setSession(null);
        setError(null);
        return { ok: true, alreadyFinished: true };
      }

      const { message, status } = normalizeErrorMessage(err);
      setError(message);
      return { ok: false, message, status };
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
    async (params: CheckInParams): Promise<CreateSafetyLogResponse | null> => {
      if (!session) {
        setError('作業セッションが開始されていません');
        return null;
      }

      setAction('checkIn', true);
      setError(null);

      try {
        const created = await createSafetyLog(session.id, params);
        if (!mountedRef.current) return null;
        return created;
      } catch (err) {
        if (!mountedRef.current) return null;
        const { message } = normalizeErrorMessage(err);
        setError(message);
        return null;
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
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCurrent(); // ブラウザタブが表示されたら再取得
      }
    };

    // イベントリスナーの登録
    document.addEventListener('visibilitychange', onVisibilityChange);

    // クリーンアップ関数（アンマウント時に実行される）
    return () => {
      mountedRef.current = false; // 「この画面はもう消えます」フラグOFF
      refreshAbortRef.current?.abort(); // 通信中なら強制キャンセル

      // リスナー削除（これを忘れるとイベントが残り続け、メモリを食い潰す）
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
