import { useEffect } from 'react';

type Options = {
  enabled: boolean;
  intervalMs: number;
  onTick: () => void;
};

export function usePollingWhenIdle({ enabled, intervalMs, onTick }: Options) {
  useEffect(() => {
    if (!enabled) return;

    const intervalId = window.setInterval(() => {
      onTick();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, onTick]);
}
