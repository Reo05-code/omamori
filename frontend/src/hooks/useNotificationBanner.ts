import { useCallback, useState } from 'react';

import type { Notification, NotificationType } from '../types/ui';

export function useNotificationBanner() {
  const [notification, setNotification] = useState<Notification | null>(null);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const notify = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
  }, []);

  const notifySuccess = useCallback(
    (message: string) => {
      notify(message, 'success');
    },
    [notify],
  );

  const notifyError = useCallback(
    (message: string) => {
      notify(message, 'error');
    },
    [notify],
  );

  const notifyInfo = useCallback(
    (message: string) => {
      notify(message, 'info');
    },
    [notify],
  );

  return {
    notification,
    setNotification,
    dismissNotification,
    notifySuccess,
    notifyError,
    notifyInfo,
  };
}
