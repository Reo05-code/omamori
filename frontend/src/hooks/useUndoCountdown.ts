import { useCallback, useEffect, useState } from 'react';

type UndoInfo = {
  safetyLogId: number;
  expiresAt: number;
};

type Options = {
  intervalMs?: number;
};

export function useUndoCountdown(options?: Options) {
  const intervalMs = options?.intervalMs ?? 1000;

  const [undoInfo, setUndoInfo] = useState<UndoInfo | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number>(0);

  const clearUndo = useCallback(() => {
    setUndoInfo(null);
  }, []);

  const startUndo = useCallback((info: UndoInfo) => {
    setUndoInfo(info);
  }, []);

  // Undo カウントダウン
  useEffect(() => {
    if (!undoInfo) {
      setUndoSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remainingMs = undoInfo.expiresAt - Date.now();
      const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setUndoSecondsLeft(seconds);

      if (remainingMs <= 0) {
        setUndoInfo(null);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [undoInfo, intervalMs]);

  return {
    undoInfo,
    startUndo,
    clearUndo,
    undoSecondsLeft,
  };
}

export type { UndoInfo };
