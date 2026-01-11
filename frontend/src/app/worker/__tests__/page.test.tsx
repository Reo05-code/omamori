import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WorkerHomePage from '../page';

jest.mock('../../../hooks/useWorkerSession', () => ({
  useWorkerSession: jest.fn(),
}));

jest.mock('../../../lib/geolocation', () => ({
  getCurrentPositionBestEffort: jest.fn(async () => null),
  getDeviceInfoWithLocation: jest.fn(async () => null),
}));

jest.mock('../../../lib/api/client', () => ({
  api: {
    get: jest.fn(async () => ({ data: [{ id: 1 }], error: null })),
  },
}));

jest.mock('../../../lib/api/paths', () => ({
  API_PATHS: {
    ORGANIZATIONS: {
      BASE: '/api/v1/organizations',
    },
  },
}));

// 長押し操作の時間依存を避けるため、テストでは「クリック＝長押し完了」として扱う
jest.mock('../../../components/ui/LongPressButton', () => ({
  __esModule: true,
  default: ({ onLongPress, ariaLabel, disabled, loading, children }: any) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onLongPress()}
      disabled={Boolean(disabled) || Boolean(loading)}
    >
      {children}
    </button>
  ),
}));

describe('/worker page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SOS長押しで sendSos が呼ばれる', async () => {
    const { useWorkerSession } = jest.requireMock('../../../hooks/useWorkerSession') as {
      useWorkerSession: jest.Mock;
    };

    const sendSos = jest.fn(async () => ({ ok: true, duplicate: false }));

    useWorkerSession.mockReturnValue({
      session: { id: 10, organization_id: 1 },
      loadingSession: false,
      actionLoading: { sos: false, checkIn: false, start: false, finish: false },
      error: null,
      start: jest.fn(),
      finish: jest.fn(),
      sendSos,
      checkIn: jest.fn(),
      refreshCurrent: jest.fn(),
    });

    render(<WorkerHomePage />);

    const sosButton = await screen.findByRole('button', { name: '緊急SOS（長押し）' });

    // LongPressButton はモックしているためクリックで即発火する
    fireEvent.click(sosButton);

    // SOS送信完了後に、送信されたことを知らせるメッセージが表示される
    expect(
      await screen.findByText('SOSを送信しました。安全な場所で待機してください'),
    ).toBeInTheDocument();

    await waitFor(() => expect(sendSos).toHaveBeenCalledTimes(1));
  });
});
